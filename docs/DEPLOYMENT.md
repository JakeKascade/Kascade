# Deployment

Deploys from `main` to its own Vercel project, separate from ELITA. Every push to `main` updates the site.

Live at **https://proposal.kascadestudio.com.au/real-coder** (CNAME `proposal` at VentraIP → Vercel; `kascade-real-coder.vercel.app` also works).

## Paths

Each proposal has its own path: this one is `src/app/real-coder/page.tsx`. The bare address only ever shows the access screen, so it never names a proposal; once unlocked it forwards to `/real-coder` (`src/app/page.tsx`), so older links keep working. A future proposal would be a new folder alongside it (e.g. `src/app/<partner>/page.tsx`). All paths currently share the one access code.

Setup:

- Create a **new, separate** Vercel project for this repository (`JakeKascade/Kascade`). Never reuse or redeploy the ELITA project.
- Framework Next.js, Node 24.x, root `.`; install `npm ci`, build `npm run build` (already in `vercel.json`).
- Set `KASCADE_ACCESS_CODE` (digits) in the project’s environment variables. Without it, the production site stays locked for everyone. Never commit the value or paste it into issues or logs.
- Headers already set: `noindex, nofollow, noarchive`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: private, no-store`.

## About the access code

The code screen keeps the proposal from being sent to anyone without the code: the page HTML is never served before it’s entered, the browser only holds a hash in an httpOnly cookie, and repeated wrong guesses from one address are slowed and then refused for ten minutes. It is a sharing deterrent, not enterprise authentication — anyone given the code and link can open and share it.

## After each deploy

1. Open in a private window: the code screen appears; the proposal does not.
2. Enter the code; check every screen, the calculator and print.
3. Check on a phone, and the headers above.
