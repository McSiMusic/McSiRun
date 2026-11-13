import { describe, expect, it } from "vitest";
import { advanceStep, cashOut, playRound } from "@/src/store/roundThunks";
import { roundStarted } from "@/src/store/roundActions";
import { completeElimination, milestoneDeclined, winClaimed } from "@/src/store/gameSlice";
import { setBetAmount, setDifficulty } from "@/src/store/walletSlice";
import { always, FATAL, SAFE, storeWith } from "../helpers/fixtures";

type Store = ReturnType<typeof storeWith>;

function runTo(store: Store, step: number) {
  store.dispatch(playRound(SAFE));
  while (store.getState().game.currentStep < step) {
    if (store.getState().game.awaitingMilestoneChoice) store.dispatch(milestoneDeclined());
    store.dispatch(advanceStep(SAFE));
  }
}

describe("playRound", () => {
  it("debits the bet and settles the first jump in one go", () => {
    const store = storeWith();
    expect(store.dispatch(playRound(SAFE))).toMatchObject({ kind: "started", outcome: { fromStep: 0, step: 1, safe: true } });
    const { wallet, game } = store.getState();
    expect(wallet.balance).toBe(990);
    expect(game).toMatchObject({ status: "active", currentStep: 1, multiplier: 1.07, roundBet: 10, trackDifficulty: "medium" });
  });

  it("ignores rapid repeat presses while a round is active", () => {
    const store = storeWith();
    store.dispatch(playRound(SAFE));
    expect(store.dispatch(playRound(SAFE))).toEqual({ kind: "blocked" });
    expect(store.dispatch(playRound(SAFE))).toEqual({ kind: "blocked" });
    expect(store.getState().wallet.balance).toBe(990);
  });

  it("refuses to start when the bet exceeds the balance", () => {
    const store = storeWith({ balance: 5, betAmount: 10 });
    expect(store.dispatch(playRound(SAFE))).toEqual({ kind: "insufficient" });
    expect(store.getState().wallet.balance).toBe(5);
    expect(store.getState().game.status).toBe("idle");
  });

  it("allows betting the exact balance", () => {
    const store = storeWith({ balance: 10, betAmount: 10 });
    expect(store.dispatch(playRound(SAFE)).kind).toBe("started");
    expect(store.getState().wallet.balance).toBe(0);
  });
});

describe("eliminations", () => {
  it("records the loss immediately and locks every action until the scene completes", () => {
    const store = storeWith();
    store.dispatch(playRound(FATAL));
    const { game, wallet } = store.getState();
    expect(game).toMatchObject({ status: "lost", isEliminating: true, hasPlayedRound: true });
    expect(game.history[0]).toMatchObject({ result: "hit", payout: 0, steps: 0 });
    expect(wallet.balance).toBe(990);
    expect(store.dispatch(cashOut())).toBeNull();
    expect(store.dispatch(advanceStep(SAFE))).toBeNull();
    expect(store.dispatch(playRound(SAFE))).toEqual({ kind: "blocked" });

    store.dispatch(completeElimination(game.eventId - 1));
    expect(store.getState().game.isEliminating).toBe(true);
    store.dispatch(completeElimination(game.eventId));
    expect(store.getState().game.isEliminating).toBe(false);
    expect(store.dispatch(playRound(SAFE)).kind).toBe("started");
  });
});

describe("cashOut", () => {
  it("credits exactly once no matter how often it is pressed", () => {
    const store = storeWith();
    runTo(store, 2);
    expect(store.dispatch(cashOut())?.payout).toBe(11.4);
    expect(store.dispatch(cashOut())).toBeNull();
    expect(store.dispatch(cashOut())).toBeNull();
    expect(store.getState().wallet.balance).toBe(1001.4);
    expect(store.getState().game.history).toHaveLength(1);
  });

  it("keeps cent-exact balances across odd bets", () => {
    const store = storeWith({ betAmount: 1.15 });
    runTo(store, 1);
    store.dispatch(cashOut());
    expect(store.getState().wallet.balance).toBe(1000.08);
  });

  it("pays from the round's difficulty even if the setting changes mid-round", () => {
    const store = storeWith({ difficulty: "easy" });
    store.dispatch(playRound(SAFE));
    store.dispatch(setDifficulty("hardcore"));
    store.dispatch(setBetAmount(400));
    expect(store.dispatch(advanceStep(always(0.15)))?.safe).toBe(true);
    expect(store.getState().game).toMatchObject({ trackDifficulty: "easy", multiplier: 1.06, roundBet: 10 });
    expect(store.dispatch(cashOut())?.payout).toBe(10.6);
  });

  it("awards the pistol with a claim modal for cash-outs from steps 10-19", () => {
    const store = storeWith();
    runTo(store, 12);
    const record = store.dispatch(cashOut());
    expect(record?.prize).toBe("pistol");
    expect(store.getState().game.pendingClaim).toEqual(record);
    expect(store.dispatch(playRound(SAFE))).toEqual({ kind: "blocked" });
    store.dispatch(winClaimed());
    expect(store.dispatch(playRound(SAFE)).kind).toBe("started");
  });
});

describe("milestones", () => {
  it("pauses at step 10 until the player claims the pistol or keeps running", () => {
    const store = storeWith();
    store.dispatch(playRound(SAFE));
    for (let i = 0; i < 9; i += 1) store.dispatch(advanceStep(SAFE));
    expect(store.getState().game).toMatchObject({ currentStep: 10, awaitingMilestoneChoice: true });
    expect(store.dispatch(advanceStep(SAFE))).toBeNull();
    expect(store.dispatch(cashOut())).toBeNull();
    const record = store.dispatch(cashOut(true));
    expect(record).toMatchObject({ prize: "pistol", payout: 19.7 });
    expect(store.getState().game).toMatchObject({ status: "won", pendingClaim: null, awaitingMilestoneChoice: false });
    expect(store.dispatch(cashOut(true))).toBeNull();
  });

  it("auto-cashes out the Dragon Lore at step 20 and cannot go further", () => {
    const store = storeWith();
    runTo(store, 20);
    const { game, wallet } = store.getState();
    expect(game.status).toBe("won");
    expect(game.pendingClaim).toMatchObject({ prize: "dragonLore", steps: 20, multiplier: 3.87, payout: 38.7 });
    expect(wallet.balance).toBe(1028.7);
    expect(store.dispatch(advanceStep(SAFE))).toBeNull();
    expect(store.dispatch(cashOut())).toBeNull();
  });
});

describe("reducer invariants", () => {
  it("never lets a direct roundStarted debit more than the balance", () => {
    const store = storeWith({ balance: 5 });
    store.dispatch(roundStarted({ bet: 50, difficulty: "easy" }));
    store.dispatch(roundStarted({ bet: Number.NaN, difficulty: "easy" }));
    expect(store.getState().wallet.balance).toBe(5);
  });
});
