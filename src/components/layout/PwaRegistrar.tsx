"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallState {
  available: boolean;
  installed: boolean;
  install: () => Promise<void>;
}

const InstallContext = createContext<InstallState>({
  available: false, installed: false, install: async () => {},
});

export function PwaRegistrar({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(() => typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches));

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch((error: unknown) =>
        console.error("Unable to register the McSiRun service worker.", error));
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    setPrompt(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.error("Unable to open the installation prompt.", error);
      throw error;
    }
  };

  return <InstallContext.Provider value={{ available: !!prompt, installed, install }}>{children}</InstallContext.Provider>;
}

export function usePwaInstall() {
  return useContext(InstallContext);
}
