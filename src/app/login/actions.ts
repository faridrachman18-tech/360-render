"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isBetaEmailAllowed, parseAllowedBetaEmails, passwordsMatch } from "@/lib/beta-auth";
import { createClient } from "@/lib/supabase/server";

type AuthActionMessage =
  | "beta_not_allowed"
  | "invalid"
  | "login_failed"
  | "password_mismatch"
  | "signup_failed"
  | "check_email"
  | "recovery_email";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/projects";
}

function loginPath(message: AuthActionMessage, next: string) {
  const isStatusMessage = message === "check_email" || message === "recovery_email";
  const params = new URLSearchParams({ [isStatusMessage ? "message" : "error"]: message });

  if (next !== "/projects") {
    params.set("next", next);
  }

  return `/login?${params.toString()}`;
}

function betaAllowedEmails() {
  return parseAllowedBetaEmails(process.env.BETA_ALLOWED_EMAILS);
}

function ensureBetaEmailAllowed(email: string, next: string) {
  if (!isBetaEmailAllowed(email, betaAllowedEmails())) {
    redirect(loginPath("beta_not_allowed", next));
  }
}

export async function login(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirect(loginPath("invalid", next));
  }

  ensureBetaEmailAllowed(email, next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(loginPath("login_failed", next));
  }

  redirect(next);
}

export async function signup(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const confirmPassword = formString(formData, "confirmPassword");
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirect(loginPath("invalid", next));
  }

  ensureBetaEmailAllowed(email, next);

  if (!passwordsMatch(password, confirmPassword)) {
    redirect(loginPath("password_mismatch", next));
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: origin
      ? {
          emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
        }
      : undefined
  });

  if (error) {
    redirect(loginPath("signup_failed", next));
  }

  if (data.session) {
    redirect(next);
  }

  redirect(loginPath("check_email", next));
}

export async function recoverPassword(formData: FormData) {
  const email = formString(formData, "email");
  const next = safeNextPath(formString(formData, "next"));

  if (!email) {
    redirect(loginPath("invalid", next));
  }

  ensureBetaEmailAllowed(email, next);

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/reset-password?next=${encodeURIComponent(next)}` : undefined
  });

  if (error) {
    redirect(loginPath("login_failed", next));
  }

  redirect(loginPath("recovery_email", next));
}
