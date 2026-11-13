import { AwpSample } from "@/src/lib/audio/awpSample";
import { playAwpSynth, playCashoutChime, playTone, type ToneType } from "@/src/lib/audio/synth";

export type SoundType = ToneType | "awp_shot" | "cashout";

type AudioContextConstructor = new () => AudioContext;

function audioContextClass(): AudioContextConstructor | undefined {
  const scope = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/**
 * Lazily created Web Audio singleton. Every public method is failure-isolated:
 * audio problems are logged and never propagate into game or UI code.
 */
export class SoundEngine {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private unavailable = false;
  private muted = true;
  private readonly awp = new AwpSample();

  preload() {
    if (typeof window !== "undefined") void this.awp.preload();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.output) this.output.gain.value = muted ? 0 : 1;
  }

  playSound(type: SoundType) {
    if (this.muted || typeof window === "undefined") return;
    try {
      const audio = this.getAudio();
      if (!audio) return;
      const { context, output } = audio;
      if (context.state === "suspended") {
        void context.resume().catch((error: unknown) => console.error("Unable to resume audio.", error));
      }
      if (type === "awp_shot") void this.playAwp(context, output);
      else if (type === "cashout") playCashoutChime(context, output);
      else playTone(context, output, type);
    } catch (error) {
      console.error(`Unable to play sound "${type}".`, error);
    }
  }

  private getAudio() {
    if (!this.context && !this.unavailable) {
      const AudioContextClass = audioContextClass();
      try {
        if (!AudioContextClass) throw new Error("Web Audio is not supported.");
        const context = new AudioContextClass();
        const output = context.createGain();
        output.gain.value = this.muted ? 0 : 1;
        output.connect(context.destination);
        this.context = context;
        this.output = output;
      } catch (error) {
        this.unavailable = true;
        console.error("Audio is unavailable; continuing without sound.", error);
      }
    }
    return this.context && this.output ? { context: this.context, output: this.output } : null;
  }

  private async playAwp(context: AudioContext, output: GainNode) {
    try {
      const buffer = await this.awp.buffer(context);
      if (this.muted) return;
      if (buffer) AwpSample.play(context, output, buffer);
      else playAwpSynth(context, output);
    } catch (error) {
      console.error("Unable to play AWP sample; using synthesized fallback.", error);
      if (!this.muted) playAwpSynth(context, output);
    }
  }
}

export const soundEngine = new SoundEngine();
