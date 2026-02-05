import { calculateDailyInterest, getDaysInYear } from "../services/interestMath";

describe("interestMath", () => {
  it("detects leap years correctly", () => {
    expect(getDaysInYear(new Date("2024-01-01"))).toBe(366n);
    expect(getDaysInYear(new Date("2025-01-01"))).toBe(365n);
  });

  it("returns zero interest for non-positive balances", () => {
    expect(calculateDailyInterest(0n, new Date("2025-01-01"))).toBe(0n);
    expect(calculateDailyInterest(-100n, new Date("2025-01-01"))).toBe(0n);
  });

  it("calculates a positive daily interest for a reasonable balance", () => {
    const balance = 100_000n; // e.g. 1000.00 in minor units
    const interest = calculateDailyInterest(balance, new Date("2025-01-01"));
    expect(interest).toBeGreaterThan(0n);
  });

  it("approximately matches 27.5% after a full non-leap year", () => {
    const balance = 1_000_000n; // e.g. 10,000.00 in minor units
    const start = new Date("2025-01-01T00:00:00.000Z");

    let principal = balance;
    let totalInterest = 0n;

    for (let i = 0; i < 365; i += 1) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + i);
      const daily = calculateDailyInterest(principal, day);
      totalInterest += daily;
    }

    const ideal = (balance * 275n) / 1000n; // 27.5% of principal
    const diff = ideal > totalInterest ? ideal - totalInterest : totalInterest - ideal;

    // Allow a small rounding gap due to integer division over many days.
    expect(diff * 100n / ideal).toBeLessThanOrEqual(1n); // within 1%
  });
});

