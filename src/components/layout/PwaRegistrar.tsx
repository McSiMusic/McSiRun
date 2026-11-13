"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { assetPath } from "@/src/lib/assetPath";

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

function subscribeDisplayMode(onChange: () => void) {
  const standalone = window.matchMedia("(display-mode: standalone)");
  const fullscreen = window.matchMedia("(display-mode: fullscreen)");
  standalone.addEventListener("change", onChange);
  fullscreen.addEventListener("change", onChange);
  return () => {
    standalone.removeEventListener("change", onChange);
    fullscreen.removeEventListener("change", onChange);
  };
}

function isStandalone() {
  const navigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
}

export function PwaRegistrar({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false);

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register(assetPath("/sw.js")).catch((error: unknown) =>
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

  return <InstallContext.Provider value={{ available: !!prompt, installed: installed || standalone, install }}>{children}</InstallContext.Provider>;
}

export function usePwaInstall() {
  return useContext(InstallContext);
}
