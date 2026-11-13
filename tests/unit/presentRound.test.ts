import { describe, expect, it } from "vitest";
import { presentRound } from "@/src/components/game/presentRound";
import { advanceStep, playRound } from "@/src/store/roundThunks";
import { FATAL, SAFE, storeWith } from "../helpers/fixtures";

describe("presentRound", () => {
  it("shows the settled store state when no jump is animating", () => {
    const store = storeWith();
    store.dispatch(playRound(SAFE));
    expect(presentRound(store.getState().game, null)).toEqual({
      status: "active", currentStep: 1, multiplier: 1.07, payout: 10.7, jumping: false,
    });
  });

  it("keeps showing the pre-jump step while a safe hop animates", () => {
    const store = storeWith();
    store.dispatch(playRound(SAFE));
    store.dispatch(advanceStep(SAFE));
    expect(presentRound(store.getState().game, 1)).toEqual({
      status: "active", currentStep: 1, multiplier: 1.07, payout: 10.7, jumping: true,
    });
  });

  it("hides an already-settled loss until the hop lands", () => {
    const store = storeWith();
    store.dispatch(playRound(FATAL));
    const game = store.getState().game;
    expect(game.status).toBe("lost");
    expect(presentRound(game, 0)).toMatchObject({ status: "active", currentStep: 0, multiplier: 1, payout: 10 });
    expect(presentRound(game, null).status).toBe("lost");
  });
});
