"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Box, Eye, EyeOff, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RecoveryStatus = "checking" | "ready" | "saving" | "error";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/projects";
}

export function ResetPasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [errorMessage, setErrorMessage] = useState("");
  const [nextPath, setNextPath] = useState("/projects");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const isSaving = status === "saving";
  const isReady = status === "ready" || isSaving;

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && active) {
        setErrorMessage("");
        setStatus("ready");
      }
    });

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = safeNextPath(url.searchParams.get("next"));

      setNextPath(next);

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (!active) {
            return;
          }

          setErrorMessage("This password recovery link is invalid or expired.");
          setStatus("error");
          return;
        }

        const cleanUrl = new URL(window.location.href);
        cleanUrl.search = next === "/projects" ? "" : `?next=${encodeURIComponent(next)}`;
        window.history.replaceState({}, document.title, `${cleanUrl.pathname}${cleanUrl.search}`);
      }

      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (data.session) {
        setErrorMessage("");
        setStatus("ready");
      } else {
        setErrorMessage("Open this page from a valid password recovery email.");
        setStatus("error");
      }
    }

    prepareRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!password || password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setStatus("ready");
      return;
    }

    setErrorMessage("");
    setStatus("saving");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage("Could not update that password. Try a longer password.");
      setStatus("ready");
      return;
    }

    const params = new URLSearchParams({ message: "password_updated" });

    if (nextPath !== "/projects") {
      params.set("next", nextPath);
    }

    window.location.assign(`/login?${params.toString()}`);
  }

  return (
    <div className="auth-shell">
      <Link className="auth-brand" href="/">
        <Box size={34} strokeWidth={1.55} />
        <span>360 Render</span>
      </Link>

      <section className="auth-panel" aria-labelledby="reset-password-title">
        <div className="auth-mark" aria-hidden="true">
          <Box size={34} strokeWidth={1.6} />
        </div>

        <div className="auth-heading">
          <h1 id="reset-password-title">Set a new password.</h1>
          <p>Choose a new password for your 360 Render account.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {status === "checking" ? <p className="auth-alert neutral">Checking your recovery link...</p> : null}

          <label className="auth-field">
            <span>New password</span>
            <div className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={21} strokeWidth={1.8} />
              <input
                autoComplete="new-password"
                disabled={!isReady}
                name="password"
                placeholder="Enter a new password"
                required
                type={passwordVisible ? "text" : "password"}
              />
              <button
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="auth-icon-button"
                disabled={!isReady}
                onClick={() => setPasswordVisible((visible) => !visible)}
                type="button"
              >
                {passwordVisible ? <EyeOff size={21} strokeWidth={1.9} /> : <Eye size={21} strokeWidth={1.9} />}
              </button>
            </div>
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <div className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={21} strokeWidth={1.8} />
              <input
                autoComplete="new-password"
                disabled={!isReady}
                name="confirmPassword"
                placeholder="Confirm your new password"
                required
                type={passwordVisible ? "text" : "password"}
              />
            </div>
          </label>

          {errorMessage ? (
            <p className="auth-alert" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button className="auth-submit" disabled={!isReady} type="submit">
            <span>{isSaving ? "Saving password" : "Update password"}</span>
            <ArrowRight aria-hidden="true" size={25} strokeWidth={1.75} />
          </button>

          <p className="auth-create">
            <span>Remembered your password?</span>
            <Link href="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
