# Review checklist and test report

## For Callum — commercial placeholders awaiting sign-off

Everything below appears on the page as *proposed* or *provisional*, or is kept off the page.

- [ ] Basic $1,800 / Professional $4,800 scopes and two feedback rounds.
- [ ] Brand Strategy as a $4,000–$6,000 add-on (or partly inside Professional?).
- [ ] Real estate $1,950 / $3,450 / $4,950 for 3 / 6 / 9 new listing campaigns — sustainable given stages, premium properties and backlog? Inclusions are now deliberately open (“standard agency deliverables … and more”); confirm that wording is comfortable.
- [ ] Extra-listing rates ($650 / $575 / $550) or a tier move — **not shown on the page**.
- [ ] Three-month minimum; quarterly volume reconciliation — **not offered on the page**.
- [ ] Agency Marketing Creative +$1,250 for 10 hours (marked *Provisional*).
- [ ] Ongoing design retainers: $1,800 / $3,250 / $4,200 for 12 / 26 / 42 hours ($150 / $125 / $100 an hour). Growth’s $3,250 was set between the two rates — confirm.
- [ ] 10% on projects and on retainers **for as long as the client stays** — now matched to Real Coder’s proposal (was a 12-paid-month cap). Confirm the margin works.
- [ ] Payment within 14 days of month end; six-month registration protection; 90-day pilot.
- [ ] Treatment of upgrades, variations, pauses, cancellations, reactivations and retrospective leads (listed as open).
- [ ] Portfolio examples and Botwright permissions — no imagery is used yet.
- [ ] Any existing client or live-contract conflicts before introductions.
- [ ] Final Kascade branding (see `BRAND.md`).

## Content to double-check

- Real Coder is described only generically (websites, SEO/AEO, hosting and site care, technical delivery).
- Terms 7–8 mirror Real Coder’s proposal: Kascade earns 10% on SEO retainers it refers while they stay active, plus optional cross-promotion. Still subject to a written agreement.

## Test report (this branch)

| Check | Command | Result |
|---|---|---|
| Referral model, catalogue, price lists, calculator (every manual acceptance case in the brief) | `npm test` | **PASS** 20/20 |
| Types | `npm run typecheck` | **PASS** |
| Production build | `npm run build` | **PASS** |
| Production access gate: no proposal before the code, hashed httpOnly Secure cookie, lockout, fails closed with no code configured | `npm run test:security` | **PASS** 2/2 |
| Browser: dark render without errors or sideways scroll, exact headings, uniform price lists from the catalogue, worked examples, calculator totals, keyboard, reduced motion, print, 44px touch targets, landscape phone | `npm run test:browser` | **PASS** 31 passed, 4 skipped by design (phone-only test) |

Viewports: 1440×900, 1280×800, 1280×620, 768×1024, 390×844, plus 844×390 landscape. Screenshots and an A4 print PDF are written to `artifacts/` (git-ignored).

Not yet done: real screen-reader testing; Safari/Firefox runs (tests use Chromium).
