import { Container, Sprite } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";
import { JUMP_DURATION_MS, JUMP_TIMING } from "@/src/lib/gameConstants";

const { crouch: CROUCH, hop: HOP, land: LAND } = JUMP_TIMING;
const AIRBORNE_END = CROUCH + HOP;

export class ChickenActor {
  readonly container = new Container();
  private readonly body: Sprite;
  private readonly head: Sprite;
  private readonly wing: Sprite;
  private readonly leftLeg: Sprite;
  private readonly rightLeg: Sprite;
  private animation = JUMP_DURATION_MS;
  private elapsed = 0;
  private fromX = 0;
  private toX = 0;
  private onStreet = true;
  private fromStreet = false;
  readonly footOffset: number;

  constructor(textures: SceneTextures) {
    this.body = new Sprite(textures.body);
    this.head = new Sprite(textures.head);
    this.wing = new Sprite(textures.wing);
    this.leftLeg = new Sprite(textures.leg);
    this.rightLeg = new Sprite(textures.leg);
    this.leftLeg.anchor.set(0.5, 0.1);
    this.rightLeg.anchor.set(0.5, 0.1);
    this.leftLeg.position.set(-15, -12);
    this.rightLeg.position.set(13, -12);
    this.leftLeg.scale.set(0.7);
    this.rightLeg.scale.set(0.7);
    this.footOffset = this.leftLeg.y + (1 - this.leftLeg.anchor.y) * this.leftLeg.height;
    this.body.anchor.set(0.5);
    this.body.position.set(0, -37);
    this.body.scale.set(0.78);
    this.wing.anchor.set(0.7, 0.2);
    this.wing.position.set(5, -42);
    this.wing.scale.set(0.7);
    this.head.anchor.set(0.38, 0.7);
    this.head.position.set(24, -60);
    this.head.scale.set(0.7);
    this.container.addChild(this.leftLeg, this.rightLeg, this.body, this.wing, this.head);
  }

  jump(from: number, to: number, fromStreet = false) {
    this.fromX = from;
    this.toX = to;
    this.onStreet = false;
    this.fromStreet = fromStreet;
    this.animation = 0;
    this.container.visible = true;
    this.container.rotation = 0;
  }

  eliminate() {
    this.container.visible = false;
  }

  completeJump() {
    this.animation = JUMP_DURATION_MS;
    this.container.x = this.toX;
    this.fromStreet = false;
  }

  reset(x: number) {
    this.fromX = this.toX = x;
    this.animation = JUMP_DURATION_MS;
    this.onStreet = true;
    this.fromStreet = false;
    this.container.visible = true;
    this.container.rotation = 0;
    this.container.x = x;
  }

  place(x: number) {
    this.reset(x);
    this.onStreet = false;
    this.container.x = x;
  }

  tick(deltaMs: number, streetY: number, lidY: number) {
    if (!this.container.visible) return;
    this.elapsed += deltaMs;
    this.animation = Math.min(JUMP_DURATION_MS, this.animation + deltaMs);
    const t = this.animation;
    const hop = Math.max(0, Math.min(1, (t - CROUCH) / HOP));
    this.container.x = this.fromX + (this.toX - this.fromX) * hop;
    const feetY = this.onStreet ? streetY : this.fromStreet ? streetY + (lidY - streetY) * hop : lidY;
    this.container.y = feetY - this.footOffset - (t < CROUCH ? -5 * t / CROUCH : t < AIRBORNE_END ? Math.sin(hop * Math.PI) * 62 : Math.sin((t - AIRBORNE_END) / LAND * Math.PI) * 6);
    const breath = Math.sin(this.elapsed / 400) * 0.025;
    const crouch = t < CROUCH ? t / CROUCH * 0.16 : t >= AIRBORNE_END && t < JUMP_DURATION_MS ? Math.sin((t - AIRBORNE_END) / LAND * Math.PI) * 0.12 : 0;
    this.body.scale.set(0.78 * (1 + crouch - breath), 0.78 * (1 - crouch + breath));
    this.head.rotation = Math.sin(this.elapsed / 800) * 0.06 + (this.elapsed % 4000 < 200 ? 0.16 : 0);
    this.head.y = -60 + Math.sin(this.elapsed / 500) * 2;
    this.wing.rotation = t >= CROUCH && t < AIRBORNE_END ? Math.sin(t / 24) * 0.55 : Math.sin(this.elapsed / 700) * 0.06;
    this.leftLeg.rotation = t < AIRBORNE_END ? -Math.sin(hop * Math.PI) * 0.7 : 0;
    this.rightLeg.rotation = -this.leftLeg.rotation;
  }
}
