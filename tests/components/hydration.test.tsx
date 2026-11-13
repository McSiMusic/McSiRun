// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StoreProvider } from "@/src/store/StoreProvider";
import { useAppSelector } from "@/src/store/hooks";
import { STORAGE_KEY } from "@/src/store/sessionStorage";

function Probe() {
  const balance = useAppSelector((state) => state.wallet.balance);
  const difficulty = useAppSelector((state) => state.wallet.difficulty);
  const status = useAppSelector((state) => state.game.status);
  const step = useAppSelector((state) => state.game.currentStep);
  return <output>{`${balance}|${difficulty}|${status}|${step}`}</output>;
}

const mount = () => render(<StoreProvider><Probe /></StoreProvider>);

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});

describe("client hydration", () => {
  it.each([
    ["corrupt JSON", "{oops"],
    ["missing history", JSON.stringify({ version: 2, wallet: { balance: 50 }, game: {} })],
    ["tampered balance and difficulty", JSON.stringify({ version: 2, wallet: { balance: "free", difficulty: "toString" } })],
  ])("never crashes or grants free play with %s", (_, raw) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem(STORAGE_KEY, raw);
    mount();
    const [balance, difficulty] = screen.getByRole("status").textContent!.split("|");
    expect(Number.isFinite(Number(balance))).toBe(true);
    expect(difficulty).toBe("medium");
  });

  it("restores a saved in-flight round", () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      wallet: { balance: 90, betAmount: 10, difficulty: "easy", language: "en" },
      game: { history: [], round: { currentStep: 6, roundBet: 10, trackDifficulty: "hard", awaitingMilestoneChoice: false } },
    }));
    mount();
    expect(screen.getByRole("status").textContent).toBe("90|easy|active|6");
  });
});
