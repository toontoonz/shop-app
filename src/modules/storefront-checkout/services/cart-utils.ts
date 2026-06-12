/**
 * Pure cart utility functions — no server-only imports (no next/headers).
 * Safe to import from any context (client or server).
 */

export function computeCartTotal(lines: Array<{ unitPriceSatang: number; quantity: number }>): number {
  return lines.reduce((sum, l) => sum + l.unitPriceSatang * l.quantity, 0);
}
