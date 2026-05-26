import "server-only";

import { getSupabaseAdminClient } from "@/lib/server/supabase";

export const PANORAMA_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "360-renders";

export type PanoramaAssetStage = "source" | "openai-render" | "topaz-final";

export type StoredPanoramaAsset = {
  bucket: string;
  path: string;
};

type UploadPanoramaAssetInput = {
  bytes: Blob | Buffer | ArrayBuffer;
  contentType: string;
  fileName?: string;
  jobId: string;
  stage: PanoramaAssetStage;
};

export async function uploadPanoramaAsset(input: UploadPanoramaAssetInput): Promise<StoredPanoramaAsset> {
  const supabase = getSupabaseAdminClient();
  const extension = getFileExtension(input.fileName, input.contentType);
  const path = `jobs/${input.jobId}/${input.stage}-${crypto.randomUUID()}.${extension}`;
  const payload = await toUploadPayload(input.bytes);

  const { error } = await supabase.storage.from(PANORAMA_BUCKET).upload(path, payload, {
    cacheControl: "31536000",
    contentType: input.contentType,
    upsert: false
  });

  if (error) {
    throw new Error(`Supabase storage upload failed for ${input.stage}: ${error.message}`);
  }

  return {
    bucket: PANORAMA_BUCKET,
    path
  };
}

export async function createPanoramaSignedUrl(path: string, expiresInSeconds = 60 * 60): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(PANORAMA_BUCKET).createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Supabase signed URL failed: ${error?.message || "No signed URL returned."}`);
  }

  return data.signedUrl;
}

async function toUploadPayload(bytes: Blob | Buffer | ArrayBuffer): Promise<ArrayBuffer | Buffer> {
  if (bytes instanceof Blob) {
    return bytes.arrayBuffer();
  }

  return bytes;
}

function getFileExtension(fileName: string | undefined, contentType: string): string {
  const fileExtension = fileName?.split(".").pop()?.toLowerCase();

  if (fileExtension && /^[a-z0-9]+$/.test(fileExtension)) {
    return fileExtension === "jpg" ? "jpeg" : fileExtension;
  }

  switch (contentType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpeg";
  }
}
