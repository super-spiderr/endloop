import { reloadLibrary, ROAST_LANGS, sanitizePack } from './index';
import { setNews } from './news';
import { lastChecked, liveVersion, readPack, setLastChecked, setLiveVersion, clearPack, writePack } from './pack-store';

/**
 * Cloud roast updates. The test board (endloop-bugboard, Roast admin → Publish) stores numbered
 * versions in Supabase; these two public functions only ever return the live one:
 *   GET /rest/v1/rpc/roast_manifest            -> { version, publishedAt, announce, packs: [{ lang, count, sha256 }] }
 *   GET /rest/v1/rpc/roast_pack?p_lang=<lang>   -> the pack document (same format as core.<lang>.json)
 * The key is Supabase's publishable key: it is meant to be public and only reaches those functions.
 * Nothing about the user is sent. Privacy policy: site/privacy.html ("Roast updates").
 */
const API = {
  url: 'https://ekcykzwfxaoqfziwtxni.supabase.co',
  key: 'sb_publishable_OHkbUjPrnmvKF-Oln7SUsw_lUMpUl--',
};

const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

type Manifest = { version: number; publishedAt?: string; announce?: Record<string, string>; packs: { lang: string; count: number; sha256: string }[] };
export type CheckResult = 'updated' | 'same' | 'skipped' | 'offline' | 'rejected';

async function get<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API.url + '/rest/v1/rpc/' + path, { headers: { apikey: API.key, Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

let running: Promise<CheckResult> | null = null;

/**
 * Check for new roast lines (at most every 6 hours unless forced) and swap them in.
 * Never throws; the app keeps whatever it already has when anything goes wrong.
 */
export function checkRoastUpdates(force = false): Promise<CheckResult> {
  if (running) return running;
  running = run(force).finally(() => {
    running = null;
  });
  return running;
}

async function run(force: boolean): Promise<CheckResult> {
  if (!API.url || !API.key) return 'skipped';
  if (!force && Date.now() - lastChecked() < CHECK_EVERY_MS) return 'skipped';
  let manifest: Manifest;
  try {
    manifest = await get<Manifest>('roast_manifest');
  } catch {
    return 'offline';
  }
  setLastChecked(Date.now());
  if (!manifest || !manifest.version || !Array.isArray(manifest.packs)) return 'same'; // nothing published yet

  let changed = false;
  let rejected = false;
  for (const lang of ROAST_LANGS) {
    const entry = manifest.packs.find((p) => p.lang === lang);
    const stored = readPack(lang);
    if (!entry) {
      // The live version has no pack for this language: fall back to the bundled lines.
      if (stored) {
        clearPack(lang);
        changed = true;
      }
      continue;
    }
    if (stored && stored.sha === entry.sha256) continue;
    try {
      const doc = await get<{ roasts?: unknown[] }>('roast_pack?p_lang=' + encodeURIComponent(lang));
      const roasts = sanitizePack(doc && doc.roasts);
      if (!roasts) {
        rejected = true;
        continue;
      }
      writePack(lang, { version: manifest.version, sha: entry.sha256, savedAt: Date.now(), roasts });
      changed = true;
    } catch {
      return changed ? finish(manifest) : 'offline';
    }
  }
  if (!changed) {
    if (liveVersion() !== manifest.version && !rejected) setLiveVersion(manifest.version);
    return rejected ? 'rejected' : 'same';
  }
  return finish(manifest);
}

function finish(manifest: Manifest): CheckResult {
  setLiveVersion(manifest.version);
  reloadLibrary();
  setNews(manifest.version, manifest.announce, manifest.publishedAt);
  return 'updated';
}
