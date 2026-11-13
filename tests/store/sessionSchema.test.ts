import { describe, expect, it } from "vitest";
import { parseSessionState } from "@/src/store/sessionSchema";
import { toSessionState } from "@/src/store/sessionStorage";
import { playRound } from "@/src/store/roundThunks";
import { SAFE, storeWith } from "../helpers/fixtures";

const valid = {
  version: 2,
  wallet: { balance: 250.5, betAmount: 20, difficulty: "hard", language: "ru" },
  game: { history: [], round: null },
};

const withWallet = (wallet: object) => ({ ...valid, wallet: { ...valid.wallet, ...wallet } });
const withRound = (round: object) => ({ ...valid, game: { history: [], round } });

describe("parseSessionState", () => {
  it.each([null, undefined, 42, "x", [], {}, { version: 1, wallet: valid.wallet }])("ignores foreign data %#", (value) => {
    expect(parseSessionState(value)).toBeNull();
  });

  it("accepts a valid session unchanged", () => {
    expect(parseSessionState(valid)).toEqual(valid);
  });

  it.each([["abc"], [null], [-1], [Number.POSITIVE_INFINITY], [1e20], [{}]])(
    "replaces an invalid balance (%s) instead of allowing free play", (balance) => {
      expect(parseSessionState(withWallet({ balance }))?.wallet.balance).toBe(1000);
    },
  );

  it("repairs bets, prototype-key difficulties and unknown languages", () => {
    const parsed = parseSessionState(withWallet({ betAmount: 9999, difficulty: "toString", language: "de" }));
    expect(parsed?.wallet).toEqual({ balance: 250.5, betAmount: 500, difficulty: "medium", language: "en" });
    expect(parseSessionState(withWallet({ difficulty: "__proto__" }))?.wallet.difficulty).toBe("medium");
  });

  it("survives a missing or malformed game section", () => {
    expect(parseSessionState({ version: 2, wallet: valid.wallet })?.game).toEqual({ history: [], round: null });
    expect(parseSessionState({ ...valid, game: { history: "nope", round: 7 } })?.game).toEqual({ history: [], round: null });
  });

  it("keeps only well-formed history records, at most 15", () => {
    const good = { id: "a", bet: 10, steps: 3, multiplier: 1.23, payout: 12.3, result: "cashed_out", difficulty: "medium", prize: "pistol" };
    const history = [
      good,
      { ...good, id: "legacy", prize: "Classified Pistol | Ember" },
      { ...good, id: "hit", result: "hit", payout: 99 },
      { ...good, payout: "12" }, { ...good, steps: 21 }, { ...good, difficulty: "x" }, { ...good, result: "?" }, null, 5,
    ];
    const parsed = parseSessionState({ ...valid, game: { history, round: null } })!;
    expect(parsed.game.history.map((record) => record.id)).toEqual(["a", "legacy", "hit"]);
    expect("prize" in parsed.game.history[1]).toBe(false);
    expect(parsed.game.history[2].payout).toBe(0);
    const many = Array.from({ length: 30 }, (_, index) => ({ ...good, id: String(index) }));
    expect(parseSessionState({ ...valid, game: { history: many } })!.game.history).toHaveLength(15);
  });

  it("restores only a structurally valid in-flight round", () => {
    const round = { currentStep: 4, roundBet: 10, trackDifficulty: "easy", awaitingMilestoneChoice: true };
    expect(parseSessionState(withRound(round))?.game.round).toEqual({ ...round, awaitingMilestoneChoice: false });
    expect(parseSessionState(withRound({ ...round, currentStep: 10 }))?.game.round?.awaitingMilestoneChoice).toBe(true);
    for (const bad of [{ currentStep: 0 }, { currentStep: 20 }, { currentStep: 2.5 }, { roundBet: 0.5 },
      { roundBet: 600 }, { trackDifficulty: "constructor" }]) {
      expect(parseSessionState(withRound({ ...round, ...bad }))?.game.round).toBeNull();
    }
  });

  it("round-trips what the middleware writes", () => {
    const store = storeWith();
    store.dispatch(playRound(SAFE));
    const written = JSON.parse(JSON.stringify(toSessionState(store.getState())));
    expect(parseSessionState(written)).toEqual(toSessionState(store.getState()));
    expect(written.game.round).toEqual({ currentStep: 1, roundBet: 10, trackDifficulty: "medium", awaitingMilestoneChoice: false });
  });
});
