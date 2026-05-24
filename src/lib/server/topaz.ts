import "server-only";

export type TopazStartResult = {
  processId: string;
  eta?: number;
};

export type TopazStatusResult = {
  processId: string;
  status: string;
  progress?: number;
};

export type TopazDownloadResult = {
  downloadUrl: string;
  headUrl: string;
  expiry: number;
};

const TOPAZ_BASE_URL = "https://api.topazlabs.com/image/v1";

export async function startTopazUpscale(image: Blob, filename = "panorama-render.jpg"): Promise<TopazStartResult> {
  const apiKey = process.env.TOPAZ_API_KEY;

  if (!apiKey) {
    throw new Error("TOPAZ_API_KEY is not configured.");
  }

  const formData = new FormData();
  formData.append("image", image, filename);
  formData.append("model", "High Fidelity V2");
  formData.append("output_width", "4096");
  formData.append("output_height", "2048");
  formData.append("output_format", "jpeg");
  formData.append("crop_to_fill", "false");

  const response = await fetch(`${TOPAZ_BASE_URL}/enhance/async`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Topaz upscale start failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { process_id?: string; eta?: number };

  if (!payload.process_id) {
    throw new Error("Topaz response did not include process_id.");
  }

  return {
    processId: payload.process_id,
    eta: payload.eta
  };
}

export async function getTopazStatus(processId: string): Promise<TopazStatusResult> {
  const apiKey = process.env.TOPAZ_API_KEY;

  if (!apiKey) {
    throw new Error("TOPAZ_API_KEY is not configured.");
  }

  const response = await fetch(`${TOPAZ_BASE_URL}/status/${processId}`, {
    headers: {
      "X-API-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Topaz status failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { process_id: string; status: string; progress?: number };

  return {
    processId: payload.process_id,
    status: payload.status,
    progress: payload.progress
  };
}

export async function getTopazDownload(processId: string): Promise<TopazDownloadResult> {
  const apiKey = process.env.TOPAZ_API_KEY;

  if (!apiKey) {
    throw new Error("TOPAZ_API_KEY is not configured.");
  }

  const response = await fetch(`${TOPAZ_BASE_URL}/download/${processId}`, {
    headers: {
      "X-API-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Topaz download link failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { download_url: string; head_url: string; expiry: number };

  return {
    downloadUrl: payload.download_url,
    headUrl: payload.head_url,
    expiry: payload.expiry
  };
}
