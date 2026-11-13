import { Container, Sprite, Text } from "pixi.js";
import { MAX_STEPS } from "@/src/lib/gameConstants";
import { multiplierForStep } from "@/src/lib/gameMath";
import type { Difficulty } from "@/src/types/game";
import type { SceneTextures } from "@/src/pixi/textures/assets";
import { MilestoneLayer } from "@/src/pixi/MilestoneLayer";

const LABEL_PX = 18;
const PLUS_PX = 22;
const PULSE_MS = 700;

export class CrateTrackLayer {
  readonly spacing = 140;
  readonly crateSize = 120;
  private readonly crates: Sprite[] = [];
  private readonly rims: Sprite[] = [];
  private readonly glows: Sprite[] = [];
  private readonly labels: Text[] = [];
  private readonly pulse: Sprite;
  private readonly plus: Text;
  private readonly milestones: MilestoneLayer;
  private baseline = 228;
  private textScale = 1;
  private pulseTime = PULSE_MS;
  private clearedThrough = -1;
  private difficulty: Difficulty | null = null;

  constructor(world: Container, textures: SceneTextures) {
    for (let lane = 1; lane <= MAX_STEPS; lane += 1) {
      const x = lane * this.spacing;
      const crate = this.sprite(textures.crate, x, this.crateSize, 1);
      const glow = this.sprite(textures["emerald-glow"], x, 175, 0);
      const rim = this.sprite(textures["cleared-rim"], x, 130, 0);
      const label = new Text({
        text: "",
        style: { fontFamily: "Arial", fontSize: LABEL_PX, fill: "#fff5cf", fontWeight: "bold", stroke: { color: "#2c241a", width: 4 } },
      });
      label.anchor.set(0.5, 0.5);
      label.x = x;
      this.crates.push(crate);
      this.rims.push(rim);
      this.glows.push(glow);
      this.labels.push(label);
      world.addChild(glow, crate, rim, label);
    }
    this.pulse = new Sprite(textures["emerald-ring"]);
    this.pulse.anchor.set(0.5);
    this.plus = new Text({ text: "", style: { fontFamily: "Arial", fontSize: PLUS_PX, fill: "#b1ffdb", fontWeight: "bold", stroke: { color: "#064e3b", width: 4 }, dropShadow: { color: "#10b981", blur: 8, distance: 0 } } });
    this.plus.anchor.set(0.5);
    this.pulse.visible = this.plus.visible = false;
    world.addChild(this.pulse, this.plus);
    this.milestones = new MilestoneLayer(world, textures, this.spacing);
  }

  /**
   * Text is rasterized once at its real CSS size and counter-scaled against the world scale,
   * so labels stay 18px on screen without re-rendering 21 text textures on every resize.
   */
  resize(baseline: number, worldScale = 1) {
    this.baseline = baseline;
    this.textScale = 1 / worldScale;
    this.crates.forEach((crate, lane) => {
      crate.y = this.rims[lane].y = this.glows[lane].y = this.crateY;
      this.labels[lane].y = Math.round(this.lidY - 14);
      this.labels[lane].scale.set(this.textScale);
    });
  }

  land(lane: number, difficulty: Difficulty) {
    this.clearedThrough = Math.max(this.clearedThrough, lane);
    this.pulseTime = 0;
    this.plus.text = `${multiplierForStep(difficulty, lane).toFixed(2)}x`;
    this.pulse.x = this.plus.x = lane * this.spacing;
    this.pulse.visible = this.plus.visible = true;
  }

  /** Marks crates as already cleared without the landing pulse (restored rounds). */
  restore(lane: number) {
    this.reset();
    this.clearedThrough = lane;
    this.rims.forEach((rim, index) => { rim.alpha = index + 1 <= lane ? 1 : 0; });
  }

  reset() {
    this.clearedThrough = -1;
    this.pulseTime = PULSE_MS;
    this.pulse.visible = this.plus.visible = false;
    this.rims.forEach((rim) => { rim.alpha = 0; });
  }

  update(difficulty: Difficulty) {
    if (difficulty === this.difficulty) return;
    this.difficulty = difficulty;
    this.labels.forEach((label, index) => {
      label.text = `${multiplierForStep(difficulty, index + 1).toFixed(2)}x`;
    });
  }

  tick(time: number, deltaMs: number) {
    this.milestones.tick(this.crateY, time);
    const easing = Math.min(1, deltaMs / 180);
    for (let lane = 0; lane < this.rims.length; lane += 1) {
      const rim = this.rims[lane];
      const target = lane + 1 <= this.clearedThrough ? 1 : 0;
      const alpha = Math.abs(target - rim.alpha) < 0.002 ? target : rim.alpha + (target - rim.alpha) * easing;
      rim.alpha = this.glows[lane].alpha = alpha;
      this.crates[lane].tint = (Math.round(255 - alpha * 95) << 16) | (255 << 8) | Math.round(255 - alpha * 85);
    }
    if (this.pulseTime >= PULSE_MS) return;
    this.pulseTime += deltaMs;
    const progress = Math.min(1, this.pulseTime / PULSE_MS);
    this.pulse.visible = this.plus.visible = progress < 1;
    this.pulse.y = this.crateY;
    this.pulse.scale.set(0.5 + progress * 0.7);
    this.pulse.alpha = 1 - progress;
    this.plus.y = this.crateY - 65 - progress * 32;
    this.plus.scale.set((0.9 + progress * 0.3) * this.textScale);
    this.plus.alpha = 1 - progress;
  }

  get crateY() {
    return this.baseline;
  }

  get lidY() {
    return this.baseline - this.crateSize / 2;
  }

  get streetY() {
    return this.baseline + this.crateSize / 2 + 12;
  }

  private sprite(texture: SceneTextures["crate"], x: number, size: number, alpha: number) {
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = sprite.height = size;
    sprite.x = x;
    sprite.alpha = alpha;
    return sprite;
  }
}
