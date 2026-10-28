/**
 * Formatting and normalization utilities for TravelWise AI+ 2.0.
 */

/**
 * Normalizes match scores to an integer percentage strictly within 0..100.
 * Accepts:
 * - Decimals in range 0..1 (e.g., 0.8 -> 80, 0.5 -> 50)
 * - Whole numbers in range 0..100 (e.g., 80 -> 80, 50 -> 50)
 * - Edge values: 0 -> 0, 100 -> 100
 * - Clamps out-of-range values (>100 -> 100, <0 -> 0)
 * - Returns null for undefined, null, NaN, or non-numeric inputs (preventing misleading match percentages)
 */
export function normalizeMatchScore(score: unknown): number | null {
  if (score === null || score === undefined || score === '') {
    return null;
  }
  const num = Number(score);
  if (isNaN(num)) {
    return null;
  }
  // If score is 0, return 0
  if (num === 0) {
    return 0;
  }
  // Decimal fraction convention (0 < score <= 1)
  if (num > 0 && num <= 1) {
    return Math.round(num * 100);
  }
  // Standard 0..100 integer percentage
  return Math.min(100, Math.max(0, Math.round(num)));
}
