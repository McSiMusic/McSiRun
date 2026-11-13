import { assetPath } from "@/src/lib/assetPath";

export type SoundType =
  | "ui_click"
  | "bet_adjust"
  | "chicken_jump"
  | "step_safe"
  | "awp_shot"
  | "cashout";

class SoundEngine {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private muted = true;
  private sample: Promise<ArrayBuffer | null> | null = null;

  preload() {
    if (this.sample || typeof window === "undefined") return;
    this.sample = fetch(assetPath("/sound/awp.ogg"))
      .then((response) => {
        if (!response.ok) throw new Error(`AWP sample returned ${response.status}`);
        return response.arrayBuffer();
      })
      .catch((error: unknown) => {
        console.error("Unable to load AWP sample; using synthesized fallback.", error);
        return null;
      });
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.output) this.output.gain.value = muted ? 0 : 1;
  }

  playSound(type: SoundType) {
    if (this.muted || typeof window === "undefined") return;
    const context = this.getContext();
    if (context.state === "suspended") {
      void context.resume().catch((error: unknown) => console.error("Unable to resume audio.", error));
    }
    if (type === "awp_shot") void this.playSample(context);
    else if (type === "cashout") this.playCashout(context);
    else this.playTone(context, type);
  }

  private getContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext;
      this.context = new AudioContextClass();
      this.output = this.context.createGain();
      this.output.gain.value = this.muted ? 0 : 1;
      this.output.connect(this.context.destination);
    }
    return this.context;
  }

  private playTone(context: AudioContext, type: Exclude<SoundType, "awp_shot" | "cashout">) {
    const settings = {
      ui_click: { from: 820, to: 410, duration: 0.035, wave: "square" as OscillatorType },
      bet_adjust: { from: 1100, to: 600, duration: 0.025, wave: "square" as OscillatorType },
      chicken_jump: { from: 220, to: 540, duration: 0.12, wave: "triangle" as OscillatorType },
      step_safe: { from: 523, to: 659, duration: 0.14, wave: "sine" as OscillatorType },
    }[type];
    this.sweep(context, settings.from, settings.to, settings.duration, settings.wave, 0.12);
  }

  private sweep(
    context: AudioContext,
    from: number,
    to: number,
    duration: number,
    wave: OscillatorType,
    volume: number,
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.output!);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private async playSample(context: AudioContext) {
    this.preload();
    const data = await this.sample;
    if (this.muted) return;
    if (!data) {
      this.playAwp(context);
      return;
    }
    try {
      const buffer = await context.decodeAudioData(data.slice(0));
      if (this.muted) return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      const duration = Math.min(2, buffer.duration);
      const now = context.currentTime;
      source.buffer = buffer;
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.setValueAtTime(0.09, now + Math.max(0, duration - 0.1));
      gain.gain.linearRampToValueAtTime(0, now + duration);
      source.connect(gain).connect(this.output!);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start(now, 0, duration);
    } catch (error) {
      console.error("Unable to play AWP sample; using synthesized fallback.", error);
      if (!this.muted) this.playAwp(context);
    }
  }

  private playAwp(context: AudioContext) {
    const now = context.currentTime;
    const buffer = context.createBuffer(1, context.sampleRate * 0.48, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const echo = context.createDelay(0.7);
    const echoFilter = context.createBiquadFilter();
    const echoGain = context.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1150;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.2025, now + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    echo.delayTime.value = 0.17;
    echoFilter.type = "highpass";
    echoFilter.frequency.value = 650;
    echoGain.gain.value = 0.18;
    noise.connect(filter).connect(envelope);
    envelope.connect(this.output!);
    envelope.connect(echo).connect(echoFilter).connect(echoGain).connect(this.output!);
    noise.start(now);
    noise.stop(now + 0.48);
    this.sweep(context, 165, 32, 0.26, "sine", 0.2475);
  }

  private playCashout(context: AudioContext) {
    [587, 784, 1046].forEach((frequency, index) => {
      window.setTimeout(
        () => { if (!this.muted) this.sweep(context, frequency, frequency * 1.02, 0.12, "sine", 0.16); },
        index * 90,
      );
    });
  }
}

export const soundEngine = new SoundEngine();

