import { describe, expect, it } from "vitest";
import { validatePanoramaFile } from "@/lib/panorama";

describe("validatePanoramaFile", () => {
  it("accepts a 2:1 RidTools JPG panorama", () => {
    const result = validatePanoramaFile({
      name: "360_Panorama_20240520_103022.jpg",
      mimeType: "image/jpeg",
      width: 2048,
      height: 1024,
      size: 1_200_000
    });

    expect(result.valid).toBe(true);
    expect(result.checks).toEqual([
      { label: "File type: JPG image", status: "valid" },
      { label: "Dimensions: 2048 x 1024", status: "valid" },
      { label: "Aspect ratio: 2:1", status: "valid" },
      { label: "Equirectangular: Valid panorama", status: "valid" }
    ]);
  });

  it("rejects non-image uploads", () => {
    const result = validatePanoramaFile({
      name: "scene.pdf",
      mimeType: "application/pdf",
      width: 2048,
      height: 1024,
      size: 900_000
    });

    expect(result.valid).toBe(false);
    expect(result.checks[0]).toEqual({ label: "File type: Unsupported", status: "invalid" });
  });

  it("rejects images that are not close to a 2:1 panorama", () => {
    const result = validatePanoramaFile({
      name: "normal-render.jpg",
      mimeType: "image/jpeg",
      width: 1200,
      height: 900,
      size: 800_000
    });

    expect(result.valid).toBe(false);
    expect(result.checks[2]).toEqual({ label: "Aspect ratio: 1.33:1", status: "invalid" });
  });
});
