"use client";

import { PanoramaSphere } from "@/components/PanoramaSphere";

const HERO_PANORAMA_SRC = "/panoramas/generated-hero-panorama.png";

export function HeroPanoramaPreview() {
  return (
    <div className="render-preview" aria-label="360 Render panorama preview">
      <div className="render-preview-body">
        <PanoramaSphere src={HERO_PANORAMA_SRC} mousewheel={false} autoRotate />
      </div>
    </div>
  );
}
