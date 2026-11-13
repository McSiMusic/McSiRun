import { makeStore } from "@/src/store";
import { hydrateWallet } from "@/src/store/walletSlice";
import type { Difficulty } from "@/src/types/game";

export const always = (value: number) => () => value;
export const SAFE = always(0.999);
export const FATAL = always(0);

export function storeWith(wallet: Partial<{ balance: number; betAmount: number; difficulty: Difficulty }> = {}) {
  const store = makeStore();
  store.dispatch(hydrateWallet({ balance: 1000, betAmount: 10, difficulty: "medium", language: "en", ...wallet }));
  return store;
}

export function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, String(value)); },
    removeItem: (key: string) => { map.delete(key); },
  };
}
