import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { Texture } from "pixi.js";

const source = fs.readFileSync(new URL("../src/pixi/ChickenActor.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsForTest = {};
new Function("require", "exports", compiled)(createRequire(import.meta.url), exportsForTest);
const { ChickenActor } = exportsForTest;

test("chicken jumps from the street onto the first lid and then the next lid", () => {
  const textures = { body: Texture.EMPTY, head: Texture.EMPTY, wing: Texture.EMPTY, leg: Texture.EMPTY };
  const chicken = new ChickenActor(textures);
  chicken.reset(140);
  chicken.tick(0, 272, 140);
  assert.equal(chicken.container.x, 140);
  assert.equal(chicken.container.y + chicken.footOffset, 272);
  chicken.jump(140, 140, true);
  chicken.tick(180, 272, 140);
  assert.equal(chicken.container.x, 140);
  assert.ok(chicken.container.y + chicken.footOffset < 272);
  chicken.tick(120, 272, 140);
  assert.equal(chicken.container.x, 140);
  assert.equal(chicken.container.y + chicken.footOffset, 140);
  chicken.completeJump();
  chicken.jump(140, 280);
  chicken.tick(180, 272, 140);
  assert.equal(chicken.container.x, 210);
  assert.ok(chicken.container.y + chicken.footOffset < 140);
  chicken.tick(120, 272, 140);
  assert.equal(chicken.container.x, 280);
  assert.equal(chicken.container.y + chicken.footOffset, 140);
  chicken.completeJump();
  chicken.reset(140);
  chicken.tick(0, 272, 140);
  assert.equal(chicken.container.x, 140);
  assert.equal(chicken.container.y + chicken.footOffset, 272);
});
