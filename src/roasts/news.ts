import { useSyncExternalStore } from 'react';

import { mmkv } from '@/store/storage';

/**
 * "Fresh roasts" message: an optional short line per language that comes with a published version
 * (Roast admin → Publish → Message for users). Shown once on the Today screen after that version's
 * lines are downloaded, then never again. Old messages expire, so a late download in March doesn't
 * announce Diwali.
 */
type News = { version: number; text: Record<string, string>; until: number };

const KEY = 'roasts.news';
const SEEN = 'roasts.newsSeen';
const SHOW_FOR_MS = 10 * 24 * 60 * 60 * 1000;
const MAX_LEN = 140;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let cache: News | null | undefined;
function read(): News | null {
  if (cache !== undefined) return cache;
  try {
    const raw = mmkv.getString(KEY);
    cache = raw ? (JSON.parse(raw) as News) : null;
  } catch {
    cache = null;
  }
  return cache;
}

const seen = () => mmkv.getNumber(SEEN) ?? 0;

/** Keep only short plain messages: nothing with {placeholders}, nothing empty or long. */
function clean(announce: unknown): Record<string, string> | null {
  if (!announce || typeof announce !== 'object' || Array.isArray(announce)) return null;
  const out: Record<string, string> = {};
  for (const [lang, v] of Object.entries(announce as Record<string, unknown>)) {
    if (typeof v !== 'string') continue;
    const t = v.trim();
    if (t && t.length <= MAX_LEN && !/[{}]/.test(t)) out[lang] = t;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Called after a version's lines were downloaded. Only a version newer than any announced before
 * counts, so switching back to an older version never repeats its message.
 */
export function setNews(version: number, announce: unknown, publishedAt?: string) {
  const text = clean(announce);
  const prev = read();
  if (!text || version <= Math.max(prev?.version ?? 0, seen())) return;
  const from = publishedAt ? Date.parse(publishedAt) : NaN;
  const until = (Number.isFinite(from) ? from : Date.now()) + SHOW_FOR_MS;
  if (until < Date.now()) return;
  cache = { version, text, until };
  mmkv.set(KEY, JSON.stringify(cache));
  emit();
}

export function dismissNews() {
  const n = read();
  if (n) mmkv.set(SEEN, Math.max(seen(), n.version));
  emit();
}

function current(): News | null {
  const n = read();
  return n && n.version > seen() && n.until > Date.now() ? n : null;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const textFor = (n: News | null, lang: string) => (n ? (n.text[lang] ?? n.text.en ?? null) : null);

/** The message to show now in this roast language (English when there's none in it), or null. */
export const roastNewsNow = (lang: string) => textFor(current(), lang);

export function useRoastNews(lang: string): string | null {
  return textFor(useSyncExternalStore(subscribe, current), lang);
}
