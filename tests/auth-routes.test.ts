import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("auth route structure", () => {
  it("renders the public homepage separately from the protected workspace", () => {
    const rootPage = source("src/app/page.tsx");

    expect(rootPage).not.toContain("function ProjectsPage");
    expect(rootPage).not.toContain("function ViewerPage");
    expect(rootPage).not.toContain("redirect(\"/projects\")");
    expect(rootPage).toContain("Render. Upscale. Present 360");
    expect(rootPage).not.toContain("Built for Architects & Interior Designers");
    expect(rootPage).not.toContain("render-pill");
    expect(rootPage).toContain("render-home");
    expect(rootPage).toContain("How it works");
    expect(rootPage).toContain("Showcase");
    expect(rootPage).toContain("Pricing");
    expect(rootPage).toContain('href="/login"');
    expect(rootPage).toContain('href="/projects"');
    expect(rootPage).toContain("HeroPanoramaPreview");
  });

  it("uses an interactive panorama viewer for the public hero preview", () => {
    const heroPreview = source("src/components/HeroPanoramaPreview.tsx");
    const globalStyles = source("src/app/globals.css");
    const panoramaSphere = source("src/components/PanoramaSphere.tsx");

    expect(heroPreview).toContain('"use client"');
    expect(heroPreview).toContain("PanoramaSphere");
    expect(heroPreview).toContain("PanoramaController");
    expect(heroPreview).toContain("/panoramas/generated-hero-panorama.png");
    expect(heroPreview).toContain("panoramaRef.current?.zoom");
    expect(heroPreview).toContain("panoramaRef.current?.toggleFullscreen");
    expect(heroPreview).not.toContain("render-preview-static");
    expect(heroPreview).not.toContain("data-home-action");
    expect(heroPreview).not.toContain("render-preview-bar");
    expect(heroPreview).not.toContain("render-preview-rail");
    expect(existsSync(fileURLToPath(new URL("../public/panoramas/generated-hero-panorama.png", import.meta.url)))).toBe(true);
    expect(globalStyles).toContain(".render-preview-body .sphere-viewer");
    expect(globalStyles).not.toContain(".render-preview-static");
    expect(globalStyles).not.toContain(".render-preview-bar");
    expect(globalStyles).not.toContain(".render-preview-rail");
    expect(panoramaSphere).not.toContain("navigator.webdriver");
  });

  it("keeps the homepage on a dark glassmorphism visual system", () => {
    const rootPage = source("src/app/page.tsx");
    const globalStyles = source("src/app/globals.css");

    expect(rootPage).toContain("render-price-card featured");
    expect(rootPage).toContain("Save up to 30%");
    expect(rootPage).toContain("Watch Demo");
    expect(globalStyles).toContain(".render-light-beam");
    expect(globalStyles).toContain("backdrop-filter: blur(22px)");
    expect(globalStyles).toContain("@keyframes render-card-in");
    expect(globalStyles).toContain("prefers-reduced-motion: reduce");
  });

  it("exposes protected projects and viewer routes", () => {
    expect(existsSync(fileURLToPath(new URL("../src/app/projects/page.tsx", import.meta.url)))).toBe(true);
    expect(existsSync(fileURLToPath(new URL("../src/app/viewer/page.tsx", import.meta.url)))).toBe(true);

    const projectsPage = source("src/app/projects/page.tsx");
    const viewerPage = source("src/app/viewer/page.tsx");

    expect(projectsPage).toContain("WorkspaceApp");
    expect(projectsPage).toContain('initialPage="projects"');
    expect(viewerPage).toContain("WorkspaceApp");
    expect(viewerPage).toContain('initialPage="viewer"');
  });

  it("provides a login page with email password actions", () => {
    const loginPage = source("src/app/login/page.tsx");
    const loginActions = source("src/app/login/actions.ts");

    expect(loginPage).toContain('name="email"');
    expect(loginPage).toContain('name="password"');
    expect(loginPage).toContain("formAction={login}");
    expect(loginPage).toContain("formAction={signup}");
    expect(loginActions).toContain("signInWithPassword");
    expect(loginActions).toContain("signUp");
  });

  it("protects workspace routes in the Next.js proxy", () => {
    const proxy = source("src/proxy.ts");
    const supabaseProxy = source("src/lib/supabase/proxy.ts");

    expect(proxy).toContain("updateSession");
    expect(proxy).toContain("export async function proxy");
    expect(supabaseProxy).toContain("createServerClient");
    expect(supabaseProxy).toContain("getClaims");
    expect(supabaseProxy).toContain("protectedRoutes");
    expect(supabaseProxy).toContain('"/projects"');
    expect(supabaseProxy).toContain('"/viewer"');
    expect(supabaseProxy).toContain('"/login"');
  });
});

describe("auth documentation", () => {
  it("documents auth routes and public Supabase env vars", () => {
    const envExample = source(".env.example");
    const architecture = source("docs/architecture.json");

    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(architecture).toContain("Supabase Auth");
    expect(architecture).toContain("public homepage");
    expect(architecture).toContain("/login");
    expect(architecture).toContain("/projects");
    expect(architecture).toContain("/viewer");
    expect(architecture).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(architecture).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
});
