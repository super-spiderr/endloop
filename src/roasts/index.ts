import type { Intensity, RoastLang } from '@/store/settings';
import type { Roaster } from '@/characters';

import en from './core.en.json';
import ta from './core.ta-Latn.json';
import { appKind, type AppKind } from './kinds';

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
};

const APP_KEYS = en.appKeys as Record<string, string[]>;
const LIBS: Record<RoastLang, Roast[]> = { en: en.roasts as Roast[], 'ta-Latn': ta.roasts as Roast[] };

/** Fill {app}, {time}… placeholders. Unknown keys are left as they are. */
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
};

/** A line fits this app: written for any app, or for this kind of app. */
function fitsKind(r: Roast, kind: AppKind | null): boolean {
  return !r.kinds || (kind !== null && r.kinds.includes(kind));
}

/**
 * Pick one line from the bundled library. Falls back to English when a Tanglish line
 * doesn't exist for that category, and ignores intensity when nothing matches it.
 */
export function pickRoast({ category, lang, intensity, roaster, seed = Date.now(), vars = [], packageName, appLabel }: Pick): string | null {
  const kind = packageName ? appKind(packageName, appLabel) : null;
  const key = packageName ? appKeyFor(packageName) : null;
  const tryLang = (l: RoastLang) => {
    const inCat = LIBS[l].filter(
      (r) =>
        r.category === category &&
        (!r.roaster || r.roaster === roaster) &&
        (!r.apps || (key !== null && r.apps.includes(key))) &&
        fitsKind(r, kind) &&
        fillable(r.text, vars),
    );
    const exact = intensity ? inCat.filter((r) => !r.intensity || r.intensity === intensity) : inCat;
    return exact.length ? exact : inCat;
  };
  const pool = tryLang(lang).length ? tryLang(lang) : tryLang('en');
  if (!pool.length) return null;
  return pool[Math.abs(Math.floor(seed)) % pool.length].text;
}

function appKeyFor(packageName: string): string | null {
  return Object.keys(APP_KEYS).find((k) => APP_KEYS[k].includes(packageName)) ?? null;
}

/**
 * Every line the native watcher may use for one app in one category: generic lines plus lines
 * written for that app, in the user's language (English fallback), heat and roaster.
 * Placeholders stay in; Kotlin fills NATIVE_VARS ({opens} only on the roast screen; other lines
 * that need it are skipped there). Lines needing data the watcher doesn't have
 * yet ({opens}, {streak}, {weekHours}…) are left out so nobody sees a raw "{opens}".
 */
export function linesFor(category: string, o: { lang: RoastLang; intensity: Intensity; roaster: Roaster; packageName: string; appLabel?: string }): string[] {
  const key = appKeyFor(o.packageName);
  const kind = o.packageName ? appKind(o.packageName, o.appLabel) : null;
  const pick = (l: RoastLang) => {
    const inCat = LIBS[l].filter(
      (r) =>
        r.category === category &&
        (!r.roaster || r.roaster === o.roaster) &&
        (!r.apps || (key !== null && r.apps.includes(key))) &&
        fitsKind(r, kind) &&
        fillable(r.text, NATIVE_VARS),
    );
    const heat = inCat.filter((r) => !r.intensity || r.intensity === o.intensity);
    return [...new Set((heat.length ? heat : inCat).map((r) => r.text))];
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
