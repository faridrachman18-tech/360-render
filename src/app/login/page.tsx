import { Box } from "lucide-react";
import { login, signup } from "./actions";

type LoginSearchParams = Promise<{
  error?: string;
  message?: string;
  next?: string;
}>;

const errorMessages: Record<string, string> = {
  invalid: "Enter an email and password.",
  login_failed: "The email or password is not correct.",
  signup_failed: "Could not create that account. Try again with a different email or password."
};

const messages: Record<string, string> = {
  check_email: "Account created. Check your email to confirm your login."
};

function safeNextPath(value?: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/projects";
}

export default async function LoginPage({ searchParams }: { searchParams: LoginSearchParams }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const errorMessage = params.error ? errorMessages[params.error] : "";
  const statusMessage = params.message ? messages[params.message] : "";

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-brand">
          <Box size={31} strokeWidth={1.75} />
          <span>360 Render</span>
        </div>
        <div className="auth-heading">
          <h1 id="login-title">Log in</h1>
          <p>Use your workspace account to open projects and the 360 viewer.</p>
        </div>
        <form className="auth-form">
          <input name="next" type="hidden" value={next} />
          <label>
            <span>Email</span>
            <input autoComplete="email" name="email" placeholder="you@example.com" required type="email" />
          </label>
          <label>
            <span>Password</span>
            <input autoComplete="current-password" name="password" required type="password" />
          </label>
          {errorMessage ? <p className="auth-alert" role="alert">{errorMessage}</p> : null}
          {statusMessage ? <p className="auth-alert success">{statusMessage}</p> : null}
          <div className="auth-actions">
            <button formAction={login} type="submit">
              Log in
            </button>
            <button className="secondary" formAction={signup} type="submit">
              Sign up
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
