"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Viewer as PhotoSphereViewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";

type PanoramaSphereProps = {
  src: string;
  onReady?: (viewer: PanoramaController | null) => void;
  mousewheel?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateIdleDelay?: number;
};

export type PanoramaController = Pick<PhotoSphereViewer, "toggleFullscreen" | "zoom" | "zoomIn" | "zoomOut">;

export function PanoramaSphere({
  src,
  onReady,
  mousewheel = true,
  autoRotate = false,
  autoRotateSpeed = 0.018,
  autoRotateIdleDelay = 1200
}: PanoramaSphereProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const webglSupported = useSyncExternalStore(subscribeWebGLSupport, getWebGLSnapshot, getServerWebGLSnapshot);

  useEffect(() => {
    let disposed = false;
    let viewer: PhotoSphereViewer | null = null;
    let animationFrame = 0;
    let isPointerDown = false;
    let lastTimestamp = 0;
    let pausedUntil = 0;
    let removeAutoRotateListeners: (() => void) | undefined;

    if (webglSupported === null) {
      return;
    }

    if (webglSupported === false) {
      onReady?.(null);
      return;
    }

    async function loadViewer() {
      const { Viewer } = await import("@photo-sphere-viewer/core");

      if (!containerRef.current || disposed) {
        return;
      }

      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        navbar: false,
        defaultZoomLvl: 8,
        mousewheel,
        touchmoveTwoFingers: false
      });
      removeAutoRotateListeners = autoRotate
        ? startAutoRotate({
            container: containerRef.current,
            getViewer: () => viewer,
            getDisposed: () => disposed,
            getIsPointerDown: () => isPointerDown,
            setIsPointerDown: (value) => {
              isPointerDown = value;
            },
            getLastTimestamp: () => lastTimestamp,
            setLastTimestamp: (value) => {
              lastTimestamp = value;
            },
            getPausedUntil: () => pausedUntil,
            setPausedUntil: (value) => {
              pausedUntil = value;
            },
            getAnimationFrame: () => animationFrame,
            setAnimationFrame: (value) => {
              animationFrame = value;
            },
            speed: autoRotateSpeed,
            idleDelay: autoRotateIdleDelay
          })
        : undefined;
      onReady?.(viewer);
    }

    loadViewer();

    return () => {
      disposed = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      removeAutoRotateListeners?.();
      onReady?.(null);
      viewer?.destroy();
    };
  }, [autoRotate, autoRotateIdleDelay, autoRotateSpeed, mousewheel, onReady, src, webglSupported]);

  if (!webglSupported) {
    return (
      <div className="sphere-viewer">
        <img className="sphere-fallback" src={src} alt="" />
      </div>
    );
  }

  return <div ref={containerRef} className="sphere-viewer" />;
}

function supportsWebGL() {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
}

function subscribeWebGLSupport() {
  return () => undefined;
}

function getWebGLSnapshot() {
  return supportsWebGL();
}

function getServerWebGLSnapshot() {
  return null;
}

type AutoRotateOptions = {
  container: HTMLDivElement;
  getViewer: () => PhotoSphereViewer | null;
  getDisposed: () => boolean;
  getIsPointerDown: () => boolean;
  setIsPointerDown: (value: boolean) => void;
  getLastTimestamp: () => number;
  setLastTimestamp: (value: number) => void;
  getPausedUntil: () => number;
  setPausedUntil: (value: number) => void;
  getAnimationFrame: () => number;
  setAnimationFrame: (value: number) => void;
  speed: number;
  idleDelay: number;
};

function startAutoRotate({
  container,
  getViewer,
  getDisposed,
  getIsPointerDown,
  setIsPointerDown,
  getLastTimestamp,
  setLastTimestamp,
  getPausedUntil,
  setPausedUntil,
  getAnimationFrame,
  setAnimationFrame,
  speed,
  idleDelay
}: AutoRotateOptions) {
  const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (shouldReduceMotion.matches) {
    return undefined;
  }

  function pauseBriefly(delay = idleDelay) {
    setPausedUntil(performance.now() + delay);
    setLastTimestamp(0);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.isPrimary === false) {
      return;
    }

    setIsPointerDown(true);
    pauseBriefly(idleDelay);
  }

  function onPointerUp() {
    if (!getIsPointerDown()) {
      return;
    }

    setIsPointerDown(false);
    pauseBriefly(idleDelay);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      setLastTimestamp(0);
      return;
    }

    pauseBriefly(idleDelay);
  }

  function tick(timestamp: number) {
    if (getDisposed()) {
      return;
    }

    const viewer = getViewer();

    if (viewer && !getIsPointerDown() && timestamp >= getPausedUntil()) {
      const lastTimestamp = getLastTimestamp() || timestamp;
      const elapsedSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.08);
      const position = viewer.getPosition();

      viewer.rotate({
        pitch: position.pitch,
        yaw: position.yaw + speed * elapsedSeconds
      });
      setLastTimestamp(timestamp);
    } else {
      setLastTimestamp(timestamp);
    }

    setAnimationFrame(window.requestAnimationFrame(tick));
  }

  container.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  pauseBriefly(idleDelay);
  setAnimationFrame(window.requestAnimationFrame(tick));

  return () => {
    const animationFrame = getAnimationFrame();

    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }

    container.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
