export type RenderJobStatus =
  | "uploaded"
  | "rendering_openai"
  | "upscaling_topaz"
  | "ready"
  | "failed";

export const JOB_STEPS: Array<{
  status: Exclude<RenderJobStatus, "failed">;
  title: string;
  shortTitle: string;
}> = [
  { status: "uploaded", title: "Uploaded", shortTitle: "Uploaded" },
  { status: "rendering_openai", title: "OpenAI Rendering", shortTitle: "OpenAI" },
  { status: "upscaling_topaz", title: "Topaz Upscaling", shortTitle: "Topaz" },
  { status: "ready", title: "Ready", shortTitle: "Ready" }
];

const PROGRESS_BY_STATUS: Record<RenderJobStatus, number> = {
  uploaded: 10,
  rendering_openai: 66,
  upscaling_topaz: 86,
  ready: 100,
  failed: 100
};

const NEXT_STATUS: Record<RenderJobStatus, RenderJobStatus> = {
  uploaded: "rendering_openai",
  rendering_openai: "upscaling_topaz",
  upscaling_topaz: "ready",
  ready: "ready",
  failed: "failed"
};

export function getJobProgress(status: RenderJobStatus): number {
  return PROGRESS_BY_STATUS[status];
}

export function getNextJobStatus(status: RenderJobStatus): RenderJobStatus {
  return NEXT_STATUS[status];
}

export function getActiveStepIndex(status: RenderJobStatus): number {
  if (status === "failed") {
    return 0;
  }

  return JOB_STEPS.findIndex((step) => step.status === status);
}

export function getStatusLabel(status: RenderJobStatus): string {
  switch (status) {
    case "rendering_openai":
      return "OpenAI Rendering";
    case "upscaling_topaz":
      return "Topaz Upscaling";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    case "uploaded":
    default:
      return "Uploaded";
  }
}
