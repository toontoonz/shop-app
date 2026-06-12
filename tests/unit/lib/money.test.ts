import { describe, it, expect } from "vitest";
import { formatTHB, parseTHBInput, SATANG_PER_THB } from "@/lib/money";

describe("money utilities", () => {
  describe("formatTHB", () => {
    it("formats 0 satang as ฿0.00", () => {
      expect(formatTHB(0)).toBe("฿0.00");
    });
    it("formats 29900 satang as ฿299.00", () => {
      expect(formatTHB(29900)).toBe("฿299.00");
    });
    it("formats 1 satang as ฿0.01", () => {
      expect(formatTHB(1)).toBe("฿0.01");
    });
    it("formats 123450 as ฿1234.50", () => {
      expect(formatTHB(123450)).toBe("฿1234.50");
    });
  });

  describe("parseTHBInput", () => {
    it("parses integer string", () => {
      expect(parseTHBInput("299")).toBe(29900);
    });
    it("parses decimal string", () => {
      expect(parseTHBInput("1234.50")).toBe(123450);
    });
    it("parses with commas", () => {
      expect(parseTHBInput("1,234.50")).toBe(123450);
    });
    it("rounds fractional satang", () => {
      expect(parseTHBInput("0.005")).toBe(1); // rounds to 1 satang
    });
    it("throws on negative", () => {
      expect(() => parseTHBInput("-1")).toThrow();
    });
    it("throws on non-numeric", () => {
      expect(() => parseTHBInput("abc")).toThrow();
    });
  });

  describe("SATANG_PER_THB constant", () => {
    it("is 100", () => {
      expect(SATANG_PER_THB).toBe(100);
    });
  });
});
