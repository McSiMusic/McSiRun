import { Sprite, type Container } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";

const CRACK_MS = 1200;
const CRACK_FADE_MS = 500;
const FLASH_MS = 700;

/** Screen-space overlays: the fading glass crack on impact and the golden grand-prize flash. */
export class ImpactOverlay {
  private readonly crack: Sprite;
  private readonly flash: Sprite;
  private crackTime = 0;
  private flashTime = 0;

  constructor(stage: Container, textures: SceneTextures) {
    this.crack = new Sprite(textures["screen-crack"]);
    this.crack.anchor.set(0.5);
    this.crack.visible = false;
    this.flash = new Sprite(textures.glow);
    this.flash.anchor.set(0.5);
    this.flash.visible = false;
    stage.addChild(this.crack, this.flash);
  }

  resize(width: number, height: number) {
    this.crack.width = this.crack.height = Math.min(400, width * 0.9);
    this.flash.position.set(width / 2, height / 2);
    this.flash.width = width;
    this.flash.height = height;
  }

  showCrack(x: number, y: number) {
    this.crack.position.set(x, y);
    this.crack.alpha = 1;
    this.crack.visible = true;
    this.crackTime = CRACK_MS;
  }

  goldenFlash() {
    this.flashTime = FLASH_MS;
    this.flash.alpha = 1;
    this.flash.visible = true;
  }

  reset() {
    this.crackTime = 0;
    this.crack.visible = false;
  }

  tick(deltaMs: number) {
    if (this.crackTime > 0) {
      this.crackTime = Math.max(0, this.crackTime - deltaMs);
      this.crack.alpha = Math.min(1, this.crackTime / CRACK_FADE_MS);
      this.crack.visible = this.crackTime > 0;
    }
    if (this.flashTime > 0) {
      this.flashTime = Math.max(0, this.flashTime - deltaMs);
      this.flash.alpha = this.flashTime / FLASH_MS;
      this.flash.visible = this.flashTime > 0;
    }
  }

  destroy() {
    this.crack.destroy();
    this.flash.destroy();
  }
}
