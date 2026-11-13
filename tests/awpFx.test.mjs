import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { Container, Texture } from "pixi.js";

const source = fs.readFileSync(new URL("../src/pixi/AwpFxLayer.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsForTest = {};
new Function("require", "exports", compiled)(createRequire(import.meta.url), exportsForTest);
const { AwpFxLayer } = exportsForTest;

function createEffect() {
  const world = new Container();
  const textures = { beam: Texture.EMPTY, tracer: Texture.EMPTY, "impact-ring": Texture.EMPTY, feather: Texture.EMPTY };
  return { world, effect: new AwpFxLayer(world, textures) };
}

test("tracer hits before all feathers animate and expire", () => {
  const { world, effect } = createEffect();
  effect.trigger(0, 0, 200, 100);
  const tracer = world.children[1];
  assert.equal(tracer.x, 0);
  assert.equal(tracer.y, 0);
  assert.equal(tracer.scale.x, 0.25);
  effect.tick(40);
  assert.equal(tracer.x, 200 * 40 / 180);
  assert.ok(tracer.scale.x > 0.25 && tracer.scale.x < 1.35);
  for (let i = 0; i < 3; i += 1) assert.equal(effect.tick(40), false);
  assert.equal(world.children.length, 3);
  assert.equal(effect.tick(20), true);
  assert.equal(tracer.scale.x, 1.35);
  assert.equal(world.children.length, 35);
  const feathers = world.children.slice(3);
  const before = feathers.map((sprite) => [sprite.x, sprite.y]);
  assert.equal(effect.tick(40), false);
  feathers.forEach((sprite, index) => {
    assert.ok(sprite.x !== before[index][0] || sprite.y !== before[index][1]);
  });
  for (let i = 0; i < 50; i += 1) effect.tick(40);
  assert.equal(world.children.length, 3);
});

test("clearing an incoming shot prevents a later impact", () => {
  const { world, effect } = createEffect();
  effect.trigger(0, 0, 200, 100);
  effect.tick(40);
  effect.clear();
  for (let i = 0; i < 8; i += 1) assert.equal(effect.tick(40), false);
  assert.equal(world.children.length, 3);
});
