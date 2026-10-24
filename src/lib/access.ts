import { createHash, timingSafeEqual } from "node:crypto";

export function authorised(
  header: string | null,
  user: string,
  password: string,
): boolean {
  if (!password || !header?.startsWith("Basic ")) return false;
  try {
    const supplied = Buffer.from(header.slice(6), "base64").toString("utf8");
    const digest = (value: string) =>
      createHash("sha256").update(value).digest();
    return timingSafeEqual(digest(supplied), digest(`${user}:${password}`));
  } catch {
    return false;
  }
}
