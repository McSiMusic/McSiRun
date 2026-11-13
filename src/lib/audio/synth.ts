export type ToneType = "ui_click" | "bet_adjust" | "chicken_jump" | "step_safe";

const TONES: Record<ToneType, { from: number; to: number; duration: number; wave: OscillatorType }> = {
  ui_click: { from: 820, to: 410, duration: 0.035, wave: "square" },
  bet_adjust: { from: 1100, to: 600, duration: 0.025, wave: "square" },
  chicken_jump: { from: 220, to: 540, duration: 0.12, wave: "triangle" },
  step_safe: { from: 523, to: 659, duration: 0.14, wave: "sine" },
};

function sweep(
  context: BaseAudioContext, output: AudioNode, start: number,
  from: number, to: number, duration: number, wave: OscillatorType, volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain).connect(output);
  oscillator.onended = () => gain.disconnect();
  oscillator.start(start);
  oscillator.stop(start + duration);
}

export function playTone(context: BaseAudioContext, output: AudioNode, type: ToneType) {
  const { from, to, duration, wave } = TONES[type];
  sweep(context, output, context.currentTime, from, to, duration, wave, 0.12);
}

/** Scheduled on the audio clock so the arpeggio cannot jitter with the main thread. */
export function playCashoutChime(context: BaseAudioContext, output: AudioNode) {
  const now = context.currentTime;
  [587, 784, 1046].forEach((frequency, index) => {
    sweep(context, output, now + index * 0.09, frequency, frequency * 1.02, 0.12, "sine", 0.16);
  });
}

/** Procedural fallback used only when the AWP sample cannot be loaded or decoded. */
export function playAwpSynth(context: BaseAudioContext, output: AudioNode) {
  const now = context.currentTime;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.48), context.sampleRate);
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
  envelope.connect(output);
  envelope.connect(echo).connect(echoFilter).connect(echoGain).connect(output);
  noise.start(now);
  noise.stop(now + 0.48);
  sweep(context, output, now, 165, 32, 0.26, "sine", 0.2475);
}
