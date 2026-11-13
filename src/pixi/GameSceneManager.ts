import { Container, Sprite, type Application } from "pixi.js";
import { MAX_STEPS } from "@/src/lib/gameMath";
import type { Difficulty, RoundStatus } from "@/src/types/game";
import type { SceneTextures } from "@/src/pixi/textures/assets";
import { ItalyParallaxLayer } from "@/src/pixi/ItalyParallaxLayer";
import { CrateTrackLayer } from "@/src/pixi/CrateTrackLayer";
import { ChickenActor } from "@/src/pixi/ChickenActor";
import { AwpFxLayer } from "@/src/pixi/AwpFxLayer";

export interface SceneSnapshot {
  status: RoundStatus;
  currentStep: number;
  difficulty: Difficulty;
  eventId: number;
  jumping: boolean;
}

export class GameSceneManager {
  private readonly background: ItalyParallaxLayer;
  private readonly scene = new Container();
  private readonly world = new Container();
  private readonly track: CrateTrackLayer;
  private readonly chicken: ChickenActor;
  private readonly effects: AwpFxLayer;
  private readonly flash: Sprite;
  private readonly crack: Sprite;
  private width = 360;
  private height = 300;
  private camera = 0;
  private cameraStart = 0;
  private cameraTarget = 0;
  private cameraTime = 380;
  private elapsed = 0;
  private flashTime = 0;
  private crackTime = 0;
  private previous: SceneSnapshot | null = null;
  private worldScale = 1;
  private lossTime = 0;
  private lossEventId: number | null = null;

  constructor(app: Application, textures: SceneTextures, private readonly onEliminationComplete: (eventId: number) => void) {
    const backgroundContainer = new Container();
    this.scene.addChild(backgroundContainer, this.world);
    app.stage.addChild(this.scene);
    this.background = new ItalyParallaxLayer(backgroundContainer, textures);
    const trackContainer = new Container();
    this.world.addChild(trackContainer);
    this.track = new CrateTrackLayer(trackContainer, textures);
    this.chicken = new ChickenActor(textures);
    this.world.addChild(this.chicken.container);
    this.effects = new AwpFxLayer(this.world, textures);
    this.crack = new Sprite(textures["screen-crack"]);
    this.crack.anchor.set(0.5);
    this.crack.visible = false;
    app.stage.addChild(this.crack);
    this.flash = new Sprite(textures.glow);
    this.flash.anchor.set(0.5);
    this.flash.visible = false;
    app.stage.addChild(this.flash);
    this.resize(this.width, this.height, 0);
    app.ticker.add((ticker) => this.tick(ticker.deltaMS));
  }

  resize(width: number, height: number, reservedBottom: number) {
    this.width = width;
    this.height = height;
    const bottom = height - reservedBottom - 8;
    const topMargin = 48;
    const lidOffset = this.track.crateSize / 2;
    const streetOffset = lidOffset + 12;
    const heightAboveLid = lidOffset + 112;
    const scale = Math.min(1, Math.max(0.1, (bottom - topMargin) / (heightAboveLid + streetOffset)));
    this.background.advance(this.camera * (scale - this.worldScale));
    this.worldScale = scale;
    this.world.scale.set(scale);
    const baseline = Math.max(topMargin + heightAboveLid * scale, Math.min(height * 0.64, bottom - streetOffset * scale));
    this.background.resize(width, height, baseline);
    this.track.resize(baseline / scale, scale);
    this.crack.width = this.crack.height = Math.min(400, width * 0.9);
    this.flash.position.set(width / 2, height / 2);
    this.flash.width = width;
    this.flash.height = height;
  }

  update(snapshot: SceneSnapshot) {
    const previous = this.previous;
    const spacing = this.track.spacing;
    if (!previous && snapshot.status !== "idle" &&
        (snapshot.currentStep > 0 || snapshot.status === "lost")) {
      const step = Math.min(MAX_STEPS, snapshot.currentStep + (snapshot.status === "lost" ? 1 : 0));
      const position = step * spacing;
      this.chicken.place(position);
      this.world.setChildIndex(this.chicken.container, 1);
      this.background.advance(position * this.worldScale);
      this.camera = this.cameraStart = this.cameraTarget = position;
    }
    if (snapshot.status === "idle" || (snapshot.status === "active" &&
        snapshot.currentStep === 0 && previous?.status !== "active")) {
      this.chicken.reset(spacing);
      this.world.setChildIndex(this.chicken.container, 1);
      this.effects.clear();
      this.lossEventId = null;
      this.crackTime = 0;
      this.crack.visible = false;
      this.scene.position.set(0);
      this.track.reset();
      this.background.advance((spacing - this.camera) * this.worldScale);
      this.camera = spacing;
      this.cameraStart = spacing;
      this.cameraTarget = spacing;
      this.cameraTime = 380;
    }
    if (snapshot.jumping && !previous?.jumping) {
      const fromStreet = snapshot.currentStep === 0;
      const from = (fromStreet ? 1 : snapshot.currentStep) * spacing;
      const target = (snapshot.currentStep + 1) * spacing;
      this.chicken.jump(from, target, fromStreet);
      this.world.setChildIndex(this.chicken.container, 1);
      this.cameraStart = this.camera;
      this.cameraTarget = target;
      this.cameraTime = 0;
    }
    if (!snapshot.jumping && previous?.jumping) {
      this.background.advance((this.cameraTarget - this.camera) * this.worldScale);
      this.camera = this.cameraTarget;
      this.cameraTime = 380;
      this.chicken.completeJump();
    }
    if (previous && snapshot.currentStep > previous.currentStep &&
        (snapshot.status === "active" || snapshot.status === "won")) {
      this.track.land(snapshot.currentStep, snapshot.difficulty);
    }
    if (snapshot.status === "lost" && previous?.status !== "lost") {
      const target = Math.min(MAX_STEPS, snapshot.currentStep + 1) * spacing;
      const worldX = this.width * (this.width < 600 ? 0.5 : 0.32) - this.camera * this.worldScale;
      const source = this.background.windowVantage(target * this.worldScale + worldX);
      this.effects.trigger((source.x - worldX) / this.worldScale, source.y / this.worldScale,
        target, this.track.lidY - this.chicken.footOffset - 37);
      this.lossTime = 0;
      this.lossEventId = snapshot.eventId;
    }
    if (snapshot.status === "won" && snapshot.currentStep === MAX_STEPS && previous?.status !== "won") {
      this.flashTime = 700;
      this.flash.visible = true;
    }
    this.track.update(snapshot.difficulty);
    this.previous = snapshot;
  }

  private tick(deltaMs: number) {
    this.elapsed += deltaMs;
    this.cameraTime = Math.min(380, this.cameraTime + deltaMs);
    const t = Math.max(0, Math.min(1, (this.cameraTime - 60) / 240));
    const next = this.cameraStart + (this.cameraTarget - this.cameraStart) * t;
    this.background.advance((next - this.camera) * this.worldScale);
    this.camera = next;
    this.world.x = this.width * (this.width < 600 ? 0.5 : 0.32) - this.camera * this.worldScale;
    this.chicken.tick(deltaMs, this.track.streetY, this.track.lidY);
    this.track.tick(this.elapsed, deltaMs);
    if (this.effects.tick(deltaMs)) {
      this.chicken.eliminate();
      this.crack.position.set(this.world.x + this.chicken.container.x * this.worldScale,
        (this.track.lidY - this.chicken.footOffset - 37) * this.worldScale);
      this.crackTime = 1200;
      this.crack.visible = true;
    }
    if (this.lossEventId !== null) {
      this.lossTime += Math.min(deltaMs, 40);
      if (this.lossTime >= 1000) {
        const eventId = this.lossEventId;
        this.lossEventId = null;
        this.onEliminationComplete(eventId);
      }
    }
    if (this.crackTime > 0) {
      this.crackTime = Math.max(0, this.crackTime - deltaMs);
      this.crack.alpha = Math.min(1, this.crackTime / 500);
      if (this.crackTime === 0) {
        this.crack.visible = false;
        this.scene.position.set(0);
      }
    }
    if (this.flashTime > 0) {
      this.flashTime = Math.max(0, this.flashTime - deltaMs);
      this.flash.alpha = this.flashTime / 700;
      this.flash.visible = this.flashTime > 0;
    }
  }
}
