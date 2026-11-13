import { Assets, type Texture } from "pixi.js";

const names = [
  "body", "head", "wing", "leg", "feather", "crate",
  "beam", "tracer", "screen-crack", "glow", "awp-dragon-lore", "milestone-pistol",
  "violet-glow", "cleared-rim", "impact-ring", "emerald-ring", "emerald-glow",
  "italy-sky", "italy-walls", "italy-ground",
] as const;

export type SpriteName = typeof names[number];
export type SceneTextures = Record<SpriteName, Texture>;

export async function loadSceneTextures(): Promise<SceneTextures> {
  const entries = await Promise.all(
    names.map(async (name) => {
      const extension = name === "screen-crack" ? "png" : "svg";
      const texture = await Assets.load<Texture>(`/sprites/${name}.${extension}`);
      return [name, texture] as const;
    }),
  );
  return Object.fromEntries(entries) as SceneTextures;
}
