"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowRight, Box, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

type AuthAction = (formData: FormData) => void | Promise<void>;
type AuthMode = "login" | "signup";

type LoginFormProps = {
  errorMessage: string;
  loginAction: AuthAction;
  next: string;
  recoveryAction: AuthAction;
  signupAction: AuthAction;
  statusMessage: string;
};

export function LoginForm({ errorMessage, loginAction, next, recoveryAction, signupAction, statusMessage }: LoginFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const formContentRef = useRef<HTMLDivElement | null>(null);

  const isSignup = authMode === "signup";

  useEffect(() => {
    const target = formContentRef.current;

    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        target,
        { autoAlpha: 0, filter: "blur(2px)", y: isSignup ? 14 : -14 },
        {
          autoAlpha: 1,
          clearProps: "opacity,visibility,transform,filter",
          duration: 0.22,
          ease: "power3.out",
          filter: "blur(0px)",
          y: 0,
        },
      );
    }, target);

    return () => context.revert();
  }, [isSignup]);

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
          <h1 id="login-title">{isSignup ? "Create your account." : "Welcome back."}</h1>
          <p>
            {isSignup
              ? "Beta access is limited to approved tester emails."
              : "Sign in to access your 360 projects, renderings, and presentations."}
          </p>
        </div>

        <form action={isSignup ? signupAction : loginAction} className="auth-form">
          <input name="next" type="hidden" value={next} />

          <div className="auth-mode-switch" ref={formContentRef}>
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
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  name="password"
                  placeholder={isSignup ? "Create a password" : "Enter your password"}
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

            {isSignup ? (
              <label className="auth-field">
                <span>Confirm password</span>
                <div className="auth-input-wrap">
                  <LockKeyhole aria-hidden="true" size={21} strokeWidth={1.8} />
                  <input
                    autoComplete="new-password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    required
                    type={passwordVisible ? "text" : "password"}
                  />
                </div>
              </label>
            ) : null}

            {!isSignup ? (
              <div className="auth-options">
                <span className="auth-recovery-hint">Use your account email for recovery.</span>
                <button className="auth-link-button" formAction={recoveryAction} formNoValidate type="submit">
                  Email reset link
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="auth-alert" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {statusMessage ? <p className="auth-alert success">{statusMessage}</p> : null}
          {isSignup ? (
            <button className="auth-submit" formAction={signupAction} type="submit">
              <span>Create account</span>
              <ArrowRight aria-hidden="true" size={25} strokeWidth={1.75} />
            </button>
          ) : (
            <button className="auth-submit" formAction={loginAction} type="submit">
              <span>Sign in</span>
              <ArrowRight aria-hidden="true" size={25} strokeWidth={1.75} />
            </button>
          )}

          <p className="auth-create">
            <span>{isSignup ? "Already have an account?" : "Don't have an account?"}</span>
            <button onClick={() => setAuthMode(isSignup ? "login" : "signup")} type="button">
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </form>
      </section>
    </div>
  );
}
