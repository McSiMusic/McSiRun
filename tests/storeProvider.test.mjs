import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { configureStore } from "@reduxjs/toolkit";

const source = fs.readFileSync(new URL("../src/store/StoreProvider.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exportsForTest = {};
const require = createRequire(import.meta.url);
new Function("require", "exports", compiled)((id) => {
  if (id === "@/src/store") return { makeStore: () => configureStore({ reducer: (state = {}) => state }) };
  if (id === "@/src/store/hooks") return { useAppDispatch: require("react-redux").useDispatch };
  if (id.startsWith("@/src/store/")) return {};
  return require(id);
}, exportsForTest);

test("the Redux provider renders route children during server rendering", () => {
  const html = renderToStaticMarkup(React.createElement(exportsForTest.StoreProvider, null, React.createElement("main", null, "Game")));
  assert.equal(html, "<main>Game</main>");
});
