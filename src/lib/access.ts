/** A shared confidentiality code, not an account system. The code is checked
 * on the server; the browser only ever holds a hash of it in an httpOnly cookie. */
export const ACCESS_COOKIE = "elita_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

export function accessCode() {
  return process.env.ELITA_ACCESS_CODE || "1991";
}
export async function accessToken(code: string) {
  const bytes = new TextEncoder().encode(`elita-access:${code}`);
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
