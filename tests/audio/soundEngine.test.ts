import { describe, expect, it, vi } from "vitest";
import { SoundEngine } from "@/src/lib/audio/soundEngine";

type Event = [string, ...unknown[]];

/** Minimal Web Audio stand-in that records the calls the engine makes. */
function mockAudio(decodeDuration = 10) {
  const events: Event[] = [];
  const contexts: MockContext[] = [];
  const param = (name: string) => ({
    value: 1,
    setValueAtTime: (...args: number[]) => events.push([`${name}.set`, ...args]),
    linearRampToValueAtTime: (...args: number[]) => events.push([`${name}.fade`, ...args]),
    exponentialRampToValueAtTime: () => {},
  });
  const node = (kind: string) => ({
    kind, gain: param("gain"), frequency: param("frequency"), delayTime: param("delay"), type: "",
    connect(target: unknown) { return target ?? this; },
    disconnect() {},
    start: (...args: number[]) => events.push([`${kind}.start`, ...args]),
    stop() {},
  });
  class MockContext {
    currentTime = 5;
    sampleRate = 8000;
    state = "running";
    destination = node("destination");
    decodeAudioData = vi.fn(async () => ({ duration: decodeDuration }));
    constructor() { contexts.push(this); }
    createGain() { return node("gain"); }
    createOscillator() { return node("oscillator"); }
    createBufferSource() { return node("source"); }
    createBiquadFilter() { return node("filter"); }
    createDelay() { return node("delay"); }
    createBuffer() { events.push(["synth"]); return { getChannelData: () => new Float32Array(4) }; }
  }
  return { events, contexts, MockContext };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SoundEngine", () => {
  it("defaults to muted and creates no AudioContext until unmuted", () => {
    const { contexts, MockContext } = mockAudio();
    vi.stubGlobal("window", { AudioContext: MockContext });
    new SoundEngine().playSound("ui_click");
    expect(contexts).toHaveLength(0);
  });

  it("plays the first two seconds of awp.ogg at 0.09 with a 100ms fade, decoding it only once", async () => {
    const { events, contexts, MockContext } = mockAudio();
    vi.stubGlobal("window", { AudioContext: MockContext });
    const fetch = vi.fn(async () => new Response(new Uint8Array(4)));
    vi.stubGlobal("fetch", fetch);
    const engine = new SoundEngine();
    engine.setMuted(false);
    engine.playSound("awp_shot");
    await flush();
    expect(events).toEqual([["gain.set", 0.09, 5], ["gain.set", 0.09, 6.9], ["gain.fade", 0, 7], ["source.start", 5, 0, 2]]);
    engine.playSound("awp_shot");
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(contexts[0].decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it("silences sounds already playing when muted", () => {
    const { MockContext } = mockAudio();
    vi.stubGlobal("window", { AudioContext: MockContext });
    const engine = new SoundEngine();
    engine.setMuted(false);
    engine.playSound("ui_click");
    const output = (engine as unknown as { output: { gain: { value: number } } }).output;
    expect(output.gain.value).toBe(1);
    engine.setMuted(true);
    expect(output.gain.value).toBe(0);
  });

  it("falls back to the synthesized shot only when the sample cannot load", async () => {
    const { events, MockContext } = mockAudio();
    vi.stubGlobal("window", { AudioContext: MockContext });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const engine = new SoundEngine();
    engine.setMuted(false);
    engine.playSound("awp_shot");
    await flush();
    expect(events.some(([name]) => name === "synth")).toBe(true);
    expect(events.some(([name, value]) => name === "gain.set" && value === 0.09)).toBe(false);
  });

  it("never throws into game code when Web Audio is broken or missing", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const Broken = vi.fn(function Broken() { throw new Error("too many contexts"); });
    vi.stubGlobal("window", { AudioContext: Broken });
    const engine = new SoundEngine();
    engine.setMuted(false);
    expect(() => engine.playSound("ui_click")).not.toThrow();
    expect(() => engine.playSound("cashout")).not.toThrow();
    expect(Broken).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();

    vi.stubGlobal("window", {});
    const unsupported = new SoundEngine();
    unsupported.setMuted(false);
    expect(() => unsupported.playSound("awp_shot")).not.toThrow();
  });

  it("supports the prefixed webkitAudioContext", () => {
    const { contexts, MockContext } = mockAudio();
    vi.stubGlobal("window", { webkitAudioContext: MockContext });
    const engine = new SoundEngine();
    engine.setMuted(false);
    engine.playSound("chicken_jump");
    expect(contexts).toHaveLength(1);
  });
});
