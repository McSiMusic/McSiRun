import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { Container, Texture } from "pixi.js";

const source = fs.readFileSync(new URL("../src/pixi/CrateTrackLayer.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsForTest = {};
const require = createRequire(import.meta.url);
new Function("require", "exports", compiled)((id) => {
  if (id === "@/src/lib/gameMath") return { MAX_STEPS: 20, multiplierForStep: (_, step) => step === 1 ? 1.07 : 1.14 };
  if (id === "@/src/pixi/MilestoneLayer") return { MilestoneLayer: class { tick() {} } };
  return require(id);
}, exportsForTest);

test("safe landing highlights the current crate and displays its multiplier", () => {
  const textures = new Proxy({}, { get: () => Texture.EMPTY });
  const track = new exportsForTest.CrateTrackLayer(new Container(), textures);
  track.resize(200);
  assert.equal(track.labels[0].x, track.crates[0].x);
  assert.equal(track.labels[0].y, track.lidY - 14);
  assert.equal(track.labels[0].anchor.x, 0.5);
  assert.equal(track.labels[0].anchor.y, 0.5);
  assert.equal(track.plus.visible, false);
  track.tick(0, 40);
  assert.equal(track.rims[0].alpha, 0);
  track.land(2, "medium");
  assert.equal(track.plus.text, "1.14x");
  assert.equal(track.plus.x, 2 * track.spacing);
  assert.equal(track.plus.visible, true);
  track.tick(40, 40);
  assert.ok(track.rims[1].alpha > 0);
  assert.equal(track.rims[2].alpha, 0);
  track.tick(0, 700);
  assert.equal(track.plus.visible, false);
});
