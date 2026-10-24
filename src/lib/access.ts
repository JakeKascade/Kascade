/** A shared confidentiality code, not an account system. The code is checked
 * on the server; the browser only ever holds a hash of it in an httpOnly cookie.
 * This deters casual sharing; it is not enterprise authentication. */
export const ACCESS_COOKIE = "kascade_proposal_access";
/** Set by the proxy on the code screen: which proposal's link was opened. */
export const PROPOSAL_HEADER = "x-kascade-proposal";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;
/** Local development only, so the site opens without configuration. */
const DEVELOPMENT_CODE = "2026";
const CODE_LENGTH = 4;

/** The configured code, or null when production has none (then nothing unlocks). */
export function accessCode(): string | null {
  const configured = process.env.KASCADE_ACCESS_CODE?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_CODE;
}
export function codeLength() {
  return accessCode()?.length ?? CODE_LENGTH;
}
export async function accessToken(code: string) {
  const bytes = new TextEncoder().encode(`kascade-real-coder-access:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
/** Constant-time comparison of two hex tokens. */
export function sameToken(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
