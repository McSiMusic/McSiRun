import { Container, TilingSprite } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";

export class ItalyParallaxLayer {
  private readonly sky: TilingSprite;
  private readonly walls: TilingSprite;
  private readonly ground: TilingSprite;
  private width = 360;
  private height = 300;
  private wallHeight = 216;

  constructor(container: Container, textures: SceneTextures) {
    this.sky = new TilingSprite({ texture: textures["italy-sky"] });
    this.walls = new TilingSprite({ texture: textures["italy-walls"] });
    this.ground = new TilingSprite({ texture: textures["italy-ground"] });
    container.addChild(this.sky, this.walls, this.ground);
  }

  resize(width: number, height: number, crateY: number) {
    this.width = width;
    this.height = height;
    this.sky.width = width;
    this.sky.height = height;
    this.sky.tileScale.set(height / 240);
    this.walls.width = width;
    this.wallHeight = Math.max(1, crateY - height * 0.04);
    this.walls.height = this.wallHeight;
    this.walls.y = height * 0.04;
    this.walls.tileScale.set(this.wallHeight / 240);
    this.ground.width = width;
    this.ground.y = crateY;
    this.ground.height = Math.max(1, height - crateY);
    this.ground.tileScale.set(Math.max(0.5, (height - crateY) / 160));
  }

  windowVantage(targetX: number) {
    const scale = this.wallHeight / 240;
    const period = 512 * scale;
    const offset = this.walls.tilePosition.x;
    const windows = [77, 231, 385];
    const candidates: number[] = [];
    for (const windowX of windows) {
      const base = offset + windowX * scale;
      const tile = Math.floor((targetX - base) / period);
      for (let index = tile - 1; index <= tile + 2; index += 1) {
        const x = base + index * period;
        if (x >= 0 && x <= this.width) candidates.push(x);
      }
    }
    const x = candidates.reduce((best, candidate) =>
      Math.abs(candidate - targetX) < Math.abs(best - targetX) ? candidate : best,
    candidates[0] ?? targetX);
    return { x, y: this.height * 0.04 + 111 * scale };
  }

  advance(distance: number) {
    this.sky.tilePosition.x -= distance * 0.15;
    this.walls.tilePosition.x -= distance * 0.45;
    this.ground.tilePosition.x -= distance;
  }
}
