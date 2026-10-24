# Review checklist and test report

## For Callum — commercial placeholders awaiting sign-off

Everything below appears on the page as *proposed* or *provisional*, or is kept off the page.

- [ ] Basic $2,000 / Professional $4,000 scopes and two feedback rounds.
- [ ] Brand Strategy as a $4,000–$6,000 add-on (or partly inside Professional?). The calculator models $5,000 by default, adjustable $4,000–$6,000.
- [ ] Real estate $1,950 / $3,450 / $4,950 for 3 / 6 / 9 new listing campaigns — sustainable given stages, premium properties and backlog?
- [ ] Extra-listing rates ($650 / $575 / $550) or a tier move — **not shown on the page**.
- [ ] Three-month minimum; quarterly volume reconciliation — **not offered on the page**.
- [ ] Agency Marketing Creative +$1,250 for 10 hours (marked *Provisional*).
- [ ] Creative Partner capacity 12 / 26 / 42 hours.
- [ ] 10% on projects; 10% on the **first 12 paid months** of retainers vs Real Coder’s ongoing-commission model (named openly under “To agree together”).
- [ ] Payment within 14 days of month end; six-month registration protection; 90-day pilot.
- [ ] Treatment of upgrades, variations, pauses, cancellations, reactivations and retrospective leads (listed as open).
- [ ] Portfolio examples and Botwright permissions — no imagery is used yet.
- [ ] Any existing client or live-contract conflicts before introductions.
- [ ] Final Kascade branding (see `BRAND.md`).

## Content to double-check

- The “Think of clients who are…” signals on the services overview are Kascade’s descriptions of good-fit clients, not claims about Real Coder’s client base.
- Real Coder is described only generically (websites, SEO/AEO, hosting and site care, technical delivery).
- The reciprocal referral line says Kascade → Real Coder terms “would be confirmed alongside this agreement”; it doesn’t accept Real Coder’s proposal.

## Test report (24 October 2026, this branch)

| Check | Command | Result |
|---|---|---|
| Referral model, catalogue, presets, exports (20 tests, every manual acceptance case in the brief) | `npm test` | **PASS** 20/20 |
| Types | `npm run typecheck` | **PASS** |
| Production build | `npm run build` | **PASS** |
| Production access gate: no proposal before the code, hashed httpOnly Secure cookie, lockout, fails closed with no code configured | `npm run test:security` | **PASS** 2/2 |
| Browser: render without errors or sideways scroll, catalogue-driven prices, calculator ↔ chart ↔ table ↔ header ↔ JSON/CSV reconciliation, line editing and 10+ fee rule, Scenario drawer persistence and focus, flow split, keyboard tabs and chart, reduced motion, print, 44px touch targets, landscape phone | `npm run test:browser` | **PASS** 33 passed, 12 skipped by design (interaction tests run once at desktop; touch-target test on phone only) |

Viewports: 1440×900, 1280×800, 1280×620 (short laptop), 768×1024 (tablet), 390×844 (iPhone 13), plus 844×390 landscape. Full-page and calculator screenshots and an A4 print PDF are written to `artifacts/` (git-ignored) on each run.

Not yet done: assistive-technology testing with a real screen reader; Safari/Firefox runs (tests use Chromium); visual-regression baselines (deferred until branding settles).
