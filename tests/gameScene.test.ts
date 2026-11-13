import "./pixiTestAdapter";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Container, Texture, TextureSource, Ticker, type Application } from "pixi.js";
import { GameSceneManager, type SceneSnapshot } from "../src/pixi/GameSceneManager";
import type { SceneTextures } from "../src/pixi/textures/assets";

function createScene(onComplete: (eventId: number) => void = () => {}) {
  const app = { stage: new Container(), ticker: new Ticker() } as Application;
  const leg = new Texture({ source: new TextureSource({ width: 37, height: 40 }) });
  const textures = new Proxy({} as SceneTextures, {
    get: (_, name) => name === "leg" ? leg : Texture.EMPTY,
  });
  return new GameSceneManager(app, textures, onComplete);
}

test("scene keeps the chicken in front and lands on the crate lid in a short viewport", () => {
  const scene = createScene();
  const snapshot: SceneSnapshot = { status: "idle", currentStep: 0, difficulty: "medium", eventId: 0, jumping: false };
  const world = scene["world"];
  const track = scene["track"];
  const chicken = scene["chicken"];
  scene.resize(812, 321, 130);
  scene.update(snapshot);
  scene["tick"](0);
  assert.equal(world.getChildIndex(chicken.container), 1);
  assert.equal(chicken.container.x, track.spacing);
  assert.equal(chicken.container.y + chicken.footOffset, track.streetY);
  assert.ok(track.streetY > track.crateY + 60);
  assert.ok(track.streetY * world.scale.y < 321 - 130);

  scene.update({ ...snapshot, status: "active", jumping: true, eventId: 1 });
  scene["tick"](300);
  assert.equal(chicken.container.x, track.spacing);
  assert.equal(chicken.container.y + chicken.footOffset, track.lidY);
  scene.update({ ...snapshot, status: "active", currentStep: 1, eventId: 2 });
  scene.update({ ...snapshot, status: "active", currentStep: 1, jumping: true, eventId: 2 });
  scene["tick"](300);
  assert.equal(chicken.container.x, 2 * track.spacing);
  assert.equal(chicken.container.y + chicken.footOffset, track.lidY);
});

test("loss starts at the window, reveals after the animation, and cancels on restart", () => {
  const revealed: number[] = [];
  const scene = createScene((id) => revealed.push(id));
  const initial: SceneSnapshot = { status: "idle", currentStep: 0, difficulty: "medium", eventId: 0, jumping: false };
  scene.resize(812, 321, 130);
  scene.update(initial);
  scene.update({ ...initial, status: "active", jumping: true, eventId: 1 });
  scene["tick"](300);
  const source = scene["background"].windowVantage(scene["track"].spacing * scene["worldScale"] + scene["world"].x);
  scene.update({ ...initial, status: "lost", eventId: 2 });
  const effects = scene["effects"];
  assert.ok(Math.abs(effects["sourceX"] * scene["world"].scale.x + scene["world"].x - source.x) < 0.001);
  assert.ok(Math.abs(effects["sourceY"] * scene["world"].scale.y - source.y) < 0.001);
  for (let i = 0; i < 24; i += 1) scene["tick"](40);
  assert.deepEqual(revealed, []);
  scene["tick"](40);
  assert.deepEqual(revealed, [2]);

  scene.update({ ...initial, status: "active", jumping: true, eventId: 3 });
  scene["tick"](300);
  scene.update({ ...initial, status: "lost", eventId: 4 });
  scene.update({ ...initial, status: "active", jumping: true, eventId: 5 });
  for (let i = 0; i < 30; i += 1) scene["tick"](40);
  assert.deepEqual(revealed, [2]);
});
