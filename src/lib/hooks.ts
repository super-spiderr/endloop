import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { AppState } from 'react-native';

/**
 * Types `lines` out one after another, with a light haptic tick per word.
 * Returns the visible text of each line and whether everything is done.
 */
export function useTypewriter(lines: string[], { startDelay = 0, charMs = 38, gapMs = 500 } = {}) {
  const [shown, setShown] = useState<string[]>(() => lines.map(() => ''));
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = startDelay;
    lines.forEach((line, li) => {
      for (let i = 1; i <= line.length; i++) {
        const ch = line[i - 1];
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setShown((prev) => prev.map((p, idx) => (idx === li ? line.slice(0, i) : p)));
            if (ch === ' ' || i === line.length) Haptics.selectionAsync();
          }, t),
        );
        t += charMs;
      }
      t += gapMs;
    });
    timers.push(setTimeout(() => !cancelled && setDone(true), t));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // lines are static copy for a screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { shown, done };
}

/**
 * Calls `fn` when the app comes back to the foreground after the user left (e.g. for Settings).
 * Only the screen that's on top reacts: earlier screens in the stack stay mounted, and without
 * this check they'd also fire (Screen 2 used to jump to app selection from Screen 6).
 */
export function useOnReturn(fn: () => void) {
  const focused = useIsFocused();
  const left = useRef(false);
  const cb = useRef(fn);
  const isFocused = useRef(focused);
  useEffect(() => {
    cb.current = fn;
    isFocused.current = focused;
  });
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') left.current = true;
      if (s === 'active' && left.current) {
        left.current = false;
        if (isFocused.current) cb.current();
      }
    });
    return () => sub.remove();
  }, []);
}
