/**
 * Money utilities: all internal computation uses integer satang (1 THB = 100 satang).
 */

export const SATANG_PER_THB = 100;

/**
 * Format integer satang as a Thai Baht display string.
 * formatTHB(29900) → "฿299.00"
 */
export function formatTHB(satang: number): string {
  return `฿${(satang / SATANG_PER_THB).toFixed(2)}`;
}

/**
 * Parse a user-entered THB string into integer satang.
 * parseTHBInput("1,234.50") → 123450
 * parseTHBInput("299") → 29900
 * Throws on invalid input.
 */
export function parseTHBInput(input: string): number {
  const cleaned = input.replace(/,/g, "").trim();
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid amount: "${input}"`);
  }
  return Math.round(n * SATANG_PER_THB);
}
