# Kascade Studio × Real Coder — Partnership proposal

An interactive partnership proposal for Matt and Sam at Real Coder: Kascade’s services, how referrals work, and a referral-commission calculator.

**Status: working draft (V1).** Pending Callum’s commercial review. Not approved for sharing with Real Coder, and not deployed. Every price and term is a proposal, not an agreement.

## What’s here

- An editorial, panel-by-panel presentation (sticky header, chapter navigation, reading progress, quiet reveals, print/PDF).
- A typed service catalogue — the single source for every price, allowance and term: [`src/data/catalog.ts`](src/data/catalog.ts).
- A pure, deterministic referral model in integer cents: [`src/lib/referral-model.ts`](src/lib/referral-model.ts), with the calculator’s scenario layer in [`src/lib/scenario.ts`](src/lib/scenario.ts).
- The calculator, plus a header **Scenario** drawer that edits the same scenario from anywhere on the page, with JSON/CSV exports.
- An access-code screen (a sharing deterrent, not authentication).
- A neutral, replaceable visual foundation; branding is deliberately deferred.

## Documentation

- [Content architecture and narrative decisions](docs/CONTENT.md)
- [Referral model methodology](docs/MODEL.md)
- [Package scope and proposed terms](docs/PACKAGES.md)
- [Brand foundation and how to rebrand](docs/BRAND.md)
- [Deployment](docs/DEPLOYMENT.md) — preview only with approval
- [Review checklist and test report](docs/REVIEW.md)

## Local development

```sh
npm ci
npm run dev          # http://127.0.0.1:3000 — development access code: 2026
npm test             # referral model, presets and exports
npm run typecheck
npm run build
npm run test:security  # production access gate (needs a build)
npm run test:browser   # Playwright, five viewports
```

Set `KASCADE_ACCESS_CODE` in production (see `.env.example`). Without it, the production site stays locked.
