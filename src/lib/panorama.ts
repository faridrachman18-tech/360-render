export type PanoramaFileInfo = {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
};

export type ValidationStatus = "valid" | "invalid";

export type PanoramaValidationCheck = {
  label: string;
  status: ValidationStatus;
};

export type PanoramaValidationResult = {
  valid: boolean;
  checks: PanoramaValidationCheck[];
};

const SUPPORTED_TYPES = new Map([
  ["image/jpeg", "JPG image"],
  ["image/jpg", "JPG image"],
  ["image/png", "PNG image"],
  ["image/webp", "WebP image"]
]);

export function validatePanoramaFile(file: PanoramaFileInfo): PanoramaValidationResult {
  const typeLabel = SUPPORTED_TYPES.get(file.mimeType.toLowerCase());
  const ratio = file.height > 0 ? file.width / file.height : 0;
  const isTwoToOne = Math.abs(ratio - 2) <= 0.02;
  const hasUsableDimensions = file.width >= 1024 && file.height >= 512;

  const checks: PanoramaValidationCheck[] = [
    {
      label: typeLabel ? `File type: ${typeLabel}` : "File type: Unsupported",
      status: typeLabel ? "valid" : "invalid"
    },
    {
      label: hasUsableDimensions
        ? `Dimensions: ${file.width} x ${file.height}`
        : `Dimensions: ${file.width} x ${file.height}`,
      status: hasUsableDimensions ? "valid" : "invalid"
    },
    {
      label: isTwoToOne ? "Aspect ratio: 2:1" : `Aspect ratio: ${ratio.toFixed(2)}:1`,
      status: isTwoToOne ? "valid" : "invalid"
    },
    {
      label: isTwoToOne ? "Equirectangular: Valid panorama" : "Equirectangular: Invalid panorama",
      status: isTwoToOne ? "valid" : "invalid"
    }
  ];

  return {
    valid: checks.every((check) => check.status === "valid"),
    checks
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
