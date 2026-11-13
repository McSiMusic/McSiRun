import { Container, Sprite, Text } from "pixi.js";
import { MAX_STEPS, multiplierForStep } from "@/src/lib/gameMath";
import type { Difficulty } from "@/src/types/game";
import type { SceneTextures } from "@/src/pixi/textures/assets";
import { MilestoneLayer } from "@/src/pixi/MilestoneLayer";

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
  private pulseTime = 700;
  private clearedThrough = -1;

  constructor(private readonly world: Container, textures: SceneTextures) {
    for (let lane = 1; lane <= MAX_STEPS; lane += 1) {
      const crate = new Sprite(textures.crate);
      crate.anchor.set(0.5);
      crate.width = crate.height = this.crateSize;
      crate.x = lane * this.spacing;
      const glow = new Sprite(textures["emerald-glow"]);
      glow.anchor.set(0.5);
      glow.width = glow.height = 175;
      glow.x = crate.x;
      glow.alpha = 0;
      const rim = new Sprite(textures["cleared-rim"]);
      rim.anchor.set(0.5);
      rim.width = rim.height = 130;
      rim.x = crate.x;
      rim.alpha = 0;
      const label = new Text({
        text: "",
        style: { fontFamily: "Arial", fontSize: 18, fill: "#fff5cf", fontWeight: "bold", stroke: { color: "#2c241a", width: 4 } },
      });
      label.anchor.set(0.5, 0.5);
      label.x = crate.x;
      this.crates.push(crate);
      this.rims.push(rim);
      this.glows.push(glow);
      this.labels.push(label);
      world.addChild(glow, crate, rim, label);
    }
    this.pulse = new Sprite(textures["emerald-ring"]);
    this.pulse.anchor.set(0.5);
    this.plus = new Text({ text: "", style: { fontFamily: "Arial", fontSize: 22, fill: "#b1ffdb", fontWeight: "bold", stroke: { color: "#064e3b", width: 4 }, dropShadow: { color: "#10b981", blur: 8, distance: 0 } } });
    this.plus.anchor.set(0.5);
    this.pulse.visible = this.plus.visible = false;
    world.addChild(this.pulse, this.plus);
    this.milestones = new MilestoneLayer(world, textures, this.spacing);
  }

  resize(baseline: number, scale = 1) {
    this.baseline = baseline;
    this.crates.forEach((crate, lane) => {
      crate.y = this.crateY;
      this.rims[lane].y = this.crateY;
      this.glows[lane].y = this.crateY;
      this.labels[lane].y = Math.round(this.lidY - 14);
      this.labels[lane].style.fontSize = 18 / scale;
    });
    this.plus.style.fontSize = 22 / scale;
  }

  land(lane: number, difficulty: Difficulty) {
    this.clearedThrough = Math.max(this.clearedThrough, lane);
    this.pulseTime = 0;
    this.plus.text = `${multiplierForStep(difficulty, lane).toFixed(2)}x`;
    this.pulse.x = this.plus.x = lane * this.spacing;
    this.pulse.visible = this.plus.visible = true;
  }

  reset() {
    this.clearedThrough = -1;
    this.pulseTime = 700;
    this.pulse.visible = this.plus.visible = false;
    this.rims.forEach((rim) => { rim.alpha = 0; });
    this.glows.forEach((glow) => { glow.alpha = 0; });
  }

  update(difficulty: Difficulty) {
    this.crates.forEach((crate, index) => {
      this.labels[index].text = `${multiplierForStep(difficulty, index + 1).toFixed(2)}x`;
      crate.tint = 0xffffff;
    });
  }

  tick(time: number, deltaMs: number) {
    this.milestones.tick(this.crateY, time);
    this.rims.forEach((rim, lane) => {
      const target = lane + 1 <= this.clearedThrough ? 1 : 0;
      rim.alpha += (target - rim.alpha) * Math.min(1, deltaMs / 180);
      this.glows[lane].alpha = rim.alpha;
      const red = Math.round(255 - rim.alpha * 95);
      const blue = Math.round(255 - rim.alpha * 85);
      this.crates[lane].tint = (red << 16) | (255 << 8) | blue;
    });
    this.pulseTime += deltaMs;
    const progress = Math.min(1, this.pulseTime / 700);
    this.pulse.visible = this.plus.visible = progress < 1;
    this.pulse.y = this.crateY;
    this.pulse.scale.set(0.5 + progress * 0.7);
    this.pulse.alpha = 1 - progress;
    this.plus.y = this.crateY - 65 - progress * 32;
    this.plus.scale.set(0.9 + progress * 0.3);
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
}
