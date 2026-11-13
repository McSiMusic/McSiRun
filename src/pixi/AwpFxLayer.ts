import { Container, Sprite } from "pixi.js";
import type { SceneTextures } from "@/src/pixi/textures/assets";

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
  spin: number;
  phase: number;
}

export class AwpFxLayer {
  private readonly beam: Sprite;
  private readonly tracer: Sprite;
  private readonly impact: Sprite;
  private readonly particles: Particle[] = [];
  private impactTime = 360;
  private flightTime = 180;
  private sourceX = 0;
  private sourceY = 0;
  private targetX = 0;
  private targetY = 0;

  constructor(private readonly world: Container, private readonly textures: SceneTextures) {
    this.beam = new Sprite(textures.beam);
    this.beam.anchor.set(1, 0.5);
    this.beam.visible = false;
    this.tracer = new Sprite(textures.tracer);
    this.tracer.anchor.set(0.7, 0.5);
    this.tracer.visible = false;
    this.impact = new Sprite(textures["impact-ring"]);
    this.impact.anchor.set(0.5);
    this.impact.visible = false;
    world.addChild(this.beam, this.tracer, this.impact);
  }

  trigger(sourceX: number, sourceY: number, targetX: number, targetY: number) {
    this.clear();
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    this.sourceX = sourceX;
    this.sourceY = sourceY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.flightTime = 0;
    this.beam.position.set(sourceX, sourceY);
    this.tracer.position.set(sourceX, sourceY);
    this.tracer.scale.set(0.25);
    this.beam.width = Math.min(90, Math.hypot(dx, dy));
    this.beam.height = 9;
    this.beam.rotation = this.tracer.rotation = Math.atan2(dy, dx);
    this.beam.visible = this.tracer.visible = true;
  }

  private burst() {
    this.impact.position.set(this.targetX, this.targetY);
    this.impactTime = 0;
    for (let index = 0; index < 32; index += 1) {
      const angle = Math.PI * 2 * index / 32;
      const speed = 0.12 + (index % 5) * 0.035;
      const sprite = new Sprite(this.textures.feather);
      sprite.anchor.set(0.5);
      sprite.scale.set(0.25 + (index % 5) * 0.09);
      sprite.tint = index % 3 ? 0xffffff : 0xb9c2c2;
      sprite.position.set(this.targetX, this.targetY);
      sprite.rotation = angle;
      this.world.addChild(sprite);
      const duration = 650 + (index % 5) * 40;
      this.particles.push({ sprite, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.09, life: duration, spin: (index % 2 ? 1 : -1) * 0.004, phase: angle });
    }
  }

  tick(deltaMs: number) {
    const delta = Math.min(deltaMs, 40);
    let hit = false;
    if (this.flightTime < 180) {
      this.flightTime = Math.min(180, this.flightTime + delta);
      const progress = this.flightTime / 180;
      const x = this.sourceX + (this.targetX - this.sourceX) * progress;
      const y = this.sourceY + (this.targetY - this.sourceY) * progress;
      this.tracer.scale.set(0.25 + 1.1 * progress);
      this.beam.position.set(x, y);
      this.tracer.position.set(x, y);
      if (this.flightTime === 180) {
        this.beam.visible = this.tracer.visible = false;
        this.burst();
        hit = true;
      }
    }
    this.impactTime += delta;
    this.impact.visible = this.impactTime < 360;
    this.impact.scale.set(0.35 + this.impactTime / 360);
    this.impact.alpha = Math.max(0, 1 - this.impactTime / 360);
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life -= delta;
      particle.phase += delta * 0.008;
      particle.sprite.x += (particle.vx + Math.sin(particle.phase) * 0.025) * delta;
      particle.sprite.y += particle.vy * delta;
      particle.vx *= Math.pow(0.997, delta);
      particle.vy = particle.vy * Math.pow(0.999, delta) + 0.00028 * delta;
      particle.sprite.rotation += particle.spin * delta;
      particle.sprite.alpha = Math.max(0, Math.min(1, particle.life / 450));
      if (particle.life <= 0) {
        this.world.removeChild(particle.sprite);
        particle.sprite.destroy();
        this.particles.splice(index, 1);
      }
    }
    return hit;
  }

  clear() {
    this.beam.visible = false;
    this.tracer.visible = false;
    this.flightTime = 180;
    this.impact.visible = false;
    this.impactTime = 360;
    this.particles.forEach(({ sprite }) => {
      this.world.removeChild(sprite);
      sprite.destroy();
    });
    this.particles.length = 0;
  }
}
