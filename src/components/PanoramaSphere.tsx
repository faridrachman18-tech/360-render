"use client";

import { useEffect, useRef, useState } from "react";
import type { Viewer as PhotoSphereViewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";

type PanoramaSphereProps = {
  src: string;
  onReady?: (viewer: PanoramaController | null) => void;
};

export type PanoramaController = Pick<PhotoSphereViewer, "toggleFullscreen" | "zoom" | "zoomIn" | "zoomOut">;

export function PanoramaSphere({ src, onReady }: PanoramaSphereProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported] = useState(() => (typeof window === "undefined" ? true : supportsWebGL()));

  useEffect(() => {
    let disposed = false;
    let viewer: PhotoSphereViewer | null = null;

    if (!webglSupported) {
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
        mousewheel: true,
        touchmoveTwoFingers: false
      });
      onReady?.(viewer);
    }

    loadViewer();

    return () => {
      disposed = true;
      onReady?.(null);
      viewer?.destroy();
    };
  }, [onReady, src, webglSupported]);

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
