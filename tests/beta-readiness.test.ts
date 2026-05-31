import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BETA_DAILY_RENDER_LIMIT,
  getDailyRenderWindowStart,
  getRenderProviderMode,
  hasDailyRenderCapacity
} from "@/lib/render-limits";

function source(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("real beta render readiness", () => {
  it("defaults production render submissions to real provider mode", () => {
    const workspace = source("src/components/WorkspaceApp.tsx");
    const renderRoute = source("src/app/api/render-jobs/route.ts");
    const envExample = source(".env.example");

    expect(getRenderProviderMode(undefined, "production")).toBe("real");
    expect(getRenderProviderMode(undefined, "development")).toBe("mock");
    expect(getRenderProviderMode("mock", "production")).toBe("mock");
    expect(workspace).not.toContain('formData.set("mode", "mock")');
    expect(renderRoute).toContain("getRenderProviderMode");
    expect(envExample).toContain("RENDER_PROVIDER_MODE=real");
  });

  it("limits each beta tester to three real render attempts per UTC day", () => {
    const limit = BETA_DAILY_RENDER_LIMIT;

    expect(limit).toBe(3);
    expect(hasDailyRenderCapacity(0)).toBe(true);
    expect(hasDailyRenderCapacity(2)).toBe(true);
    expect(hasDailyRenderCapacity(3)).toBe(false);
    expect(getDailyRenderWindowStart(new Date("2026-05-31T23:59:59.000Z"))).toBe("2026-05-31T00:00:00.000Z");
    expect(getDailyRenderWindowStart(new Date("2026-06-01T00:00:00.000Z"))).toBe("2026-06-01T00:00:00.000Z");
  });

  it("serves persisted private panorama assets through signed URLs", () => {
    const workspaceData = source("src/lib/server/workspace-data.ts");
    const topazRoute = source("src/app/api/topaz/status/[processId]/route.ts");

    expect(workspaceData).toContain("createPanoramaSignedUrl");
    expect(workspaceData).toContain("resolvePanoramaImage");
    expect(workspaceData).not.toContain("function publicOrFallback");
    expect(topazRoute).toContain("signedUrl");
  });

  it("records provider failures and documents beta schema grants", () => {
    const renderRoute = source("src/app/api/render-jobs/route.ts");
    const schema = source("docs/supabase-schema.sql");
    const migration = source("supabase/migrations/20260531000000_functional_hardening.sql");
    const architecture = source("docs/architecture.json");

    expect(renderRoute).toContain("markRenderJobFailed");
    expect(renderRoute).toContain("friendlyRenderError");
    expect(schema).toContain("started_at timestamptz not null default now()");
    expect(schema).toContain("grant select, insert, update, delete on table public.render_jobs to authenticated");
    expect(migration).toContain("grant select, insert, update, delete on table public.projects to authenticated");
    expect(architecture).toContain("daily real render limit");
  });
});
