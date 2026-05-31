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
    expect(rootPage).toContain("Step into your");
    expect(rootPage).toContain("Render, upscale, and share immersive panoramas");
    expect(rootPage).not.toContain("Built for Architects & Interior Designers");
    expect(rootPage).not.toContain("render-pill");
    expect(rootPage).not.toContain("render-proof-row");
    expect(rootPage).not.toContain("No credit card");
    expect(rootPage).toContain('className="render-nav-cta" href="/login"');
    expect(rootPage).toContain("Log in");
    expect(rootPage).toContain("render-home");
    expect(rootPage).toContain('image: "/panoramas/generated-hero-panorama.png"');
    expect(rootPage).toContain("How it works");
    expect(rootPage).toContain("From SketchUp to panorama presentation in 4 simple steps.");
    expect(rootPage).toContain("Get our SketchUp plugin to export panorama images from your projects.");
    expect(rootPage).toContain("Showcase");
    expect(rootPage).toContain('title: "Penthouse Suite"');
    expect(rootPage).toContain('views: "1.6k"');
    expect(rootPage).toContain("Pricing");
    expect(rootPage).toContain('href="/login"');
    expect(rootPage).toContain('href="/projects"');
    expect(rootPage).toContain("HeroPanoramaPreview");
    expect(rootPage.indexOf('className="render-workflow"')).toBeLessThan(
      rootPage.indexOf('className="render-feature-grid"'),
    );
  });

  it("uses an interactive panorama viewer for the public hero preview", () => {
    const heroPreview = source("src/components/HeroPanoramaPreview.tsx");
    const globalStyles = source("src/app/globals.css");
    const panoramaSphere = source("src/components/PanoramaSphere.tsx");

    expect(heroPreview).toContain('"use client"');
    expect(heroPreview).toContain("PanoramaSphere");
    expect(heroPreview).toContain("/panoramas/generated-hero-panorama.png");
    expect(heroPreview).toContain("mousewheel={false}");
    expect(heroPreview).toContain("autoRotate");
    expect(heroPreview).not.toContain("panoramaRef.current?.zoom");
    expect(heroPreview).not.toContain("panoramaRef.current?.toggleFullscreen");
    expect(heroPreview).not.toContain("render-preview-controls");
    expect(heroPreview).not.toContain("render-preview-title");
    expect(heroPreview).not.toContain("Penthouse Living Room");
    expect(heroPreview).not.toContain("render-preview-static");
    expect(heroPreview).not.toContain("data-home-action");
    expect(heroPreview).not.toContain("render-preview-bar");
    expect(heroPreview).not.toContain("render-preview-rail");
    expect(existsSync(fileURLToPath(new URL("../public/panoramas/generated-hero-panorama.png", import.meta.url)))).toBe(true);
    expect(globalStyles).toContain(".render-preview-body .sphere-viewer");
    expect(globalStyles).not.toContain(".render-preview-controls");
    expect(globalStyles).not.toContain(".render-preview-title");
    expect(globalStyles).not.toContain(".render-preview-static");
    expect(globalStyles).not.toContain(".render-preview-bar");
    expect(globalStyles).not.toContain(".render-preview-rail");
    expect(panoramaSphere).toContain("mousewheel = true");
    expect(panoramaSphere).toContain("autoRotate = false");
    expect(panoramaSphere).toContain("useSyncExternalStore");
    expect(panoramaSphere).toContain("getServerWebGLSnapshot");
    expect(panoramaSphere).not.toContain('typeof window === "undefined" ? true : supportsWebGL()');
    expect(panoramaSphere).not.toContain("setWebglSupported(supportsWebGL())");
    expect(panoramaSphere).toContain("prefers-reduced-motion: reduce");
    expect(panoramaSphere).toContain("requestAnimationFrame");
    expect(panoramaSphere).not.toContain("navigator.webdriver");
  });

  it("keeps the homepage on a dark borderless glassmorphism visual system", () => {
    const rootPage = source("src/app/page.tsx");
    const globalStyles = source("src/app/globals.css");
    const glassStrokeRules = Array.from(
      globalStyles.matchAll(/([^{}]+)\{([^{}]*backdrop-filter[^{}]*)\}/g),
    )
      .map(([, selector, body]) => {
        const visibleBorders = Array.from(
          body.matchAll(/(?:^|\n)\s*(border(?:-(?:top|right|bottom|left))?)\s*:\s*([^;]+)/g),
        ).filter(([, , value]) => !/^(0|none)\b/.test(value.trim()));
        const hasInsetStroke = /box-shadow\s*:[^;]*inset\s+0\s+1px\s+0/i.test(body);

        return visibleBorders.length > 0 || hasInsetStroke ? selector.trim() : null;
      })
      .filter(Boolean);

    expect(rootPage).toContain("render-price-card featured");
    expect(rootPage).toContain("Save up to 30%");
    expect(rootPage).not.toContain("Watch Demo");
    expect(globalStyles).toContain(".render-light-beam");
    expect(globalStyles).toContain("backdrop-filter: blur(22px)");
    expect(globalStyles).toContain("padding: clamp(42px, 7vh, 86px) 14px 14px");
    expect(globalStyles).toContain("padding-top: 18px");
    expect(globalStyles).not.toMatch(/\.render-showcase\s*\{[^}]*border-top\s*:/);
    expect(glassStrokeRules).toEqual([]);
    expect(globalStyles).toContain("@keyframes render-card-in");
    expect(globalStyles).toContain("prefers-reduced-motion: reduce");
  });

  it("wires GSAP ScrollTrigger effects into the public homepage", () => {
    const rootPage = source("src/app/page.tsx");
    const architecture = source("docs/architecture.json");
    const scrollEffectsPath = fileURLToPath(new URL("../src/components/HomeScrollEffects.tsx", import.meta.url));

    expect(existsSync(scrollEffectsPath)).toBe(true);

    const scrollEffects = source("src/components/HomeScrollEffects.tsx");

    expect(rootPage).toContain("HomeScrollEffects");
    expect(rootPage).toContain("<HomeScrollEffects />");
    expect(rootPage).toContain("data-scroll-reveal");
    expect(rootPage).toContain("data-scroll-group");
    expect(scrollEffects).toContain('"use client"');
    expect(scrollEffects).toContain('gsap');
    expect(scrollEffects).toContain("gsap/ScrollTrigger");
    expect(scrollEffects).toContain("gsap.registerPlugin(ScrollTrigger)");
    expect(scrollEffects).toContain("prefers-reduced-motion: no-preference");
    expect(scrollEffects).toContain("ScrollTrigger.refresh");
    expect(scrollEffects).toContain("ctx.revert()");
    expect(architecture).toContain("HomeScrollEffects.tsx");
    expect(architecture).toContain("GSAP ScrollTrigger");
  });

  it("keeps the pricing section free of warm yellow accents", () => {
    const globalStyles = source("src/app/globals.css");
    const ctaIndex = globalStyles.indexOf(".render-price-card.featured .render-plan-cta");
    const footerIndex = globalStyles.indexOf(".render-footer", ctaIndex);
    const pricingStyles = globalStyles.slice(
      globalStyles.lastIndexOf(".render-billing-toggle", ctaIndex),
      footerIndex,
    );

    expect(pricingStyles).toContain(".render-popular");
    expect(pricingStyles).not.toMatch(/#(?:d6ac63|e9c47e|c7903c|dfb562|bd842f)\b/i);
    expect(pricingStyles).not.toMatch(/rgba?\(\s*214\s*,\s*172\s*,\s*99\b/i);
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
    const loginForm = source("src/app/login/LoginForm.tsx");
    const loginActions = source("src/app/login/actions.ts");
    const globalStyles = source("src/app/globals.css");

    expect(loginPage).toContain("LoginForm");
    expect(loginPage).toContain("loginAction={login}");
    expect(loginPage).toContain("signupAction={signup}");
    expect(loginForm).toContain('name="email"');
    expect(loginForm).toContain('name="password"');
    expect(loginForm).toContain('name="remember"');
    expect(loginForm).toContain("formAction={loginAction}");
    expect(loginForm).toContain("formAction={signupAction}");
    expect(loginForm).toContain("Continue with Google");
    expect(loginForm).toContain("Forgot password?");
    expect(loginForm).toContain("passwordVisible");
    expect(globalStyles).toContain("/auth-login-background.png");
    expect(existsSync(fileURLToPath(new URL("../public/auth-login-background.png", import.meta.url)))).toBe(true);
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
