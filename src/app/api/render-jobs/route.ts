import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server/auth";
import { renderPanoramaWithOpenAI } from "@/lib/server/openai-images";
import { createPanoramaSignedUrl, uploadPanoramaAsset } from "@/lib/server/panorama-storage";
import { startTopazUpscale } from "@/lib/server/topaz";
import { RENDER_PRESETS, type PresetId } from "@/lib/presets";
import { BETA_DAILY_RENDER_LIMIT, getDailyRenderWindowStart, getRenderProviderMode, hasDailyRenderCapacity } from "@/lib/render-limits";
import { createClient } from "@/lib/supabase/server";
import type { RenderJobStatus } from "@/lib/render-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const ownerId = user.id;
  const formData = await request.formData();
  const image = formData.get("image");
  const presetId = formData.get("presetId");
  const notes = formData.get("notes");
  const requestedMode = formData.get("mode");
  const mode = getRenderProviderMode(typeof requestedMode === "string" ? requestedMode : undefined);
  const projectId = formData.get("projectId");
  const sceneName = formData.get("sceneName");

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  if (typeof presetId !== "string" || !isPresetId(presetId)) {
    return NextResponse.json({ error: "Missing presetId." }, { status: 400 });
  }

  const project = await ensureProjectRecord({
    ownerId,
    projectId: typeof projectId === "string" && projectId ? projectId : undefined
  });

  if (mode !== "real") {
    const scene = await insertSceneRecord({
      name: typeof sceneName === "string" && sceneName.trim() ? sceneName.trim() : image.name || "Uploaded panorama",
      notes: typeof notes === "string" ? notes : "",
      presetId,
      projectId: project.id,
      status: "rendering_openai"
    });
    const job = await insertRenderJobRecord({
      mode: "mock",
      ownerId,
      sceneId: scene.id,
      status: "rendering_openai"
    });

    return NextResponse.json({
      id: job.id,
      projectId: project.id,
      sceneId: scene.id,
      status: "rendering_openai",
      mode: "mock",
      message: "Mock job created. Real OpenAI/Topaz calls are disabled unless mode=real."
    });
  }

  const quota = await getDailyRenderQuota(ownerId);

  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Daily beta render limit reached. You can run ${BETA_DAILY_RENDER_LIMIT} real renders per day.`,
        limit: BETA_DAILY_RENDER_LIMIT,
        remaining: 0
      },
      { status: 429 }
    );
  }

  const jobId = crypto.randomUUID();
  let scene: { id: string } | null = null;
  let job: { id: string } | null = null;

  try {
    const sourceAsset = await uploadPanoramaAsset({
      bytes: image,
      contentType: image.type || "application/octet-stream",
      fileName: image.name,
      jobId,
      stage: "source"
    });
    scene = await insertSceneRecord({
      name: typeof sceneName === "string" && sceneName.trim() ? sceneName.trim() : image.name || "Uploaded panorama",
      notes: typeof notes === "string" ? notes : "",
      presetId,
      projectId: project.id,
      sourcePath: sourceAsset.path,
      status: "rendering_openai"
    });
    job = await insertRenderJobRecord({
      id: jobId,
      mode: "real",
      ownerId,
      sceneId: scene.id,
      status: "rendering_openai"
    });
    const openaiResult = await renderPanoramaWithOpenAI({
      image,
      presetId,
      notes: typeof notes === "string" ? notes : undefined
    });
    const openaiAsset = await uploadPanoramaAsset({
      bytes: openaiResult.bytes,
      contentType: openaiResult.mimeType,
      fileName: "openai-render.jpeg",
      jobId,
      stage: "openai-render"
    });
    const openaiSignedUrl = await createPanoramaSignedUrl(openaiAsset.path);
    await updateSceneRecord(scene.id, {
      openaiRenderPath: openaiAsset.path,
      status: "upscaling_topaz"
    });
    const imageBytes = openaiResult.bytes.buffer.slice(
      openaiResult.bytes.byteOffset,
      openaiResult.bytes.byteOffset + openaiResult.bytes.byteLength
    ) as ArrayBuffer;
    const topazResult = await startTopazUpscale(new Blob([imageBytes], { type: openaiResult.mimeType }));
    await updateRenderJobRecord(job.id, {
      status: "upscaling_topaz",
      topazProcessId: topazResult.processId
    });
    const finalAsset = null as null | { bucket: string; path: string; signedUrl: string; stage: "topaz-final" };

    return NextResponse.json({
      id: job.id,
      image: openaiSignedUrl,
      projectId: project.id,
      sceneId: scene.id,
      status: "upscaling_topaz",
      mode: "real",
      remainingToday: Math.max(0, BETA_DAILY_RENDER_LIMIT - quota.count - 1),
      storage: {
        source: sourceAsset,
        openaiRender: { ...openaiAsset, signedUrl: openaiSignedUrl },
        finalAsset
      },
      openai: {
        model: openaiResult.model,
        outputSize: openaiResult.outputSize,
        bytes: openaiResult.bytes.length
      },
      topaz: topazResult
    });
  } catch (error) {
    const message = friendlyRenderError(error);

    if (scene || job) {
      try {
        await markRenderJobFailed({ jobId: job?.id, message, sceneId: scene?.id });
      } catch (failureUpdateError) {
        console.error(failureUpdateError);
      }
    }

    return NextResponse.json(
      {
        error: message,
        id: job?.id,
        sceneId: scene?.id,
        status: "failed"
      },
      { status: 500 }
    );
  }
}

function isPresetId(value: string): value is PresetId {
  return RENDER_PRESETS.some((preset) => preset.id === value);
}

async function ensureProjectRecord({ ownerId, projectId }: { ownerId: string; projectId?: string }) {
  const supabase = await createClient();

  if (projectId) {
    const { data, error } = await supabase.from("projects").select("id").eq("id", projectId).single();

    if (error || !data) {
      throw new Error(error?.message || "Project was not found.");
    }

    return data;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ name: "Untitled Project", owner_id: ownerId })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Project could not be created.");
  }

  return data;
}

async function insertSceneRecord(input: {
  name: string;
  notes: string;
  openaiRenderPath?: string;
  presetId: PresetId;
  projectId: string;
  sourcePath?: string;
  status: RenderJobStatus;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .insert({
      name: input.name,
      notes: input.notes,
      openai_render_path: input.openaiRenderPath,
      preset_id: input.presetId,
      project_id: input.projectId,
      source_path: input.sourcePath,
      status: input.status
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Scene could not be created.");
  }

  return data;
}

async function updateSceneRecord(
  sceneId: string,
  values: { openaiRenderPath?: string; status?: RenderJobStatus; topazFinalPath?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scenes")
    .update({
      openai_render_path: values.openaiRenderPath,
      status: values.status,
      topaz_final_path: values.topazFinalPath,
      updated_at: new Date().toISOString()
    })
    .eq("id", sceneId);

  if (error) {
    throw new Error(`Scene update failed: ${error.message}`);
  }
}

async function getDailyRenderQuota(ownerId: string) {
  const supabase = await createClient();
  const windowStart = getDailyRenderWindowStart();
  const { count, error } = await supabase
    .from("render_jobs")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("mode", "real")
    .gte("started_at", windowStart);

  if (error) {
    throw new Error(`Daily render quota check failed: ${error.message}`);
  }

  const renderCount = count ?? 0;

  return {
    allowed: hasDailyRenderCapacity(renderCount),
    count: renderCount
  };
}

async function insertRenderJobRecord(input: {
  id?: string;
  mode: "mock" | "real";
  ownerId: string;
  sceneId: string;
  status: RenderJobStatus;
  topazProcessId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("render_jobs")
    .insert({
      id: input.id,
      mode: input.mode,
      owner_id: input.ownerId,
      scene_id: input.sceneId,
      status: input.status,
      topaz_process_id: input.topazProcessId
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Render job could not be created.");
  }

  return data;
}

async function updateRenderJobRecord(
  jobId: string,
  values: { errorMessage?: string; status?: RenderJobStatus; topazProcessId?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("render_jobs")
    .update({
      error_message: values.errorMessage,
      status: values.status,
      topaz_process_id: values.topazProcessId,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Render job update failed: ${error.message}`);
  }
}

async function markRenderJobFailed({ jobId, message, sceneId }: { jobId?: string; message: string; sceneId?: string }) {
  const supabase = await createClient();
  const updates: Array<PromiseLike<{ error: { message: string } | null }>> = [];

  if (sceneId) {
    updates.push(
      supabase
        .from("scenes")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", sceneId)
    );
  }

  if (jobId) {
    updates.push(
      supabase
        .from("render_jobs")
        .update({ error_message: message, status: "failed", updated_at: new Date().toISOString() })
        .eq("id", jobId)
    );
  }

  const results = await Promise.all(updates);
  const failure = results.find((result) => result.error);

  if (failure?.error) {
    throw new Error(`Failed to mark render job failed: ${failure.error.message}`);
  }
}

function friendlyRenderError(error: unknown) {
  const message = error instanceof Error ? error.message : "Render failed.";

  if (message.includes("OPENAI_API_KEY") || message.includes("TOPAZ_API_KEY")) {
    return "The beta render provider keys are not configured yet.";
  }

  if (message.startsWith("OpenAI image render failed")) {
    return "OpenAI could not create the panorama render. Please try a different source image or preset.";
  }

  if (message.startsWith("Topaz upscale start failed")) {
    return "Topaz could not start the upscale. The OpenAI render was saved, but final upscaling failed.";
  }

  if (message.startsWith("Supabase storage upload failed")) {
    return "The render was created, but saving the image failed. Please try again.";
  }

  return message;
}
