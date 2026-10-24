# Vercel deployment through the connected ChatGPT integration

Application development, verification and GitHub delivery do not require a `VERCEL_TOKEN` or a Vercel login in this workspace. Use the user's connected Vercel integration for deployment. No deployment or DNS change is performed by the application's build or tests.

## Import settings

| Setting | Value |
| --- | --- |
| Repository | `JakeKascade/elita-capital-simulator` |
| Branch | `codex/elita-interactive-proposal` |
| Root directory | `.` |
| Project | Create a separate ELITA capital simulator project |
| Framework | Next.js |
| Node.js | 24.x, declared in `package.json` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Next.js default; leave unset |

`vercel.json` declares the framework and install/build commands. The lockfile pins the dependency tree. This is a server-rendered Next.js deployment, not a static export. Do not bypass `src/proxy.ts` or publish a raw `.next` folder.

## Application access settings

Configure the following **securely in Vercel** for both Preview and Production:

| Variable | Required | Purpose |
| --- | --- | --- |
| `ELITA_ACCESS_PASSWORD` | Yes | A strong, private password for this presentation |
| `ELITA_ACCESS_USER` | No | Login name; defaults to `elita` |

These are server-only variables. Do not prefix them with `NEXT_PUBLIC_`, commit values, paste credentials into chat, or include passwords in build arguments. `.env.example` contains names only. Redeploy after changing Vercel environment settings so the selected deployment receives them.

The app needs no database, API service, customer data or further runtime keys. Enable Vercel Deployment Protection where supported by the account as an additional control. Use HTTPS for browser HTTP Basic authentication.

## Suggested integration instruction

> Deploy `JakeKascade/elita-capital-simulator` from branch `codex/elita-interactive-proposal`, root directory `.`, as a separate Next.js Vercel project using Node 24.x and the checked-in `vercel.json`. Configure `ELITA_ACCESS_PASSWORD` securely for Preview and Production before sharing the URL; the username defaults to `elita`. Keep the application's password protection enabled and use Vercel Deployment Protection where available. Do not modify another production project or DNS. Return the preview URL and deployed commit SHA.

## Expected access behaviour

- Missing production password: all routes return **503**, with no presentation exposed. This means access configuration is incomplete; it is not a failed Next.js build.
- Configured password, unauthenticated browser: **401** with a login challenge.
- Valid credentials: the interactive application and its assets load.
- Protection includes HTML, React Server Component requests, scripts, image routes, fonts and other public assets.
- Private/no-store responses, noindex/nofollow metadata, no-referrer and frame-denial headers supplement the authentication gate.
- Only local loopback development without `VERCEL` can run without a password. The development command binds to loopback.

This is shared-secret access, not per-user identity management. A browser may retain HTTP Basic credentials until its session closes. Share credentials through a suitable private channel. The app has no analytics or outbound data collection.

## Verify the deployed preview before sharing

1. Confirm the Vercel project, source branch and deployed commit SHA match the intended separate application.
2. In a fresh unauthenticated session, confirm a login challenge appears before the presentation.
3. Confirm direct requests for `/brand/Unica77LLTT-Regular.ttf`, `/brand/elita-logo.png` and a real `/_next/static/…js` file also require authentication.
4. With access, change capital and settlement assumptions, check updated chart/payout values, enable zero purchasing demand, reset defaults and test JSON/CSV exports and Print/PDF.
5. Check desktop and mobile layouts, then share only the protected URL and credentials through the intended private channels.

The local production tests verify the access gate; they do not assert that a future Vercel deployment has been configured correctly. The supplied font files' web-use rights remain as documented in `BRAND.md`; do not silently replace or redraw the official assets.
