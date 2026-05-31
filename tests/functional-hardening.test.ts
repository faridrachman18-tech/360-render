import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("functional hardening", () => {
  it("requires authenticated users before render and Topaz API work", () => {
    const renderRoute = source("src/app/api/render-jobs/route.ts");
    const topazRoute = source("src/app/api/topaz/status/[processId]/route.ts");

    expect(renderRoute).toContain("getAuthenticatedUser");
    expect(renderRoute).toContain("unauthorizedResponse");
    expect(renderRoute).toContain("ownerId");
    expect(renderRoute).toContain("insertRenderJobRecord");
    expect(topazRoute).toContain("getAuthenticatedUser");
    expect(topazRoute).toContain("unauthorizedResponse");
  });

  it("loads persisted workspace data and exposes the upload/render flow", () => {
    const workspace = source("src/components/WorkspaceApp.tsx");
    const projectsPage = source("src/app/projects/page.tsx");
    const viewerPage = source("src/app/viewer/page.tsx");

    expect(projectsPage).toContain("getWorkspaceData");
    expect(viewerPage).toContain("getWorkspaceData");
    expect(workspace).not.toContain("const projects: Project[] = [");
    expect(workspace).toContain("initialWorkspace");
    expect(workspace).toContain("Create project");
    expect(workspace).toContain("Upload panorama");
    expect(workspace).toContain("RENDER_PRESETS");
    expect(workspace).toContain("validatePanoramaFile");
    expect(workspace).toContain('fetch("/api/render-jobs"');
    expect(workspace).toContain("pollTopazStatus");
  });

  it("wires password recovery and removes nonfunctional auth placeholders", () => {
    const loginActions = source("src/app/login/actions.ts");
    const loginForm = source("src/app/login/LoginForm.tsx");
    const loginPage = source("src/app/login/page.tsx");

    expect(loginActions).toContain("resetPasswordForEmail");
    expect(loginActions).toContain("recoverPassword");
    expect(loginPage).toContain("recoverPassword");
    expect(loginForm).toContain("recoveryAction");
    expect(loginForm).toContain("formNoValidate");
    expect(loginForm).not.toContain("Google sign-in will be connected next.");
    expect(loginForm).not.toContain('name="remember"');
  });

  it("documents and migrates the real Supabase persistence model", () => {
    const schema = source("docs/supabase-schema.sql");
    const envExample = source(".env.example");
    const architecture = source("docs/architecture.json");

    expect(existsSync(fileURLToPath(new URL("../supabase/migrations/20260531000000_functional_hardening.sql", import.meta.url)))).toBe(true);
    expect(schema).toContain("default auth.uid()");
    expect(schema).toContain("constraint projects_owner_id_not_null");
    expect(schema).toContain("create trigger projects_set_updated_at");
    expect(schema).toContain("on storage.objects");
    expect(schema).toContain("bucket_id = '360-renders'");
    expect(envExample).toContain("NEXT_PUBLIC_SITE_URL=http://localhost:3000");
    expect(architecture).toContain("Supabase-backed project and scene data");
  });

  it("uses current provider request defaults and records provider output", () => {
    const openai = source("src/lib/server/openai-images.ts");
    const topaz = source("src/lib/server/topaz.ts");
    const renderRoute = source("src/app/api/render-jobs/route.ts");

    expect(openai).toContain("gpt-image-1.5");
    expect(openai).toContain('formData.append("size", "1536x1024")');
    expect(openai).not.toContain("gpt-image-2");
    expect(openai).not.toContain("3840x1920");
    expect(topaz).toContain("/enhance/async");
    expect(renderRoute).toContain("topaz-final");
    expect(renderRoute).toContain("finalAsset");
  });
});
