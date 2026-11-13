import { describe, expect, it, vi } from "vitest";
import { cashoutRecord, createRoundId, hitRecord, prizeForStep } from "@/src/lib/roundRecords";
import { assetPath } from "@/src/lib/assetPath";

describe("round records", () => {
  it("awards nothing before step 10, the pistol for 10-19 and the Dragon Lore at 20", () => {
    expect([1, 9, 10, 19, 20].map(prizeForStep)).toEqual([undefined, undefined, "pistol", "pistol", "dragonLore"]);
  });

  it("computes cash-out payouts in whole cents and omits the prize key when there is none", () => {
    const record = cashoutRecord(10, 3, 1.23, "medium", "id");
    expect(record).toEqual({ id: "id", bet: 10, steps: 3, multiplier: 1.23, difficulty: "medium", result: "cashed_out", payout: 12.3 });
    expect("prize" in record).toBe(false);
    expect(cashoutRecord(10, 20, 3.87, "medium").prize).toBe("dragonLore");
  });

  it("always records a zero payout for a hit", () => {
    expect(hitRecord(10, 4, 1.31, "medium", "id")).toMatchObject({ result: "hit", payout: 0, steps: 4 });
  });

  it("creates unique ids even where crypto.randomUUID is unavailable (insecure LAN origin)", () => {
    vi.stubGlobal("crypto", {});
    const ids = new Set(Array.from({ length: 50 }, createRoundId));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});

describe("assetPath", () => {
  it("works both at the root and under the GitHub Pages base path", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(assetPath("/sprites/crate.svg")).toBe("/sprites/crate.svg");
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/McSiRun");
    expect(assetPath("/sprites/crate.svg")).toBe("/McSiRun/sprites/crate.svg");
    vi.unstubAllEnvs();
  });
});
