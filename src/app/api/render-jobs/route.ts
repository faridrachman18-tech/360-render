import { NextResponse } from "next/server";
import { renderPanoramaWithOpenAI } from "@/lib/server/openai-images";
import { uploadPanoramaAsset } from "@/lib/server/panorama-storage";
import { startTopazUpscale } from "@/lib/server/topaz";
import { type PresetId } from "@/lib/presets";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const presetId = formData.get("presetId");
  const notes = formData.get("notes");
  const mode = formData.get("mode") || "mock";

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }

  if (typeof presetId !== "string") {
    return NextResponse.json({ error: "Missing presetId." }, { status: 400 });
  }

  if (mode !== "real") {
    return NextResponse.json({
      id: `job_${crypto.randomUUID().slice(0, 8)}`,
      status: "rendering_openai",
      mode: "mock",
      message: "Mock job created. Real OpenAI/Topaz calls are disabled unless mode=real."
    });
  }

  const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;
  const sourceAsset = await uploadPanoramaAsset({
    bytes: image,
    contentType: image.type || "application/octet-stream",
    fileName: image.name,
    jobId,
    stage: "source"
  });
  const openaiResult = await renderPanoramaWithOpenAI({
    image,
    presetId: presetId as PresetId,
    notes: typeof notes === "string" ? notes : undefined
  });
  const openaiAsset = await uploadPanoramaAsset({
    bytes: openaiResult.bytes,
    contentType: openaiResult.mimeType,
    fileName: "openai-render.jpeg",
    jobId,
    stage: "openai-render"
  });
  const imageBytes = openaiResult.bytes.buffer.slice(
    openaiResult.bytes.byteOffset,
    openaiResult.bytes.byteOffset + openaiResult.bytes.byteLength
  ) as ArrayBuffer;
  const topazResult = await startTopazUpscale(new Blob([imageBytes], { type: openaiResult.mimeType }));

  return NextResponse.json({
    id: jobId,
    status: "upscaling_topaz",
    mode: "real",
    storage: {
      source: sourceAsset,
      openaiRender: openaiAsset
    },
    openai: {
      model: openaiResult.model,
      outputSize: openaiResult.outputSize,
      bytes: openaiResult.bytes.length
    },
    topaz: topazResult
  });
}
