"use client";

import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { configurePixi } from "@/src/pixi/configurePixi";
import { loadSceneTextures } from "@/src/pixi/textures/assets";
import { GameSceneManager } from "@/src/pixi/GameSceneManager";
import type { SceneSnapshot } from "@/src/pixi/GameSceneManager";

interface Props {
  snapshot: SceneSnapshot;
  reservedBottom: number;
  label: string;
  onEliminationComplete: (eventId: number) => void;
}

export function PixiStageCanvas({ snapshot, reservedBottom, label, onEliminationComplete }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameSceneManager | null>(null);
  const snapshotRef = useRef(snapshot);
  const reservedRef = useRef(reservedBottom);
  const completeRef = useRef(onEliminationComplete);
  const [failed, setFailed] = useState(false);

  useEffect(() => { completeRef.current = onEliminationComplete; }, [onEliminationComplete]);
  useEffect(() => {
    if (!failed || snapshot.status !== "lost") return;
    const timer = window.setTimeout(() => completeRef.current(snapshot.eventId), 1000);
    return () => window.clearTimeout(timer);
  }, [failed, snapshot.status, snapshot.eventId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    configurePixi();
    let disposed = false;
    let initialized = false;
    let destroyed = false;
    let cleanupObserver = () => {};
    const app = new Application();
    const destroyApp = () => {
      if (destroyed) return;
      destroyed = true;
      app.destroy(true);
    };
    void app.init({
      background: "#3B426E",
      antialias: true,
      roundPixels: true,
      resolution: Math.max(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      width: host.clientWidth,
      height: host.clientHeight,
    }).then(async () => {
      initialized = true;
      if (disposed) {
        destroyApp();
        return;
      }
      const textures = await loadSceneTextures();
      if (disposed) return;
      host.appendChild(app.canvas);
      const scene = new GameSceneManager(app, textures, (eventId) => completeRef.current(eventId));
      sceneRef.current = scene;
      scene.resize(host.clientWidth, host.clientHeight, reservedRef.current);
      scene.update(snapshotRef.current);
      const observer = new ResizeObserver(() => {
        const width = host.clientWidth;
        const height = host.clientHeight;
        app.renderer.resize(width, height);
        scene.resize(width, height, reservedRef.current);
        scene.update(snapshotRef.current);
      });
      observer.observe(host);
      cleanupObserver = () => observer.disconnect();
    }).catch((error: unknown) => {
      if (!disposed) {
        console.error("Unable to initialize the PixiJS game stage.", error);
        setFailed(true);
      }
    });
    return () => {
      disposed = true;
      cleanupObserver();
      sceneRef.current = null;
      if (initialized) destroyApp();
    };
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    sceneRef.current?.update(snapshot);
  }, [snapshot]);

  useEffect(() => {
    reservedRef.current = reservedBottom;
    const host = hostRef.current;
    if (host) sceneRef.current?.resize(host.clientWidth, host.clientHeight, reservedBottom);
  }, [reservedBottom]);

  return (
    <div
      ref={hostRef}
      className="game-stage"
      aria-label={label}
    />
  );
}
