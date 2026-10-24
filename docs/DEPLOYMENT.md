# ELITA — Vercel Deployment

The project is deployed from the private GitHub repository `JakeKascade/elita-capital-simulator`, production branch `main`, under the separate Vercel project `elita-capital-simulator`.

- Framework: Next.js; Node.js 24.x; root `.`
- Install: `npm ci`; build: `npm run build`
- Site address: https://elita-capital-simulator.vercel.app
- **Public, link-accessible application:** there is no application username, password, login or required access environment variable.
- `ELITA_ACCESS_PASSWORD` and `ELITA_ACCESS_USER` are obsolete and may be deleted from Vercel settings.
- Search crawlers are discouraged by noindex/nofollow headers and metadata. This is **not** private access: anyone with the URL can open the proposal. Avoid including live deal or customer data.

## Brand assets
The official ELITA logo and original supplied Optician Sans and Unica77 typography are retained. The site owner has confirmed approval to use the supplied fonts on the web. The original font files are served as public assets so browsers can load the branded typography.

## Verification
After the main-branch deployment completes:
1. Open the homepage in a fresh private/incognito browser window. The presentation must load without a username or password.
2. Check controls, graphs, payout calculations, export and mobile layout.
3. Verify /brand/elita-logo.png and the supplied Optician Sans and Unica77 webfont paths load successfully (200).
4. Check noindex, frame-denial and no-referrer headers.

No production environment keys, database or external APIs are required to calculate the simulator's hypothetical projections.
