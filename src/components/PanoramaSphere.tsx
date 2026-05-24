"use client";

import { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";

type PanoramaSphereProps = {
  src: string;
};

export function PanoramaSphere({ src }: PanoramaSphereProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let viewer: { destroy: () => void } | null = null;

    async function loadViewer() {
      const { Viewer } = await import("@photo-sphere-viewer/core");

      if (!containerRef.current || disposed) {
        return;
      }

      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        navbar: ["zoom", "move", "fullscreen"],
        defaultZoomLvl: 8,
        mousewheel: true,
        touchmoveTwoFingers: false
      });
    }

    loadViewer();

    return () => {
      disposed = true;
      viewer?.destroy();
    };
  }, [src]);

  return <div ref={containerRef} className="sphere-viewer" />;
}
