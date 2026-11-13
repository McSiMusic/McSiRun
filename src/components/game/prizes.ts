import type { PrizeId } from "@/src/types/game";
import type { Translations } from "@/src/lib/i18n";

export const PRIZE_ART: Record<PrizeId, string> = {
  pistol: "/sprites/milestone-pistol.svg",
  dragonLore: "/sprites/awp-dragon-lore.svg",
};

export function prizeName(prize: PrizeId, t: Translations): string {
  return prize === "pistol" ? t.pistol : t.dragonLore;
}
