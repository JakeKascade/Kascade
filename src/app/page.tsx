import { redirect } from "next/navigation";

// Each proposal lives at its own path. The bare address only ever shows the
// access screen (see src/proxy.ts); once unlocked it forwards to the proposal,
// so older links keep working.
export default function Home() {
  redirect("/real-coder");
}
