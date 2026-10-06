/** 142 -> "2h 22m", 45 -> "45m", 120 -> "2h". */
export function fmt(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${String(r).padStart(2, '0')}m` : `${h}h`;
}

/** Long form for limit cards: 25 -> "25 min", 110 -> "1h 50m". */
export function fmtLimit(min: number): string {
  return min < 60 ? `${min} min` : fmt(min);
}

/** Round hours for roast text: 845 min -> "14 hours". */
export function hoursText(min: number): string {
  const h = Math.round(min / 60);
  return `${h} hour${h === 1 ? '' : 's'}`;
}

/** Slider steps: 5 minutes up to an hour, then 15 minutes up to 4 hours. */
export const LIMIT_MIN = 5;
export const LIMIT_MAX = 240;
export function snapLimit(min: number): number {
  const m = Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, min));
  return m <= 60 ? Math.round(m / 5) * 5 : 60 + Math.round((m - 60) / 15) * 15;
}
/** Position along the track, 0..1 (first hour gets 40% of the width). */
export function limitToPos(min: number): number {
  return min <= 60 ? (min / 60) * 0.4 : 0.4 + ((min - 60) / 180) * 0.6;
}
export function posToLimit(pos: number): number {
  const p = Math.min(1, Math.max(0, pos));
  return snapLimit(p <= 0.4 ? (p / 0.4) * 60 : 60 + ((p - 0.4) / 0.6) * 180);
}

/**
 * Default limit: about 30% below the daily average, snapped to a slider step.
 * Apps used under 5 minutes a day have no habit to cut, so they start at 30 minutes.
 */
export function suggestedLimit(avgDailyMin: number): number {
  if (avgDailyMin < 5) return 30;
  return snapLimit(avgDailyMin * 0.7);
}

/** Human comparisons for today's total (India-first references). */
export function comparison(min: number): string {
  if (min < 20) return 'Barely a chai break. Keep it that way.';
  if (min < 60) return 'A whole lunch break, gone.';
  if (min < 150) return "A whole movie you didn't watch.";
  if (min < 300) return '5 episodes of a series. In one day.';
  return 'A Chennai to Bangalore train ride.';
}
