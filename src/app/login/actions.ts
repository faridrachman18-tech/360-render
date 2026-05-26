"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthActionMessage = "invalid" | "login_failed" | "signup_failed" | "check_email";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/projects";
}

function loginPath(message: AuthActionMessage, next: string) {
  const params = new URLSearchParams({ [message === "check_email" ? "message" : "error"]: message });

  if (next !== "/projects") {
    params.set("next", next);
  }

  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirect(loginPath("invalid", next));
  }

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
  const next = safeNextPath(formString(formData, "next"));

  if (!email || !password) {
    redirect(loginPath("invalid", next));
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
