import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { Container, Texture, TextureSource } from "pixi.js";

const require = createRequire(import.meta.url);
function load(path, imports = {}) {
  const source = fs.readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const result = {};
  new Function("require", "exports", compiled)((id) => imports[id] ?? require(id), result);
  return result;
}

class Track {
  spacing = 140;
  crateSize = 120;
  crateY = 0;
  constructor(world) { this.world = world; }
  get lidY() { return this.crateY - 60; }
  get streetY() { return this.crateY + 72; }
  resize(y) { this.crateY = y; }
  reset() {}
  update() {}
  land() {}
  tick() {}
}
class Background {
  resize() {}
  advance() {}
  windowVantage() { return { x: 123, y: 80 }; }
}
class Effects {
  clear() {}
  trigger(...args) { this.shot = args; }
  tick() { return false; }
}

const { ChickenActor } = load("../src/pixi/ChickenActor.ts");
const { GameSceneManager } = load("../src/pixi/GameSceneManager.ts", {
  "@/src/lib/gameMath": { MAX_STEPS: 20 },
  "@/src/pixi/ItalyParallaxLayer": { ItalyParallaxLayer: Background },
  "@/src/pixi/CrateTrackLayer": { CrateTrackLayer: Track },
  "@/src/pixi/ChickenActor": { ChickenActor },
  "@/src/pixi/AwpFxLayer": { AwpFxLayer: Effects },
});

test("scene keeps the chicken in front and lands on the crate lid in a short viewport", () => {
  let tick;
  const app = { stage: new Container(), ticker: { add: (callback) => { tick = callback; } } };
  const leg = new Texture({ source: new TextureSource({ width: 37, height: 40 }) });
  const textures = new Proxy({}, { get: (_, name) => name === "leg" ? leg : Texture.EMPTY });
  const scene = new GameSceneManager(app, textures, () => {});
  const snapshot = { status: "idle", currentStep: 0, difficulty: "medium", eventId: 0, jumping: false };
  scene.resize(812, 321, 130);
  scene.update(snapshot);
  tick({ deltaMS: 0 });
  assert.equal(scene.world.getChildIndex(scene.chicken.container), 1);
  assert.equal(scene.chicken.container.x, scene.track.spacing);
  assert.equal(scene.chicken.container.y + scene.chicken.footOffset, scene.track.streetY);
  assert.ok(scene.track.streetY > scene.track.crateY + 60);
  assert.ok(scene.track.streetY * scene.world.scale.y < 321 - 130);

  scene.update({ ...snapshot, status: "active", jumping: true, eventId: 1 });
  tick({ deltaMS: 300 });
  assert.equal(scene.chicken.container.x, scene.track.spacing);
  assert.equal(scene.chicken.container.y + scene.chicken.footOffset, scene.track.lidY);
  scene.update({ ...snapshot, status: "active", currentStep: 1, eventId: 2 });
  scene.update({ ...snapshot, status: "active", currentStep: 1, jumping: true, eventId: 2 });
  tick({ deltaMS: 300 });
  assert.equal(scene.chicken.container.x, 2 * scene.track.spacing);
  assert.equal(scene.chicken.container.y + scene.chicken.footOffset, scene.track.lidY);
});

test("loss starts at the window, reveals after the animation, and cancels on restart", () => {
  let tick;
  const app = { stage: new Container(), ticker: { add: (callback) => { tick = callback; } } };
  const textures = new Proxy({}, { get: () => Texture.EMPTY });
  const revealed = [];
  const scene = new GameSceneManager(app, textures, (id) => revealed.push(id));
  const initial = { status: "idle", currentStep: 0, difficulty: "medium", eventId: 0, jumping: false };
  scene.resize(812, 321, 130);
  scene.update(initial);
  scene.update({ ...initial, status: "active", jumping: true, eventId: 1 });
  tick({ deltaMS: 300 });
  scene.update({ ...initial, status: "lost", eventId: 2 });
  const [x, y] = scene.effects.shot;
  assert.ok(Math.abs((x * scene.world.scale.x + scene.world.x) - 123) < 0.001);
  assert.ok(Math.abs(y * scene.world.scale.y - 80) < 0.001);
  for (let i = 0; i < 24; i += 1) tick({ deltaMS: 40 });
  assert.deepEqual(revealed, []);
  tick({ deltaMS: 40 });
  assert.deepEqual(revealed, [2]);

  scene.update({ ...initial, status: "active", jumping: true, eventId: 3 });
  tick({ deltaMS: 300 });
  scene.update({ ...initial, status: "lost", eventId: 4 });
  scene.update({ ...initial, status: "active", jumping: true, eventId: 5 });
  for (let i = 0; i < 30; i += 1) tick({ deltaMS: 40 });
  assert.deepEqual(revealed, [2]);
});
