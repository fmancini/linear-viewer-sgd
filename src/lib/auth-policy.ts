export function isAllowedEmail(email: unknown): email is string {
  if (typeof email !== "string" || !email.trim()) return false;
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex === -1) return false;
  const domain = normalized.slice(atIndex + 1);
  const allowedDomains = (process.env.AUTH_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowedDomains.includes(domain);
}

export function verifiedGoogleEmail(provider: unknown, profile: unknown): string | null {
  if (provider !== "google" || !profile || typeof profile !== "object") return null;
  if (!("email_verified" in profile) || profile.email_verified !== true) return null;
  if (!("email" in profile) || !isAllowedEmail(profile.email)) return null;
  return profile.email.trim().toLowerCase();
}
