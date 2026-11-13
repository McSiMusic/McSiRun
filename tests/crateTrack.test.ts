import "./pixiTestAdapter";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Container, Texture } from "pixi.js";
import { CrateTrackLayer } from "../src/pixi/CrateTrackLayer";
import type { SceneTextures } from "../src/pixi/textures/assets";

test("safe landing highlights the current crate and displays its multiplier", () => {
  const textures = new Proxy({} as SceneTextures, { get: () => Texture.EMPTY });
  const track = new CrateTrackLayer(new Container(), textures);
  track.resize(200);
  assert.equal(track["labels"][0].x, track["crates"][0].x);
  assert.equal(track["labels"][0].y, track.lidY - 14);
  assert.equal(track["labels"][0].anchor.x, 0.5);
  assert.equal(track["labels"][0].anchor.y, 0.5);
  assert.equal(track["plus"].visible, false);
  track.tick(0, 40);
  assert.equal(track["rims"][0].alpha, 0);
  track.land(2, "medium");
  assert.equal(track["plus"].text, "1.14x");
  assert.equal(track["plus"].x, 2 * track.spacing);
  assert.equal(track["plus"].visible, true);
  track.tick(40, 40);
  assert.ok(track["rims"][1].alpha > 0);
  assert.equal(track["rims"][2].alpha, 0);
  track.tick(0, 700);
  assert.equal(track["plus"].visible, false);
});
