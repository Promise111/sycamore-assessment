const ANNUAL_RATE_NUMERATOR = 275n; // 27.5%
const ANNUAL_RATE_DENOMINATOR = 1000n;

function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

export function getDaysInYear(date: Date): bigint {
  const year = date.getUTCFullYear();
  return isLeapYear(year) ? 366n : 365n;
}

/**
 * Calculate one day's interest for a given balance at 27.5% p.a.
 * using integer math only (no floating point).
 */
export function calculateDailyInterest(balanceMinor: bigint, date: Date): bigint {
  if (balanceMinor <= 0n) return 0n;

  const daysInYear = getDaysInYear(date);

  const numerator = balanceMinor * ANNUAL_RATE_NUMERATOR;
  const denominator = ANNUAL_RATE_DENOMINATOR * daysInYear;

  return numerator / denominator; // floor by integer division
}

