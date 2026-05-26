"use client";

import { useCallback, useRef, useState } from "react";
import { Maximize, Minus, Plus, RotateCcw, Settings } from "lucide-react";
import { PanoramaSphere, type PanoramaController } from "@/components/PanoramaSphere";

const HERO_PANORAMA_SRC = "/panoramas/generated-hero-panorama.png";

export function HeroPanoramaPreview() {
  const panoramaRef = useRef<PanoramaController | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  const handleViewerReady = useCallback((viewer: PanoramaController | null) => {
    panoramaRef.current = viewer;
    setIsViewerReady(Boolean(viewer));
  }, []);

  return (
    <div className="render-preview" aria-label="360 Render panorama preview">
      <div className="render-preview-body">
        <PanoramaSphere src={HERO_PANORAMA_SRC} onReady={handleViewerReady} />
        <div className="render-preview-title">
          <strong>Penthouse Living Room</strong>
          <span>Viewer</span>
        </div>
        <div className="render-preview-controls" aria-label="Preview viewer controls">
          <button disabled={!isViewerReady} onClick={() => panoramaRef.current?.zoom(8)} type="button" aria-label="Reset preview view">
            <RotateCcw size={17} />
          </button>
          <span className="render-control-group">
            <button disabled={!isViewerReady} onClick={() => panoramaRef.current?.zoomOut(12)} type="button" aria-label="Zoom preview out">
              <Minus size={17} />
            </button>
            <i />
            <button disabled={!isViewerReady} onClick={() => panoramaRef.current?.zoomIn(12)} type="button" aria-label="Zoom preview in">
              <Plus size={17} />
            </button>
          </span>
          <button disabled={!isViewerReady} onClick={() => panoramaRef.current?.toggleFullscreen()} type="button" aria-label="Open preview fullscreen">
            <Maximize size={17} />
          </button>
          <button disabled={!isViewerReady} onClick={() => panoramaRef.current?.zoom(35)} type="button" aria-label="Set preview detail view">
            <Settings size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
