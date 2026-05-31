import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/server/auth";
import { createPanoramaSignedUrl, uploadPanoramaAsset } from "@/lib/server/panorama-storage";
import { getTopazDownload, getTopazStatus } from "@/lib/server/topaz";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ processId: string }> }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { processId } = await context.params;
  const job = await getAuthorizedTopazJob(processId);

  if (!job) {
    return NextResponse.json({ error: "Render job was not found." }, { status: 404 });
  }

  if (job.status === "ready" && job.topaz_final_path) {
    const signedUrl = await createPanoramaSignedUrl(job.topaz_final_path);

    return NextResponse.json({
      processId,
      renderStatus: "ready",
      status: "completed",
      finalAsset: {
        path: job.topaz_final_path,
        signedUrl
      }
    });
  }

  const status = await getTopazStatus(processId);
  const normalized = status.status.toLowerCase();
  const download = normalized === "completed" ? await getTopazDownload(processId) : null;
  let finalAsset = null;

  try {
    finalAsset = download ? await storeTopazFinalAsset(processId, job.scene_id, download.downloadUrl) : null;
  } catch (error) {
    await markTopazJobFailed(
      processId,
      job.scene_id,
      error instanceof Error ? error.message : "Topaz final storage failed."
    );

    return NextResponse.json(
      {
        error: "Topaz finished, but the final panorama could not be saved.",
        processId,
        renderStatus: "failed",
        status: "failed"
      },
      { status: 500 }
    );
  }

  if (isFailedTopazStatus(normalized)) {
    await markTopazJobFailed(processId, job.scene_id, `Topaz status: ${status.status}`);
  }

  return NextResponse.json({
    ...status,
    download,
    finalAsset,
    renderStatus: finalAsset ? "ready" : isFailedTopazStatus(normalized) ? "failed" : "upscaling_topaz"
  });
}

async function getAuthorizedTopazJob(
  processId: string
): Promise<{ id: string; scene_id: string; status: string; topaz_final_path: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("render_jobs")
    .select("id,scene_id,status")
    .eq("topaz_process_id", processId)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: scene } = await supabase.from("scenes").select("topaz_final_path").eq("id", data.scene_id).single();

  return {
    ...data,
    topaz_final_path: scene?.topaz_final_path ?? null
  };
}

async function storeTopazFinalAsset(processId: string, sceneId: string, downloadUrl: string) {
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(`Topaz final download failed: ${response.status} ${await response.text()}`);
  }

  const finalAsset = await uploadPanoramaAsset({
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "image/jpeg",
    fileName: "topaz-final.jpeg",
    jobId: processId,
    stage: "topaz-final"
  });

  const supabase = await createClient();
  const signedUrl = await createPanoramaSignedUrl(finalAsset.path);
  const { error: sceneError } = await supabase
    .from("scenes")
    .update({
      status: "ready",
      topaz_final_path: finalAsset.path,
      updated_at: new Date().toISOString()
    })
    .eq("id", sceneId);

  const { error: jobError } = await supabase
    .from("render_jobs")
    .update({
      status: "ready",
      updated_at: new Date().toISOString()
    })
    .eq("topaz_process_id", processId);

  if (sceneError || jobError) {
    throw new Error(sceneError?.message || jobError?.message || "Topaz final record update failed.");
  }

  return {
    ...finalAsset,
    signedUrl
  };
}

async function markTopazJobFailed(processId: string, sceneId: string, message: string) {
  const supabase = await createClient();
  const { error: sceneError } = await supabase
    .from("scenes")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", sceneId);
  const { error: jobError } = await supabase
    .from("render_jobs")
    .update({ error_message: message, status: "failed", updated_at: new Date().toISOString() })
    .eq("topaz_process_id", processId);

  if (sceneError || jobError) {
    throw new Error(sceneError?.message || jobError?.message || "Topaz failure record update failed.");
  }
}

function isFailedTopazStatus(status: string) {
  return status === "failed" || status === "error" || status === "canceled" || status === "cancelled";
}
