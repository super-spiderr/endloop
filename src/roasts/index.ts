import type { Intensity, RoastLang } from '@/store/settings';
import type { Roaster } from '@/characters';

import en from './core.en.json';
import ta from './core.ta-Latn.json';
import { appKind, type AppKind } from './kinds';
import { readPack } from './pack-store';

export { appKind, type AppKind } from './kinds';

type Roast = {
  id: string;
  category: string;
  intensity: string | null;
  text: string;
  apps: string[] | null;
  /** Kinds of app the line fits (feed, video, chat…); null = any app. */
  kinds?: string[] | null;
  roaster: string | null;
  lang: string;
  /** Optional show window, local dates YYYY-MM-DD (festival lines). */
  from?: string | null;
  to?: string | null;
};

const APP_KEYS = en.appKeys as Record<string, string[]>;
export const ROAST_LANGS: RoastLang[] = ['en', 'ta-Latn'];

/** Lines shipped inside the app: used until a cloud pack has been downloaded, and as the fallback. */
const BUNDLED: Record<RoastLang, Roast[]> = { en: en.roasts as Roast[], 'ta-Latn': ta.roasts as Roast[] };
let LIBS: Record<RoastLang, Roast[]> = { ...BUNDLED };
let SOURCE: Record<RoastLang, 'cloud' | 'app'> = { en: 'app', 'ta-Latn': 'app' };

/** Use downloaded packs (see remote.ts) where present, bundled lines otherwise. Call after a download. */
export function reloadLibrary() {
  const next = { ...BUNDLED };
  const src: typeof SOURCE = { en: 'app', 'ta-Latn': 'app' };
  for (const lang of ROAST_LANGS) {
    const p = readPack(lang);
    const roasts = p && sanitizePack(p.roasts);
    if (roasts) {
      next[lang] = roasts;
      src[lang] = 'cloud';
    }
  }
  LIBS = next;
  SOURCE = src;
}

/** Where the lines in use come from, and how many there are (Settings → About). */
export function libraryInfo() {
  return ROAST_LANGS.map((lang) => ({ lang, source: SOURCE[lang], count: LIBS[lang].length, version: readPack(lang)?.version ?? 0 }));
}

const LEVELS = [null, 'polite', 'honest', 'savage', 'unhinged'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLACEHOLDERS = new Set(en.placeholders as string[]);

/**
 * Keep only well-formed lines from a downloaded pack. Lines with unknown {placeholders} are dropped so
 * nobody sees a raw "{xyz}". Returns null when the pack looks broken (too few lines, no roast-screen
 * lines), so the app keeps what it had.
 */
export function sanitizePack(list: unknown): Roast[] | null {
  if (!Array.isArray(list)) return null;
  const out: Roast[] = [];
  for (const x of list) {
    const r = x as Partial<Roast> & Record<string, unknown>;
    if (!r || typeof r.id !== 'string' || typeof r.category !== 'string' || typeof r.text !== 'string') continue;
    const text = r.text.trim();
    if (!text || text.length > 400) continue;
    if ([...text.matchAll(/\{(\w+)\}/g)].some((m) => !PLACEHOLDERS.has(m[1]))) continue;
    if (/[{}]/.test(text.replace(/\{\w+\}/g, ''))) continue;
    if (!LEVELS.includes((r.intensity ?? null) as string | null)) continue;
    if (r.roaster != null && r.roaster !== 'loop' && r.roaster !== 'lupe') continue;
    if (r.from != null && !DATE.test(String(r.from))) continue;
    if (r.to != null && !DATE.test(String(r.to))) continue;
    out.push({
      ...(r as Roast),
      text,
      intensity: (r.intensity ?? null) as string | null,
      apps: Array.isArray(r.apps) ? (r.apps as string[]) : null,
      kinds: Array.isArray(r.kinds) ? (r.kinds as string[]) : null,
      roaster: (r.roaster ?? null) as string | null,
    });
  }
  if (out.length < 40 || !out.some((r) => r.category === 'limit_hit')) return null;
  return out;
}

/** Today as YYYY-MM-DD in the phone's time zone. */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A dated line (festival) only shows between its from and to dates, inclusive. */
const inWindow = (r: Roast, day: string) => (!r.from || r.from <= day) && (!r.to || r.to >= day);

reloadLibrary();

/** Fill {app}, {time}… placeholders. Unknown keys are left as they are. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** True when every {placeholder} in the line is one we can fill. */
function fillable(text: string, keys: readonly string[]): boolean {
  for (const m of text.matchAll(/\{(\w+)\}/g)) if (!keys.includes(m[1])) return false;
  return true;
}

/** What the Kotlin watcher fills in (see fillRoast in Store.kt). */
export const NATIVE_VARS = ['app', 'time', 'limit', 'left', 'over', 'clock', 'opens'] as const;

type Pick = {
  category: string;
  lang: RoastLang;
  intensity?: Intensity;
  roaster?: Roaster;
  seed?: number;
  /** Placeholders the caller will fill. Lines needing anything else ({opens}, {streak}…) are skipped. */
  vars?: readonly string[];
  /** The app the line is about. Without it, only lines that fit any app are used. */
  packageName?: string;
  appLabel?: string;
  /** The user's name. Lines with {name} are used (and filled) only when it's set. */
  name?: string;
};

/** Mildest first. 'unhinged' is listed so its lines work once the level ships. */
const HEAT_ORDER = ['polite', 'honest', 'savage', 'unhinged'] as const;

/**
 * Lines for the user's level. If a level has none, step down to the next milder level,
 * never up, so a Polite user can't get a Savage line when a Polite one is missing.
 * Lines with no intensity fit every level.
 */
function byHeat(lines: Roast[], intensity?: string): Roast[] {
  if (!intensity) return lines;
  const start = HEAT_ORDER.indexOf(intensity as (typeof HEAT_ORDER)[number]);
  for (let i = start; i >= 0; i--) {
    const level = HEAT_ORDER[i];
    const hit = lines.filter((r) => !r.intensity || r.intensity === level);
    if (hit.length) return hit;
  }
  return lines.filter((r) => !r.intensity);
}

/** A line fits this app: written for any app, or for this kind of app. */
function fitsKind(r: Roast, kind: AppKind | null): boolean {
  return !r.kinds || (kind !== null && r.kinds.includes(kind));
}

/**
 * Pick one line from the bundled library. Falls back to English when the user's language has no
 * line for that category, and to a milder level (never a harsher one) when their level has none.
 */
export function pickRoast({ category, lang, intensity, roaster, seed = Date.now(), vars = [], packageName, appLabel, name }: Pick): string | null {
  const keys = name ? [...vars, 'name'] : vars;
  const kind = packageName ? appKind(packageName, appLabel) : null;
  const key = packageName ? appKeyFor(packageName) : null;
  const day = today();
  const tryLang = (l: RoastLang) => {
    const inCat = LIBS[l].filter(
      (r) =>
        r.category === category &&
        inWindow(r, day) &&
        (!r.roaster || r.roaster === roaster) &&
        (!r.apps || (key !== null && r.apps.includes(key))) &&
        fitsKind(r, kind) &&
        fillable(r.text, keys),
    );
    return byHeat(inCat, intensity);
  };
  const pool = tryLang(lang).length ? tryLang(lang) : tryLang('en');
  if (!pool.length) return null;
  const text = pool[Math.abs(Math.floor(seed)) % pool.length].text;
  return name ? fill(text, { name }) : text;
}

function appKeyFor(packageName: string): string | null {
  return Object.keys(APP_KEYS).find((k) => APP_KEYS[k].includes(packageName)) ?? null;
}

/**
 * Every line the native watcher may use for one app in one category: generic lines plus lines
 * written for that app, in the user's language (English fallback), heat and roaster.
 * Dated (festival) lines are included only on days inside their window; the watcher config is rebuilt
 * whenever the app opens or comes back to the front (see app/_layout.tsx), so they come and go then.
 * Placeholders stay in; Kotlin fills NATIVE_VARS ({opens} only on the roast screen; other lines
 * that need it are skipped there). Lines needing data the watcher doesn't have
 * yet ({opens}, {streak}, {weekHours}…) are left out so nobody sees a raw "{opens}".
 * {name} is filled here, so native never sees it; without a name those lines are left out.
 */
export function linesFor(category: string, o: { lang: RoastLang; intensity: Intensity; roaster: Roaster; packageName: string; appLabel?: string; name?: string }): string[] {
  const name = o.name;
  const keys: readonly string[] = name ? [...NATIVE_VARS, 'name'] : NATIVE_VARS;
  const key = appKeyFor(o.packageName);
  const kind = o.packageName ? appKind(o.packageName, o.appLabel) : null;
  const day = today();
  const pick = (l: RoastLang) => {
    const inCat = LIBS[l].filter(
      (r) =>
        r.category === category &&
        inWindow(r, day) &&
        (!r.roaster || r.roaster === o.roaster) &&
        (!r.apps || (key !== null && r.apps.includes(key))) &&
        fitsKind(r, kind) &&
        fillable(r.text, keys),
    );
    return [...new Set(byHeat(inCat, o.intensity).map((r) => (name ? fill(r.text, { name }) : r.text)))];
  };
  const lines = pick(o.lang);
  return lines.length ? lines : pick('en');
}

/** Screen 4 preview: the first roast, built from the user's top app. */
export function previewRoast(intensity: Intensity, lang: RoastLang, app: string, weekHours: string): string {
  const lines: Record<RoastLang, Record<Intensity, string>> = {
    en: {
      polite: `${weekHours} on ${app} last week. Maybe a little less this week?`,
      honest: `${weekHours} on ${app}. That's two workdays of other people's lives.`,
      savage: `${weekHours} on ${app}. Your thumb gets more exercise than you do.`,
    },
    'ta-Latn': {
      polite: `Last week ${weekHours} ${app}-la. Indha week konjam kammi pannalaam, okay?`,
      honest: `${weekHours} ${app}-la. Adhu rendu full working days, boss.`,
      savage: `${weekHours} ${app}. Unnoda thumb unna vida jaasti exercise pannudhu, boss.`,
    },
  };
  return lines[lang][intensity];
}
