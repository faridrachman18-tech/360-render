import "server-only";

import { createPanoramaSignedUrl } from "@/lib/server/panorama-storage";
import { createClient } from "@/lib/supabase/server";
import type { PresetId } from "@/lib/presets";
import type { RenderJobStatus } from "@/lib/render-jobs";
import type { WorkspaceData, WorkspaceProject, WorkspaceScene } from "@/lib/workspace-types";

type ProjectRow = {
  cover_path: string | null;
  id: string;
  name: string;
  updated_at: string;
};

type SceneRow = {
  id: string;
  name: string;
  notes: string | null;
  openai_render_path: string | null;
  preset_id: string;
  project_id: string;
  source_path: string | null;
  status: string;
  topaz_final_path: string | null;
  updated_at: string;
};

type JobRow = {
  id: string;
  scene_id: string;
  status: string;
  topaz_process_id: string | null;
};

const FALLBACK_IMAGE = "/panoramas/living-room.jpg";

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims.sub) {
    return { dataSource: "empty", projects: [], scenes: [] };
  }

  try {
    const [{ data: projectRows, error: projectError }, { data: sceneRows, error: sceneError }, { data: jobRows }] =
      await Promise.all([
        supabase.from("projects").select("id,name,cover_path,updated_at").order("updated_at", { ascending: false }),
        supabase
          .from("scenes")
          .select("id,project_id,name,preset_id,status,notes,source_path,openai_render_path,topaz_final_path,updated_at")
          .order("updated_at", { ascending: false }),
        supabase.from("render_jobs").select("id,scene_id,status,topaz_process_id").order("created_at", { ascending: false })
      ]);

    if (projectError || sceneError) {
      throw new Error(projectError?.message || sceneError?.message || "Workspace data could not be loaded.");
    }

    return mapWorkspaceData(projectRows ?? [], sceneRows ?? [], jobRows ?? []);
  } catch (error) {
    return {
      dataSource: "error",
      errorMessage: error instanceof Error ? error.message : "Workspace data could not be loaded.",
      projects: [],
      scenes: []
    };
  }
}

export async function mapWorkspaceData(projectRows: ProjectRow[], sceneRows: SceneRow[], jobRows: JobRow[]): Promise<WorkspaceData> {
  const jobsByScene = new Map<string, JobRow>();
  jobRows.forEach((job) => {
    if (!jobsByScene.has(job.scene_id)) {
      jobsByScene.set(job.scene_id, job);
    }
  });

  const scenes: WorkspaceScene[] = await Promise.all(sceneRows.map(async (scene) => {
    const latestJob = jobsByScene.get(scene.id);
    const status = normalizeStatus(latestJob?.status ?? scene.status);

    return {
      id: scene.id,
      image: await resolvePanoramaImage(scene.topaz_final_path ?? scene.openai_render_path ?? scene.source_path),
      jobId: latestJob?.id,
      name: scene.name,
      notes: scene.notes ?? "",
      presetId: normalizePreset(scene.preset_id),
      projectId: scene.project_id,
      status,
      topazProcessId: latestJob?.topaz_process_id ?? undefined,
      updatedAt: formatUpdatedAt(scene.updated_at)
    };
  }));

  const scenesByProject = new Map<string, WorkspaceScene[]>();
  scenes.forEach((scene) => {
    scenesByProject.set(scene.projectId, [...(scenesByProject.get(scene.projectId) ?? []), scene]);
  });

  const projects: WorkspaceProject[] = await Promise.all(projectRows.map(async (project) => {
    const projectScenes = scenesByProject.get(project.id) ?? [];
    const fallbackScene = projectScenes[0];

    return {
      failed: projectScenes.filter((scene) => scene.status === "failed").length,
      id: project.id,
      image: await resolvePanoramaImage(project.cover_path, fallbackScene?.image ?? FALLBACK_IMAGE),
      name: project.name,
      ready: projectScenes.filter((scene) => scene.status === "ready").length,
      rendering: projectScenes.filter((scene) => scene.status === "rendering_openai" || scene.status === "upscaling_topaz").length,
      scenes: projectScenes.length,
      updatedAt: formatUpdatedAt(project.updated_at)
    };
  }));

  return {
    dataSource: projects.length ? "supabase" : "empty",
    projects,
    scenes
  };
}

function normalizePreset(value: string): PresetId {
  if (value === "exterior_mendung" || value === "exterior_cerah" || value === "aerial_view_mendung") {
    return value;
  }

  return "interior";
}

function normalizeStatus(value: string): RenderJobStatus {
  if (value === "rendering_openai" || value === "upscaling_topaz" || value === "ready" || value === "failed") {
    return value;
  }

  return "uploaded";
}

async function resolvePanoramaImage(path: string | null, fallback = FALLBACK_IMAGE): Promise<string> {
  if (!path) {
    return fallback;
  }

  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  try {
    return await createPanoramaSignedUrl(path);
  } catch {
    return fallback;
  }
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Updated recently";
  }

  return `Updated ${date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;
}
