import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreProvider } from "@/src/store/StoreProvider";

describe("StoreProvider", () => {
  it("renders route children during server rendering without touching browser storage", () => {
    expect(typeof window).toBe("undefined");
    expect(renderToStaticMarkup(<StoreProvider><main>Game</main></StoreProvider>)).toBe("<main>Game</main>");
  });
});
