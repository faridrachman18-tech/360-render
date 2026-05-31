export type RenderProviderMode = "mock" | "real";

export const BETA_DAILY_RENDER_LIMIT = 3;

export function getRenderProviderMode(
  configuredMode = process.env.RENDER_PROVIDER_MODE,
  nodeEnv = process.env.NODE_ENV
): RenderProviderMode {
  if (configuredMode === "mock" || configuredMode === "real") {
    return configuredMode;
  }

  return nodeEnv === "production" ? "real" : "mock";
}

export function getDailyRenderWindowStart(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

export function hasDailyRenderCapacity(renderCount: number, limit = BETA_DAILY_RENDER_LIMIT): boolean {
  return renderCount < limit;
}
