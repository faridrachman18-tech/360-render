import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BETA_ALLOWED_EMAIL_LIMIT,
  isBetaEmailAllowed,
  parseAllowedBetaEmails,
  passwordsMatch
} from "@/lib/beta-auth";

function source(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");
}

describe("beta auth allowlist", () => {
  it("normalizes configured emails and caps the beta to five accounts", () => {
    expect(BETA_ALLOWED_EMAIL_LIMIT).toBe(5);
    expect(
      parseAllowedBetaEmails(" A@Example.com, b@example.com ,, C@example.com, d@example.com, e@example.com, f@example.com ")
    ).toEqual(["a@example.com", "b@example.com", "c@example.com", "d@example.com", "e@example.com"]);
  });

  it("requires configured beta emails when an allowlist exists", () => {
    const allowedEmails = parseAllowedBetaEmails("friend@example.com, second@example.com");

    expect(isBetaEmailAllowed(" FRIEND@example.com ", allowedEmails)).toBe(true);
    expect(isBetaEmailAllowed("stranger@example.com", allowedEmails)).toBe(false);
  });

  it("blocks everyone when no beta allowlist is configured", () => {
    expect(isBetaEmailAllowed("anyone@example.com", [])).toBe(false);
  });

  it("validates signup password confirmation", () => {
    expect(passwordsMatch("secret-password", "secret-password")).toBe(true);
    expect(passwordsMatch("secret-password", "different-password")).toBe(false);
  });
});

describe("login/signup form wiring", () => {
  it("switches auth modes with GSAP instead of navigating to a signup page", () => {
    const loginForm = source("src/app/login/LoginForm.tsx");
    const loginActions = source("src/app/login/actions.ts");
    const loginPage = source("src/app/login/page.tsx");
    const globalStyles = source("src/app/globals.css");
    const envExample = source(".env.example");

    expect(loginForm).toContain('import gsap from "gsap"');
    expect(loginForm).toContain("authMode");
    expect(loginForm).toContain("setAuthMode");
    expect(loginForm).toContain("confirmPassword");
    expect(loginForm).toContain('name="confirmPassword"');
    expect(loginForm).toContain("prefers-reduced-motion: reduce");
    expect(loginForm).not.toContain('href="/signup"');
    expect(loginForm).toContain("Already have an account?");
    expect(loginForm).toContain("Create your account.");
    expect(loginActions).toContain("BETA_ALLOWED_EMAILS");
    expect(loginActions).toContain("isBetaEmailAllowed");
    expect(loginActions).toContain("passwordsMatch");
    expect(loginActions.indexOf("ensureBetaEmailAllowed(email, next);")).toBeLessThan(
      loginActions.indexOf("signInWithPassword"),
    );
    expect(loginActions.indexOf("ensureBetaEmailAllowed(email, next);", loginActions.indexOf("signup"))).toBeLessThan(
      loginActions.indexOf("signUp"),
    );
    expect(loginActions.indexOf("ensureBetaEmailAllowed(email, next);", loginActions.indexOf("recoverPassword"))).toBeLessThan(
      loginActions.indexOf("resetPasswordForEmail"),
    );
    expect(loginPage).toContain("beta_not_allowed");
    expect(loginPage).toContain("password_mismatch");
    expect(globalStyles).toContain(".auth-mode-switch");
    expect(envExample).toContain("BETA_ALLOWED_EMAILS=");
  });
});
