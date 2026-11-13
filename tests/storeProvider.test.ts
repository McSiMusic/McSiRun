import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StoreProvider } from "../src/store/StoreProvider";

test("the Redux provider renders route children during server rendering", () => {
  const html = renderToStaticMarkup(React.createElement(StoreProvider, null, React.createElement("main", null, "Game")));
  assert.equal(html, "<main>Game</main>");
});
