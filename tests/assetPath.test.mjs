import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/assetPath.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsForTest = {};
new Function("require", "exports", compiled)(createRequire(import.meta.url), exportsForTest);

test("asset paths work both at the root and under GitHub Pages", () => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    assert.equal(exportsForTest.assetPath("/sprites/crate.svg"), "/sprites/crate.svg");
    process.env.NEXT_PUBLIC_BASE_PATH = "/McSiRun";
    assert.equal(exportsForTest.assetPath("/sprites/crate.svg"), "/McSiRun/sprites/crate.svg");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
    else process.env.NEXT_PUBLIC_BASE_PATH = previous;
  }
});
