import { JUMP_DURATION_MS, JUMP_TIMING } from "@/src/lib/gameConstants";

/** Horizontal camera that pans in lockstep with the chicken's hop. Methods return the distance moved. */
export class SceneCamera {
  x = 0;
  private start = 0;
  private target = 0;
  private time = JUMP_DURATION_MS;

  snap(x: number) {
    const distance = x - this.x;
    this.x = this.start = this.target = x;
    this.time = JUMP_DURATION_MS;
    return distance;
  }

  pan(target: number) {
    this.start = this.x;
    this.target = target;
    this.time = 0;
  }

  finish() {
    return this.snap(this.target);
  }

  tick(deltaMs: number) {
    this.time = Math.min(JUMP_DURATION_MS, this.time + deltaMs);
    const progress = Math.max(0, Math.min(1, (this.time - JUMP_TIMING.crouch) / JUMP_TIMING.hop));
    const next = this.start + (this.target - this.start) * progress;
    const distance = next - this.x;
    this.x = next;
    return distance;
  }
}
