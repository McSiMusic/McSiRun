import { describe, expect, it } from "vitest";
import { Container, Ticker, type Application } from "pixi.js";
import { GameSceneManager } from "@/src/pixi/GameSceneManager";
import type { SceneSnapshot } from "@/src/pixi/sceneLayout";
import { fakeTextures } from "../helpers/pixi";

const idle: SceneSnapshot = { status: "idle", currentStep: 0, difficulty: "medium", eventId: 0, jumping: false };

function createScene(onComplete: (eventId: number) => void = () => {}) {
  const app = { stage: new Container(), ticker: new Ticker() } as Application;
  const scene = new GameSceneManager(app, fakeTextures(), onComplete);
  scene.resize(812, 321, 130);
  return { app, scene, tick: (ms: number) => scene["tick"](ms) };
}

describe("GameSceneManager", () => {
  it("starts on the street, keeps the chicken in front and lands on crate lids", () => {
    const { scene, tick } = createScene();
    const { world, track, chicken } = { world: scene["world"], track: scene["track"], chicken: scene["chicken"] };
    const feet = () => chicken.container.y + chicken.footOffset;
    scene.update(idle);
    tick(0);
    expect(world.getChildIndex(chicken.container)).toBe(1);
    expect([chicken.container.x, feet()]).toEqual([track.spacing, track.streetY]);
    expect(track.streetY * world.scale.y).toBeLessThan(321 - 130);

    scene.update({ ...idle, status: "active", jumping: true, eventId: 1 });
    tick(380);
    expect([chicken.container.x, feet()]).toEqual([track.spacing, track.lidY]);
    scene.update({ ...idle, status: "active", currentStep: 1, eventId: 2 });
    scene.update({ ...idle, status: "active", currentStep: 1, jumping: true, eventId: 2 });
    tick(380);
    expect([chicken.container.x, feet()]).toEqual([2 * track.spacing, track.lidY]);
  });

  it("fires from a window, reveals the loss after the sequence, and cancels on restart", () => {
    const revealed: number[] = [];
    const { scene, tick } = createScene((id) => revealed.push(id));
    scene.update(idle);
    scene.update({ ...idle, status: "active", jumping: true, eventId: 1 });
    tick(300);
    const source = scene["background"].windowVantage(scene["track"].spacing * scene["worldScale"] + scene["world"].x);
    scene.update({ ...idle, status: "lost", eventId: 2 });
    const effects = scene["effects"];
    expect(effects["sourceX"] * scene["world"].scale.x + scene["world"].x).toBeCloseTo(source.x);
    expect(effects["sourceY"] * scene["world"].scale.y).toBeCloseTo(source.y);
    for (let i = 0; i < 24; i += 1) tick(40);
    expect(revealed).toEqual([]);
    tick(40);
    expect(revealed).toEqual([2]);

    scene.update({ ...idle, status: "active", jumping: true, eventId: 3 });
    tick(300);
    scene.update({ ...idle, status: "lost", eventId: 4 });
    scene.update({ ...idle, status: "active", jumping: true, eventId: 5 });
    for (let i = 0; i < 30; i += 1) tick(40);
    expect(revealed).toEqual([2]);
  });

  it("places the chicken on the right crate when a saved round is restored", () => {
    const { scene, tick } = createScene();
    scene.update(idle);
    scene.update({ ...idle, status: "active", currentStep: 6, eventId: 7 });
    tick(16);
    const track = scene["track"];
    expect(scene["chicken"].container.x).toBe(6 * track.spacing);
    expect(scene["chicken"].container.y + scene["chicken"].footOffset).toBe(track.lidY);
    expect(track["rims"][5].alpha).toBe(1);
    expect(track["plus"].visible).toBe(false);
  });

  it("removes its ticker callback and destroys its display tree", () => {
    const { app, scene } = createScene();
    const listeners = app.ticker.count;
    expect(app.stage.children.length).toBeGreaterThan(0);
    scene.destroy();
    expect(app.ticker.count).toBe(listeners - 1);
    expect(app.stage.children).toHaveLength(0);
    expect(scene["world"].destroyed).toBe(true);
  });
});
