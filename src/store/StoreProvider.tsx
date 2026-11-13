"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/src/store";
import { useAppDispatch } from "@/src/store/hooks";
import { readMutedPreference, readSessionState, SOUND_STORAGE_KEY } from "@/src/store/sessionStorage";
import { hydrateWallet, setMuted } from "@/src/store/walletSlice";
import { hydrateGame } from "@/src/store/gameSlice";

function SessionHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const saved = readSessionState();
    if (saved) {
      dispatch(hydrateWallet(saved.wallet));
      dispatch(hydrateGame(saved.game));
    }
    dispatch(setMuted(readMutedPreference()));
    const syncMute = (event: StorageEvent) => {
      if (event.key === SOUND_STORAGE_KEY) dispatch(setMuted(readMutedPreference()));
    };
    window.addEventListener("storage", syncMute);
    return () => window.removeEventListener("storage", syncMute);
  }, [dispatch]);

  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <Provider store={store} serverState={store.getState()}>
      <SessionHydrator />
      {children}
    </Provider>
  );
}
