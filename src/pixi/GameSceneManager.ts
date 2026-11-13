import { Container, type Application, type Ticker } from "pixi.js";
import { MAX_STEPS } from "@/src/lib/gameConstants";
import type { SceneTextures } from "@/src/pixi/textures/assets";
import { ItalyParallaxLayer } from "@/src/pixi/ItalyParallaxLayer";
import { CrateTrackLayer } from "@/src/pixi/CrateTrackLayer";
import { ChickenActor } from "@/src/pixi/ChickenActor";
import { AwpFxLayer } from "@/src/pixi/AwpFxLayer";
import { ImpactOverlay } from "@/src/pixi/ImpactOverlay";
import { SceneCamera } from "@/src/pixi/SceneCamera";
import { LossReveal, stageLayout, type SceneSnapshot } from "@/src/pixi/sceneLayout";

const LOSS_REVEAL_MS = 1000;
const HIT_OFFSET = 37;

export class GameSceneManager {
  private readonly background: ItalyParallaxLayer;
  private readonly scene = new Container();
  private readonly world = new Container();
  private readonly track: CrateTrackLayer;
  private readonly chicken: ChickenActor;
  private readonly effects: AwpFxLayer;
  private readonly overlay: ImpactOverlay;
  private readonly camera = new SceneCamera();
  private readonly lossReveal = new LossReveal(LOSS_REVEAL_MS);
  private readonly onTick = (ticker: Ticker) => this.tick(ticker.deltaMS);
  private width = 360;
  private elapsed = 0;
  private previous: SceneSnapshot | null = null;
  private worldScale = 1;

  constructor(private readonly app: Application, textures: SceneTextures,
    private readonly onEliminationComplete: (eventId: number) => void) {
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
    this.overlay = new ImpactOverlay(app.stage, textures);
    this.resize(this.width, 300, 0);
    app.ticker.add(this.onTick);
  }

  resize(width: number, height: number, reservedBottom: number) {
    this.width = width;
    const { scale, baseline } = stageLayout(height, reservedBottom, this.track.crateSize);
    this.background.advance(this.camera.x * (scale - this.worldScale));
    this.worldScale = scale;
    this.world.scale.set(scale);
    this.background.resize(width, height, baseline);
    this.track.resize(baseline / scale, scale);
    this.overlay.resize(width, height);
  }

  update(snapshot: SceneSnapshot) {
    const previous = this.previous;
    const spacing = this.track.spacing;
    const startsRound = snapshot.status === "idle" ||
      (snapshot.status === "active" && snapshot.currentStep === 0 && previous?.status !== "active");
    const restored = !previous
      ? snapshot.status !== "idle" && (snapshot.currentStep > 0 || snapshot.status === "lost")
      : snapshot.status === "active" && !snapshot.jumping && !previous.jumping &&
        snapshot.currentStep !== previous.currentStep;
    if (startsRound) this.resetRound(spacing);
    else if (restored) this.restore(snapshot);
    if (snapshot.jumping && !previous?.jumping) {
      const fromStreet = snapshot.currentStep === 0;
      const target = (snapshot.currentStep + 1) * spacing;
      this.chicken.jump((fromStreet ? 1 : snapshot.currentStep) * spacing, target, fromStreet);
      this.camera.pan(target);
    }
    if (!snapshot.jumping && previous?.jumping) {
      this.moveBackground(this.camera.finish());
      this.chicken.completeJump();
      if (snapshot.currentStep > previous.currentStep && snapshot.status !== "lost") {
        this.track.land(snapshot.currentStep, snapshot.difficulty);
      }
    }
    if (snapshot.status === "lost" && previous?.status !== "lost") this.fireShot(snapshot);
    if (snapshot.status === "won" && snapshot.currentStep === MAX_STEPS && previous?.status !== "won") {
      this.overlay.goldenFlash();
    }
    this.track.update(snapshot.difficulty);
    this.previous = snapshot;
  }

  destroy() {
    this.app.ticker.remove(this.onTick);
    this.effects.clear();
    this.overlay.destroy();
    this.scene.destroy({ children: true });
  }

  private resetRound(spacing: number) {
    this.chicken.reset(spacing);
    this.effects.clear();
    this.lossReveal.cancel();
    this.overlay.reset();
    this.track.reset();
    this.moveBackground(this.camera.snap(spacing));
  }

  private restore(snapshot: SceneSnapshot) {
    const lost = snapshot.status === "lost";
    const position = Math.min(MAX_STEPS, snapshot.currentStep + (lost ? 1 : 0)) * this.track.spacing;
    this.chicken.place(position);
    this.track.restore(snapshot.currentStep);
    this.moveBackground(this.camera.snap(position));
  }

  private fireShot(snapshot: SceneSnapshot) {
    const target = Math.min(MAX_STEPS, snapshot.currentStep + 1) * this.track.spacing;
    const worldX = this.worldOffset();
    const source = this.background.windowVantage(target * this.worldScale + worldX);
    this.effects.trigger((source.x - worldX) / this.worldScale, source.y / this.worldScale, target, this.hitY);
    this.lossReveal.start(snapshot.eventId);
  }

  private get hitY() {
    return this.track.lidY - this.chicken.footOffset - HIT_OFFSET;
  }

  private worldOffset() {
    return this.width * (this.width < 600 ? 0.5 : 0.32) - this.camera.x * this.worldScale;
  }

  private moveBackground(distance: number) {
    this.background.advance(distance * this.worldScale);
  }

  private tick(deltaMs: number) {
    this.elapsed += deltaMs;
    this.moveBackground(this.camera.tick(deltaMs));
    this.world.x = this.worldOffset();
    this.chicken.tick(deltaMs, this.track.streetY, this.track.lidY);
    this.track.tick(this.elapsed, deltaMs);
    if (this.effects.tick(deltaMs)) {
      this.chicken.eliminate();
      this.overlay.showCrack(this.world.x + this.chicken.container.x * this.worldScale, this.hitY * this.worldScale);
    }
    const revealed = this.lossReveal.tick(deltaMs);
    if (revealed !== null) this.onEliminationComplete(revealed);
    this.overlay.tick(deltaMs);
  }
}
