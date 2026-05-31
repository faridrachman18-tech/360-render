export const BETA_ALLOWED_EMAIL_LIMIT = 5;

export function normalizeBetaEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAllowedBetaEmails(value = ""): string[] {
  return value
    .split(",")
    .map(normalizeBetaEmail)
    .filter(Boolean)
    .slice(0, BETA_ALLOWED_EMAIL_LIMIT);
}

export function isBetaEmailAllowed(email: string, allowedEmails: string[]): boolean {
  return allowedEmails.includes(normalizeBetaEmail(email));
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
