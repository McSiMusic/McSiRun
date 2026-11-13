import type { Difficulty, RoundStatus } from "@/src/types/game";

export interface SceneSnapshot {
  status: RoundStatus;
  currentStep: number;
  difficulty: Difficulty;
  eventId: number;
  jumping: boolean;
}

const TOP_MARGIN = 48;
const DOCK_GAP = 8;
const PRIZE_HEADROOM = 112;
const STREET_DEPTH = 12;

/** Fits the track between the header and the floating dock: world scale plus crate baseline in screen px. */
export function stageLayout(height: number, reservedBottom: number, crateSize: number) {
  const bottom = height - reservedBottom - DOCK_GAP;
  const lidOffset = crateSize / 2;
  const streetOffset = lidOffset + STREET_DEPTH;
  const heightAboveLid = lidOffset + PRIZE_HEADROOM;
  const scale = Math.min(1, Math.max(0.1, (bottom - TOP_MARGIN) / (heightAboveLid + streetOffset)));
  const baseline = Math.max(TOP_MARGIN + heightAboveLid * scale, Math.min(height * 0.64, bottom - streetOffset * scale));
  return { scale, baseline };
}

/** Counts down the elimination sequence and reports its event id exactly once. */
export class LossReveal {
  private eventId: number | null = null;
  private elapsed = 0;

  constructor(private readonly durationMs: number) {}

  start(eventId: number) {
    this.eventId = eventId;
    this.elapsed = 0;
  }

  cancel() {
    this.eventId = null;
  }

  tick(deltaMs: number): number | null {
    if (this.eventId === null) return null;
    this.elapsed += Math.min(deltaMs, 40);
    if (this.elapsed < this.durationMs) return null;
    const eventId = this.eventId;
    this.eventId = null;
    return eventId;
  }
}
