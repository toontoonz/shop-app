import { describe, it, expect } from "vitest";
import { resolveRange, parseRangeParam, DEFAULT_RANGE } from "@/lib/time-range";

describe("time-range utilities", () => {
  const fixedNow = new Date("2025-03-15T10:30:00Z");

  describe("resolveRange", () => {
    it("TODAY returns same day with DAY interval", () => {
      const r = resolveRange("TODAY", fixedNow);
      expect(r.interval).toBe("DAY");
      expect(r.from.toISOString()).toBe("2025-03-15T00:00:00.000Z");
      expect(r.to.toISOString()).toBe("2025-03-15T23:59:59.999Z");
    });

    it("LAST_7D returns 7 days with DAY interval", () => {
      const r = resolveRange("LAST_7D", fixedNow);
      expect(r.interval).toBe("DAY");
      expect(r.from.toISOString()).toBe("2025-03-09T00:00:00.000Z");
      expect(r.to.toISOString()).toBe("2025-03-15T23:59:59.999Z");
    });

    it("LAST_30D returns 30 days with DAY interval", () => {
      const r = resolveRange("LAST_30D", fixedNow);
      expect(r.interval).toBe("DAY");
      expect(r.from.toISOString()).toBe("2025-02-14T00:00:00.000Z");
      expect(r.to.toISOString()).toBe("2025-03-15T23:59:59.999Z");
    });

    it("THIS_MONTH returns full month with DAY interval", () => {
      const r = resolveRange("THIS_MONTH", fixedNow);
      expect(r.interval).toBe("DAY");
      expect(r.from.toISOString()).toBe("2025-03-01T00:00:00.000Z");
      expect(r.to.toISOString()).toBe("2025-03-31T23:59:59.999Z");
    });

    it("THIS_YEAR returns full year with MONTH interval", () => {
      const r = resolveRange("THIS_YEAR", fixedNow);
      expect(r.interval).toBe("MONTH");
      expect(r.from.toISOString()).toBe("2025-01-01T00:00:00.000Z");
      expect(r.to.toISOString()).toBe("2025-12-31T23:59:59.999Z");
    });
  });

  describe("parseRangeParam", () => {
    it("returns the preset if valid", () => {
      expect(parseRangeParam("TODAY")).toBe("TODAY");
      expect(parseRangeParam("THIS_YEAR")).toBe("THIS_YEAR");
    });
    it("returns DEFAULT_RANGE for invalid input", () => {
      expect(parseRangeParam("INVALID")).toBe(DEFAULT_RANGE);
      expect(parseRangeParam(null)).toBe(DEFAULT_RANGE);
      expect(parseRangeParam(undefined)).toBe(DEFAULT_RANGE);
    });
  });
});
