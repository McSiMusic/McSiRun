import { Texture, TextureSource } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";

/** Every texture is empty except the leg, whose real height drives the chicken's foot offset. */
export function fakeTextures(): SceneTextures {
  const leg = new Texture({ source: new TextureSource({ width: 37, height: 40 }) });
  return new Proxy({} as SceneTextures, { get: (_, name) => (name === "leg" ? leg : Texture.EMPTY) });
}
