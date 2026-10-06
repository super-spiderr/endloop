import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/**
 * One MMKV instance shared with the Kotlin service later (same id), so limits set here
 * are enforced even when the app is closed.
 */
export const mmkv = createMMKV({ id: 'endloop' });

export const zustandStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => {
    mmkv.remove(name);
  },
};
