import type { PresetId } from "@/lib/presets";
import type { RenderJobStatus } from "@/lib/render-jobs";

export type WorkspaceScene = {
  id: string;
  image: string;
  jobId?: string;
  name: string;
  notes: string;
  presetId: PresetId;
  projectId: string;
  status: RenderJobStatus;
  topazProcessId?: string;
  updatedAt: string;
};

export type WorkspaceProject = {
  failed: number;
  id: string;
  image: string;
  name: string;
  ready: number;
  rendering: number;
  scenes: number;
  updatedAt: string;
};

export type WorkspaceData = {
  dataSource: "supabase" | "empty" | "error";
  errorMessage?: string;
  projects: WorkspaceProject[];
  scenes: WorkspaceScene[];
};
