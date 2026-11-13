import { Container, Sprite } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";

export class MilestoneLayer {
  private readonly pistol: Container;
  private readonly rifle: Container;

  constructor(world: Container, textures: SceneTextures, spacing: number) {
    this.pistol = this.createPrize(textures["violet-glow"], textures["milestone-pistol"], 115, 65);
    this.rifle = this.createPrize(textures.glow, textures["awp-dragon-lore"], 150, 48);
    this.pistol.x = 10 * spacing;
    this.rifle.x = 20 * spacing;
    world.addChild(this.pistol, this.rifle);
  }

  tick(crateY: number, time: number) {
    const y = Math.max(38, crateY - 150) + Math.sin(time / 500) * 4;
    this.pistol.y = y;
    this.rifle.y = y;
  }

  private createPrize(
    aura: SceneTextures["glow"], texture: SceneTextures["glow"],
    width: number, height: number,
  ) {
    const container = new Container();
    const glow = new Sprite(aura);
    glow.anchor.set(0.5);
    glow.width = 180;
    glow.height = 100;
    const skin = new Sprite(texture);
    skin.anchor.set(0.5);
    skin.width = width;
    skin.height = height;
    container.addChild(glow, skin);
    return container;
  }
}
