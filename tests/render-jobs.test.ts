import { describe, expect, it } from "vitest";
import { getJobProgress, getNextJobStatus } from "@/lib/render-jobs";

describe("render job state helpers", () => {
  it("maps render statuses to stable progress percentages", () => {
    expect(getJobProgress("uploaded")).toBe(10);
    expect(getJobProgress("rendering_openai")).toBe(66);
    expect(getJobProgress("upscaling_topaz")).toBe(86);
    expect(getJobProgress("ready")).toBe(100);
    expect(getJobProgress("failed")).toBe(100);
  });

  it("advances successful mock jobs through the MVP pipeline", () => {
    expect(getNextJobStatus("uploaded")).toBe("rendering_openai");
    expect(getNextJobStatus("rendering_openai")).toBe("upscaling_topaz");
    expect(getNextJobStatus("upscaling_topaz")).toBe("ready");
    expect(getNextJobStatus("ready")).toBe("ready");
  });

  it("keeps failed jobs failed until a retry is requested", () => {
    expect(getNextJobStatus("failed")).toBe("failed");
  });
});
