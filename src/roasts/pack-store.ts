import { mmkv } from '@/store/storage';

/**
 * Roast packs downloaded from the cloud, kept in MMKV so they load instantly on the next launch
 * (and work offline). The bundled core.*.json files are the fallback.
 */
export type StoredPack = { version: number; sha: string; savedAt: number; roasts: unknown[] };

const K = {
  pack: (lang: string) => `roasts.pack.${lang}`,
  live: 'roasts.liveVersion',
  checkedAt: 'roasts.checkedAt',
};

export function readPack(lang: string): StoredPack | null {
  try {
    const raw = mmkv.getString(K.pack(lang));
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredPack;
    return Array.isArray(p.roasts) && p.roasts.length ? p : null;
  } catch {
    return null;
  }
}

export function writePack(lang: string, pack: StoredPack) {
  mmkv.set(K.pack(lang), JSON.stringify(pack));
}

export function clearPack(lang: string) {
  mmkv.remove(K.pack(lang));
}

export const liveVersion = () => mmkv.getNumber(K.live) ?? 0;
export const setLiveVersion = (v: number) => mmkv.set(K.live, v);
export const lastChecked = () => mmkv.getNumber(K.checkedAt) ?? 0;
export const setLastChecked = (t: number) => mmkv.set(K.checkedAt, t);
