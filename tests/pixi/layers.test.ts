import { describe, expect, it } from "vitest";
import { Container } from "pixi.js";
import { AwpFxLayer } from "@/src/pixi/AwpFxLayer";
import { ChickenActor } from "@/src/pixi/ChickenActor";
import { CrateTrackLayer } from "@/src/pixi/CrateTrackLayer";
import { SceneCamera } from "@/src/pixi/SceneCamera";
import { fakeTextures } from "../helpers/pixi";

describe("AwpFxLayer", () => {
  it("animates the tracer, bursts 28-36 feathers on impact, then cleans them all up", () => {
    const world = new Container();
    const effect = new AwpFxLayer(world, fakeTextures());
    effect.trigger(0, 0, 200, 100);
    const tracer = world.children[1];
    expect([tracer.x, tracer.y, tracer.scale.x]).toEqual([0, 0, 0.25]);
    effect.tick(40);
    expect(tracer.x).toBeCloseTo(200 * 40 / 180);
    for (let i = 0; i < 3; i += 1) expect(effect.tick(40)).toBe(false);
    expect(effect.tick(20)).toBe(true);
    const feathers = world.children.length - 3;
    expect(feathers).toBeGreaterThanOrEqual(28);
    expect(feathers).toBeLessThanOrEqual(36);
    for (let i = 0; i < 50; i += 1) effect.tick(40);
    expect(world.children).toHaveLength(3);
  });

  it("clearing an incoming shot prevents a later impact", () => {
    const world = new Container();
    const effect = new AwpFxLayer(world, fakeTextures());
    effect.trigger(0, 0, 200, 100);
    effect.tick(40);
    effect.clear();
    for (let i = 0; i < 8; i += 1) expect(effect.tick(40)).toBe(false);
    expect(world.children).toHaveLength(3);
  });
});

describe("ChickenActor", () => {
  it("jumps from the street onto the first lid and then onto the next lid", () => {
    const chicken = new ChickenActor(fakeTextures());
    const feet = () => chicken.container.y + chicken.footOffset;
    chicken.reset(140);
    chicken.tick(0, 272, 140);
    expect([chicken.container.x, feet()]).toEqual([140, 272]);
    chicken.jump(140, 140, true);
    chicken.tick(180, 272, 140);
    expect(feet()).toBeLessThan(272);
    chicken.tick(120, 272, 140);
    expect([chicken.container.x, feet()]).toEqual([140, 140]);
    chicken.completeJump();
    chicken.jump(140, 280);
    chicken.tick(180, 272, 140);
    expect(chicken.container.x).toBe(210);
    chicken.tick(120, 272, 140);
    expect([chicken.container.x, feet()]).toEqual([280, 140]);
  });
});

describe("CrateTrackLayer", () => {
  it("highlights the landed crate and floats its multiplier", () => {
    const track = new CrateTrackLayer(new Container(), fakeTextures());
    track.resize(200);
    track.update("medium");
    expect(track["labels"][0].x).toBe(track["crates"][0].x);
    expect(track["labels"][0].text).toBe("1.07x");
    track.land(2, "medium");
    expect(track["plus"].text).toBe("1.14x");
    expect(track["plus"].visible).toBe(true);
    track.tick(40, 40);
    expect(track["rims"][1].alpha).toBeGreaterThan(0);
    expect(track["rims"][2].alpha).toBe(0);
    track.tick(0, 700);
    expect(track["plus"].visible).toBe(false);
    for (let i = 0; i < 60; i += 1) track.tick(0, 16);
    expect(track["rims"][1].alpha).toBe(1);
  });

  it("keeps labels at 18 CSS px by counter-scaling instead of re-rasterizing on resize", () => {
    const track = new CrateTrackLayer(new Container(), fakeTextures());
    track.resize(200, 0.5);
    const label = track["labels"][0];
    expect(label.style.fontSize).toBe(18);
    expect(label.scale.x * 0.5).toBe(1);
    track.resize(200, 0.25);
    expect(label.style.fontSize).toBe(18);
    expect(label.scale.x * 0.25).toBe(1);
  });

  it("restores cleared crates without a landing pulse", () => {
    const track = new CrateTrackLayer(new Container(), fakeTextures());
    track.restore(3);
    expect(track["rims"].map((rim) => rim.alpha).slice(0, 4)).toEqual([1, 1, 1, 0]);
    expect(track["plus"].visible).toBe(false);
  });
});

describe("SceneCamera", () => {
  it("holds during the crouch, pans during the hop and reports distances", () => {
    const camera = new SceneCamera();
    expect(camera.snap(140)).toBe(140);
    camera.pan(280);
    expect(camera.tick(60)).toBe(0);
    expect(camera.tick(120)).toBe(70);
    expect(camera.finish()).toBe(70);
    expect(camera.x).toBe(280);
  });
});
