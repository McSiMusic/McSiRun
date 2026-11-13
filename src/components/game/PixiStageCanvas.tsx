"use client";

import { useEffect, useRef, useState } from "react";
import { Application } from "pixi.js";
import { configurePixi } from "@/src/pixi/configurePixi";
import { loadSceneTextures } from "@/src/pixi/textures/assets";
import { GameSceneManager } from "@/src/pixi/GameSceneManager";
import type { SceneSnapshot } from "@/src/pixi/sceneLayout";

interface Props {
  snapshot: SceneSnapshot;
  reservedBottom: number;
  label: string;
  onEliminationComplete: (eventId: number) => void;
}

/** Fixed at 2: meets the art contract without 9x fill cost on DPR-3 phones. */
const RENDER_RESOLUTION = 2;

export function PixiStageCanvas({ snapshot, reservedBottom, label, onEliminationComplete }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameSceneManager | null>(null);
  const resizeRef = useRef<() => void>(() => {});
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
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const app = new Application();
    const destroyApp = () => {
      if (destroyed) return;
      destroyed = true;
      sceneRef.current?.destroy();
      sceneRef.current = null;
      // Children (incl. Text canvases) are destroyed; shared Assets textures are kept for remounts.
      app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    };
    const applySize = () => {
      frame = 0;
      const scene = sceneRef.current;
      if (!scene) return;
      app.renderer.resize(host.clientWidth, host.clientHeight);
      scene.resize(host.clientWidth, host.clientHeight, reservedRef.current);
    };
    resizeRef.current = () => {
      if (!frame) frame = window.requestAnimationFrame(applySize);
    };
    void app.init({
      background: "#3B426E",
      antialias: false,
      roundPixels: true,
      resolution: RENDER_RESOLUTION,
      autoDensity: true,
      width: host.clientWidth,
      height: host.clientHeight,
    }).then(async () => {
      initialized = true;
      if (disposed) return destroyApp();
      const textures = await loadSceneTextures();
      if (disposed) return;
      host.appendChild(app.canvas);
      const scene = new GameSceneManager(app, textures, (eventId) => completeRef.current(eventId));
      sceneRef.current = scene;
      scene.resize(host.clientWidth, host.clientHeight, reservedRef.current);
      scene.update(snapshotRef.current);
      observer = new ResizeObserver(() => resizeRef.current());
      observer.observe(host);
    }).catch((error: unknown) => {
      if (!disposed) {
        console.error("Unable to initialize the PixiJS game stage.", error);
        setFailed(true);
      }
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      resizeRef.current = () => {};
      if (initialized) destroyApp();
    };
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    sceneRef.current?.update(snapshot);
  }, [snapshot]);

  useEffect(() => {
    reservedRef.current = reservedBottom;
    resizeRef.current();
  }, [reservedBottom]);

  return <div ref={hostRef} className="game-stage" aria-label={label} />;
}
