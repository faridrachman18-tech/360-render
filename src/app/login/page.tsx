import { LoginForm } from "./LoginForm";
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
      <LoginForm
        errorMessage={errorMessage}
        loginAction={login}
        next={next}
        signupAction={signup}
        statusMessage={statusMessage}
      />
    </main>
  );
}
