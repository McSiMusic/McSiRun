// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, type ImgHTMLAttributes } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { GameClient } from "@/src/components/game/GameClient";
import type { SceneSnapshot } from "@/src/pixi/sceneLayout";
import { setMuted } from "@/src/store/walletSlice";
import { JUMP_DURATION_MS } from "@/src/lib/gameConstants";
import { PLAY_REARM_MS } from "@/src/components/game/useRoundActions";
import { storeWith } from "../helpers/fixtures";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain stand-in for next/image in jsdom
  default: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => <img src={String(src)} alt={alt} />,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => <a href={href} {...rest}>{children}</a>,
}));
/** Stands in for the Pixi scene: reports the end of the elimination sequence one second after a loss. */
vi.mock("@/src/components/game/PixiStageCanvas", () => ({
  PixiStageCanvas: ({ snapshot, onEliminationComplete }: { snapshot: SceneSnapshot; onEliminationComplete: (id: number) => void }) => {
    useEffect(() => {
      if (snapshot.status !== "lost") return;
      const timer = setTimeout(() => onEliminationComplete(snapshot.eventId), 1000);
      return () => clearTimeout(timer);
    }, [snapshot.status, snapshot.eventId, onEliminationComplete]);
    return <div data-testid="stage" data-step={snapshot.currentStep} data-jumping={snapshot.jumping} />;
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function mount(wallet?: Parameters<typeof storeWith>[0]) {
  const store = storeWith(wallet);
  render(<Provider store={store}><GameClient /></Provider>);
  return store;
}
const button = (name: RegExp) => screen.getByRole("button", { name });
const land = () => act(() => { vi.advanceTimersByTime(JUMP_DURATION_MS); });
/** Clicks the same element repeatedly, as a double/triple click would, even after React swaps it out. */
const pressRapidly = (name: RegExp, times = 3) => {
  const target = button(name);
  for (let i = 0; i < times; i += 1) fireEvent.click(target);
};

describe("GameClient round flow", () => {
  it("Play → GO → Cash Out credits exactly once under rapid clicks", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const store = mount();
    pressRapidly(/^Play$/);
    expect(store.getState().wallet.balance).toBe(990);
    expect(screen.getByTestId("stage").dataset.jumping).toBe("true");
    land();
    pressRapidly(/^GO$/);
    land();
    expect(store.getState().game.currentStep).toBe(2);
    pressRapidly(/CASH OUT/);
    expect(store.getState().wallet.balance).toBe(1001.4);
    expect(store.getState().game.history).toHaveLength(1);
    expect(screen.getByText(/YOU WON! \+\$11\.40/)).toBeTruthy();
  });

  it("does not let a double-click on Cash Out place a new bet via Play Again", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const store = mount();
    fireEvent.click(button(/^Play$/));
    land();
    fireEvent.click(button(/CASH OUT/));
    fireEvent.click(button(/Play Again/));
    expect(store.getState().wallet.balance).toBe(1000.7);
    expect(store.getState().game.status).toBe("won");
    act(() => { vi.advanceTimersByTime(PLAY_REARM_MS); });
    fireEvent.click(button(/Play Again/));
    expect(store.getState().wallet.balance).toBe(990.7);
    expect(store.getState().game.status).toBe("active");
  });

  it("reveals the multiplier only when the hop lands", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    mount();
    fireEvent.click(button(/^Play$/));
    expect(screen.getByText("1.00x")).toBeTruthy();
    land();
    expect(screen.getByText("1.07x")).toBeTruthy();
  });

  it("keeps a loss hidden and Play Again locked until the elimination sequence completes", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const store = mount();
    fireEvent.click(button(/^Play$/));
    expect(store.getState().game.status).toBe("lost");
    expect(button(/^GO$/)).toHaveProperty("disabled", true);
    land();
    expect(screen.queryByText(/SNIPED/)).toBeNull();
    expect(button(/Play Again/)).toHaveProperty("disabled", true);
    pressRapidly(/Play Again/);
    expect(store.getState().wallet.balance).toBe(990);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/SNIPED/)).toBeTruthy();
    expect(button(/Play Again/)).toHaveProperty("disabled", false);
  });

  it("finishes rounds normally even when Web Audio throws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    vi.stubGlobal("AudioContext", function Broken() { throw new Error("blocked"); });
    const store = mount();
    act(() => { store.dispatch(setMuted(false)); });
    fireEvent.click(button(/^Play$/));
    land();
    fireEvent.click(button(/^GO$/));
    land();
    expect(store.getState().game.currentStep).toBe(2);
    expect(button(/^GO$/)).toHaveProperty("disabled", false);
  });

  it("opens the top-up dialog instead of debiting when the balance is too low", () => {
    const store = mount({ balance: 5 });
    fireEvent.click(button(/^Play$/));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(store.getState().wallet.balance).toBe(5);
    expect(store.getState().game.status).toBe("idle");
  });

  it("never resets or re-curves a finished round when settings change", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const store = mount({ difficulty: "easy" });
    fireEvent.click(button(/^Play$/));
    land();
    fireEvent.click(button(/CASH OUT/));
    fireEvent.click(screen.getAllByRole("button", { name: "Hardcore" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "20 $" })[0]);
    const { game, wallet } = store.getState();
    expect(wallet).toMatchObject({ difficulty: "hardcore", betAmount: 20 });
    expect(game).toMatchObject({ status: "won", currentStep: 1, trackDifficulty: "easy", multiplier: 1.03 });
  });

  it("offers the pistol at step 10 and pays it on claim", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const store = mount();
    fireEvent.click(button(/^Play$/));
    land();
    for (let step = 1; step < 10; step += 1) {
      fireEvent.click(button(/^GO$/));
      land();
    }
    expect(screen.getByRole("dialog", { name: /MILESTONE SKIN UNLOCKED/ })).toBeTruthy();
    fireEvent.click(button(/CLAIM PISTOL & CASH OUT/));
    expect(store.getState().wallet.balance).toBe(1009.7);
    expect(store.getState().game.history[0]).toMatchObject({ prize: "pistol", steps: 10 });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
