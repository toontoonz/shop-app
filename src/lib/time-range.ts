/**
 * Analytics time-range resolution.
 * Resolves preset labels to [from, to) UTC date ranges + aggregation interval.
 */

export type RangePreset = "TODAY" | "LAST_7D" | "LAST_30D" | "THIS_MONTH" | "THIS_YEAR";
export type TimeInterval = "DAY" | "MONTH";
export type ResolvedRange = { from: Date; to: Date; interval: TimeInterval };

export const RANGE_PRESETS: RangePreset[] = ["TODAY", "LAST_7D", "LAST_30D", "THIS_MONTH", "THIS_YEAR"];
export const DEFAULT_RANGE: RangePreset = "LAST_30D";

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function resolveRange(preset: RangePreset, now: Date = new Date()): ResolvedRange {
  switch (preset) {
    case "TODAY":
      return { from: startOfDay(now), to: endOfDay(now), interval: "DAY" };

    case "LAST_7D": {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now), interval: "DAY" };
    }

    case "LAST_30D": {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now), interval: "DAY" };
    }

    case "THIS_MONTH":
      return {
        from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
        interval: "DAY",
      };

    case "THIS_YEAR":
      return {
        from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
        to: new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999)),
        interval: "MONTH",
      };
  }
}

/**
 * Parse a range query parameter; returns DEFAULT_RANGE if invalid.
 */
export function parseRangeParam(value: string | null | undefined): RangePreset {
  if (value && RANGE_PRESETS.includes(value as RangePreset)) {
    return value as RangePreset;
  }
  return DEFAULT_RANGE;
}
