import { assetPath } from "@/src/lib/assetPath";

export const AWP_GAIN = 0.09;
export const AWP_MAX_SECONDS = 2;
export const AWP_FADE_SECONDS = 0.1;

/** Fetches `awp.ogg` once and decodes it once per AudioContext; resolves null when the sample is unusable. */
export class AwpSample {
  private bytes: Promise<ArrayBuffer | null> | null = null;
  private decoded: { context: BaseAudioContext; buffer: Promise<AudioBuffer | null> } | null = null;

  preload() {
    this.bytes ??= fetch(assetPath("/sound/awp.ogg"))
      .then((response) => {
        if (!response.ok) throw new Error(`AWP sample returned ${response.status}`);
        return response.arrayBuffer();
      })
      .catch((error: unknown) => {
        console.error("Unable to load AWP sample; using synthesized fallback.", error);
        return null;
      });
    return this.bytes;
  }

  buffer(context: BaseAudioContext): Promise<AudioBuffer | null> {
    if (this.decoded?.context !== context) {
      const buffer = this.preload().then(async (data) => {
        if (!data) return null;
        try {
          return await context.decodeAudioData(data.slice(0));
        } catch (error) {
          console.error("Unable to decode AWP sample; using synthesized fallback.", error);
          return null;
        }
      });
      this.decoded = { context, buffer };
    }
    return this.decoded.buffer;
  }

  /** Plays only the first two seconds at gain 0.09, fading out over the final 100ms. */
  static play(context: BaseAudioContext, output: AudioNode, buffer: AudioBuffer) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    const duration = Math.min(AWP_MAX_SECONDS, buffer.duration);
    const now = context.currentTime;
    source.buffer = buffer;
    gain.gain.setValueAtTime(AWP_GAIN, now);
    gain.gain.setValueAtTime(AWP_GAIN, now + Math.max(0, duration - AWP_FADE_SECONDS));
    gain.gain.linearRampToValueAtTime(0, now + duration);
    source.connect(gain).connect(output);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(now, 0, duration);
  }
}
