"use client";

import { useState } from "react";
import { ArrowRight, Box, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

type AuthAction = (formData: FormData) => void | Promise<void>;

type LoginFormProps = {
  errorMessage: string;
  loginAction: AuthAction;
  next: string;
  recoveryAction: AuthAction;
  signupAction: AuthAction;
  statusMessage: string;
};

export function LoginForm({ errorMessage, loginAction, next, recoveryAction, signupAction, statusMessage }: LoginFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="auth-shell">
      <Link className="auth-brand" href="/">
        <Box size={34} strokeWidth={1.55} />
        <span>360 Render</span>
      </Link>

      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-mark" aria-hidden="true">
          <Box size={34} strokeWidth={1.6} />
        </div>

        <div className="auth-heading">
          <h1 id="login-title">Welcome back.</h1>
          <p>Sign in to access your 360 projects, renderings, and presentations.</p>
        </div>

        <form action={loginAction} className="auth-form">
          <input name="next" type="hidden" value={next} />

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              <Mail aria-hidden="true" size={21} strokeWidth={1.8} />
              <input autoComplete="email" name="email" placeholder="Enter your email" required type="email" />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <LockKeyhole aria-hidden="true" size={21} strokeWidth={1.8} />
              <input
                autoComplete="current-password"
                name="password"
                placeholder="Enter your password"
                required
                type={passwordVisible ? "text" : "password"}
              />
              <button
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                className="auth-icon-button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                type="button"
              >
                {passwordVisible ? <EyeOff size={21} strokeWidth={1.9} /> : <Eye size={21} strokeWidth={1.9} />}
              </button>
            </div>
          </label>

          <div className="auth-options">
            <span className="auth-recovery-hint">Use your account email for recovery.</span>
            <button className="auth-link-button" formAction={recoveryAction} formNoValidate type="submit">
              Email reset link
            </button>
          </div>

          {errorMessage ? (
            <p className="auth-alert" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {statusMessage ? <p className="auth-alert success">{statusMessage}</p> : null}
          <button className="auth-submit" formAction={loginAction} type="submit">
            <span>Sign in</span>
            <ArrowRight aria-hidden="true" size={25} strokeWidth={1.75} />
          </button>

          <p className="auth-create">
            <span>Don&apos;t have an account?</span>
            <button formAction={signupAction} type="submit">
              Create account
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
