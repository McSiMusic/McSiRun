import { test } from "node:test";
import assert from "node:assert/strict";
import { assetPath } from "../src/lib/assetPath";

test("asset paths work both at the root and under GitHub Pages", () => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    assert.equal(assetPath("/sprites/crate.svg"), "/sprites/crate.svg");
    process.env.NEXT_PUBLIC_BASE_PATH = "/McSiRun";
    assert.equal(assetPath("/sprites/crate.svg"), "/McSiRun/sprites/crate.svg");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
    else process.env.NEXT_PUBLIC_BASE_PATH = previous;
  }
});
