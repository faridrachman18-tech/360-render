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

  it("rejects emails beyond the five-account beta cap", () => {
    const allowedEmails = parseAllowedBetaEmails(
      "one@example.com,two@example.com,three@example.com,four@example.com,five@example.com,six@example.com",
    );

    expect(allowedEmails).toHaveLength(5);
    expect(isBetaEmailAllowed("five@example.com", allowedEmails)).toBe(true);
    expect(isBetaEmailAllowed("six@example.com", allowedEmails)).toBe(false);
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
  it("keeps create account as a mode switch instead of a signup navigation or immediate submit", () => {
    const loginForm = source("src/app/login/LoginForm.tsx");

    expect(loginForm).toContain('type AuthMode = "login" | "signup"');
    expect(loginForm).toContain('useState<AuthMode>("login")');
    expect(loginForm).toContain('setAuthMode(isSignup ? "login" : "signup")');
    expect(loginForm).toContain('type="button"');
    expect(loginForm).not.toContain('href="/signup"');
    expect(loginForm).not.toContain('formAction={signupAction} type="button"');
  });

  it("renders signup-only confirmation and login-only recovery controls from auth mode state", () => {
    const loginForm = source("src/app/login/LoginForm.tsx");

    expect(loginForm).toContain("isSignup ? (");
    expect(loginForm).toContain('name="confirmPassword"');
    expect(loginForm).toContain("!isSignup ? (");
    expect(loginForm).toContain("formAction={recoveryAction}");
    expect(loginForm).toContain('autoComplete={isSignup ? "new-password" : "current-password"}');
    expect(loginForm).toContain('placeholder={isSignup ? "Create a password" : "Enter your password"}');
  });

  it("keeps the reduced-motion-aware GSAP transition scoped and cleaned up", () => {
    const loginForm = source("src/app/login/LoginForm.tsx");

    expect(loginForm).toContain('import gsap from "gsap"');
    expect(loginForm).toContain("formContentRef");
    expect(loginForm).toContain("gsap.context");
    expect(loginForm).toContain("gsap.fromTo");
    expect(loginForm).toContain("prefers-reduced-motion: reduce");
    expect(loginForm).toContain("context.revert()");
    expect(loginForm).toContain('duration: 0.22');
  });

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
    expect(loginActions.indexOf("ensureBetaEmailAllowed(email, next);")).toBeGreaterThan(
      loginActions.indexOf("if (!email || !password)"),
    );
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
