# Validation record

Validated in the provided Linux cloud workspace with Node 24.19.0, npm 11.9.0, Next.js 16.4.2 and system Chromium. This is a local validation record, not evidence of a hosted preview.

## Automated checks

- Financial/export/access unit suite: **14 passing tests**, including cent-exact allocation, independent settlement timing, delayed reinvestment, full daily ledger reconciliation, cash constraints, monthly demand reset/zero demand, taper/floor, 90/180/365-day fees, exit/wind-down, payout reconciliation, zero margin/low cash, second-half stress, equal-input comparisons and export consistency.
- Browser suite: **15 passing checks**, five scenarios each at desktop (1440px), tablet (768px) and mobile (390px, plus a 320px upper-input-bound check). Includes supplied font/logo loading, overflow and runtime errors; controls and reset; zero-demand and term changes; inspected scenarios and JSON download reconciliation; keyboard operation, reduced motion, print content, and maximum-input payout reconciliation.
- Real production HTTP gate: **2 passing integration tests**. Missing configuration denies the app and assets; configured authentication protects HTML, scripts, RSC, image routes and fonts, including a middleware-header spoof attempt. Valid authentication loads the production application and its protected assets. Random test credentials exist only in the test process and are not saved.
- TypeScript checks and the optimised production build pass.

The browser suite starts this repository's own server on a dedicated port, so a running copy in a different directory cannot produce a false pass. No tests or assertions are disabled.

## Manual checks

- The initial settlement has a hand calculation in `MODEL.md`.
- At day 365 in the default central case, cash + outstanding cost = A$69,849.90 + A$126,674.03 = **A$196,523.93**.
- After wind-down, Jake's A$144,827.16 final payout + ELITA's A$57,238.70 lump sum = **A$202,065.86** fund cash.
- Add ELITA's A$61,240.59 prior withdrawals: **A$263,306.45**, equal to original A$100,000 + A$163,306.45 aggregate trading profit.
- Desktop, tablet and mobile screenshots are generated and visually inspected. The official black logo keeps its proportions. The presentation has no global horizontal overflow; wide financial tables scroll inside their own containers on small screens.
- The print presentation uses A4 pages, selectable text, an exact-current-assumptions summary, a visible methodology, readable financial tables and a final viability section. Browser tests generate a local PDF under the ignored `artifacts/` directory; generated PDFs and screenshots are not committed to GitHub.
- The standalone app is imported into the dedicated ELITA repository root on `codex/elita-interactive-proposal`. No unrelated application or deployment is modified.

## Remaining external prerequisites

- Live-site visual verification is unavailable: the proxy denied `www.elita.net` with CONNECT 403. Supplied brand materials were used instead.
- Confirm Unica77 web-use rights before hosted sharing.
- The user will deploy separately through their connected Vercel integration. No `VERCEL_TOKEN` or direct deployment access is required for development or tests. In Vercel, configure `ELITA_ACCESS_PASSWORD` for Preview and Production; `ELITA_ACCESS_USER` is optional and defaults to `elita`. See `DEPLOYMENT.md`.

Local artifacts contain illustrative, commercially sensitive figures. Keep screenshots, PDF and exported ledgers within the intended private review.
