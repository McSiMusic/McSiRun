import { describe, expect, it } from "vitest";
import { calculatePayout, clampBet, multiplierForStep, roundMoney, stepIsSafe } from "@/src/lib/gameMath";
import { DIFFICULTIES, isDifficulty, type Difficulty } from "@/src/types/game";

describe("multiplierForStep", () => {
  it.each<[Difficulty, number[]]>([
    ["easy", [1.03, 1.06, 1.34, 1.75, 1.81]],
    ["medium", [1.07, 1.14, 1.97, 3.62, 3.87]],
    ["hard", [1.12, 1.25, 3.11, 8.61, 9.65]],
    ["hardcore", [1.17, 1.37, 4.81, 19.75, 23.11]],
  ])("follows the %s curve at steps 1, 2, 10, 19 and 20", (difficulty, expected) => {
    expect([1, 2, 10, 19, 20].map((step) => multiplierForStep(difficulty, step))).toEqual(expected);
  });

  it("is 1x before the first step and clamps outside the 20-step track", () => {
    expect(multiplierForStep("hard", 0)).toBe(1);
    expect(multiplierForStep("hard", -5)).toBe(1);
    expect(multiplierForStep("hard", 99)).toBe(multiplierForStep("hard", 20));
    expect(multiplierForStep("hard", 3.9)).toBe(multiplierForStep("hard", 3));
  });

  it("grows strictly with every step", () => {
    for (const difficulty of Object.keys(DIFFICULTIES) as Difficulty[]) {
      for (let step = 1; step <= 20; step += 1) {
        expect(multiplierForStep(difficulty, step)).toBeGreaterThan(multiplierForStep(difficulty, step - 1));
      }
    }
  });
});

describe("stepIsSafe", () => {
  it("treats the hit-risk value itself as safe and anything below it as a hit", () => {
    expect(stepIsSafe("medium", 0.2)).toBe(true);
    expect(stepIsSafe("medium", 0.1999)).toBe(false);
    expect(stepIsSafe("hardcore", 0.4999)).toBe(false);
    expect(stepIsSafe("easy", 0)).toBe(false);
    expect(stepIsSafe("easy", 0.999)).toBe(true);
  });
});

describe("money helpers", () => {
  it("rounds to whole cents, including binary edge cases", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(calculatePayout(10, 1.07)).toBe(10.7);
    expect(calculatePayout(1.15, 1.07)).toBe(1.23);
    expect(calculatePayout(500, 23.11)).toBe(11555);
  });

  it.each([
    [Number.NaN, 1], [Number.POSITIVE_INFINITY, 1], [Number.NEGATIVE_INFINITY, 1],
    [-50, 1], [0, 1], [0.5, 1], [501, 500], [12.345, 12.35], [7, 7],
  ])("clampBet(%s) = %s", (input, expected) => {
    expect(clampBet(input)).toBe(expected);
  });
});

describe("isDifficulty", () => {
  it("rejects prototype keys and non-strings", () => {
    expect(isDifficulty("hard")).toBe(true);
    for (const value of ["toString", "__proto__", "constructor", "", 1, null, undefined]) {
      expect(isDifficulty(value)).toBe(false);
    }
  });
});
