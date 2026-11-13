import { TextureStyle } from "pixi.js";

export function configurePixi() {
  TextureStyle.defaultOptions.scaleMode = "nearest";
}
