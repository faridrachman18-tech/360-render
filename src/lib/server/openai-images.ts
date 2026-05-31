import "server-only";

import { getPresetById, type PresetId } from "@/lib/presets";

type OpenAIRenderInput = {
  image: File;
  presetId: PresetId;
  notes?: string;
};

export type OpenAIRenderResult = {
  bytes: Buffer;
  mimeType: string;
  model: string;
  outputSize: string;
};

const OPENAI_IMAGE_MODEL = "gpt-image-1.5";

export async function renderPanoramaWithOpenAI(input: OpenAIRenderInput): Promise<OpenAIRenderResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const preset = getPresetById(input.presetId);
  const formData = new FormData();
  formData.append("model", OPENAI_IMAGE_MODEL);
  formData.append("image", input.image);
  formData.append("size", "1536x1024");
  formData.append("output_format", "jpeg");
  formData.append("prompt", `${preset.prompt}\n\nAdditional designer notes: ${input.notes || "none"}`);

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OpenAI image render failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = payload.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI response did not include image data.");
  }

  return {
    bytes: Buffer.from(b64, "base64"),
    mimeType: "image/jpeg",
    model: OPENAI_IMAGE_MODEL,
    outputSize: "1536x1024"
  };
}
