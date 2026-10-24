# Kascade Studio × Real Coder — Partnership proposal

An interactive partnership proposal for Matt and Sam at Real Coder: Kascade’s services, how referrals work, and a referral-commission calculator.

**Status: working draft (V1).** Pending Callum’s commercial review. Not approved for sharing with Real Coder. Every price and term is a proposal, not an agreement.

## What’s here

- A minimal, dark, nine-screen presentation: one job and one clear heading per screen, with print/PDF support.
- A typed service catalogue — the single source for every price, allowance and term: [`src/data/catalog.ts`](src/data/catalog.ts) — and one price-list format for all services: [`src/data/pricing.ts`](src/data/pricing.ts).
- A pure, deterministic referral model in integer cents: [`src/lib/referral-model.ts`](src/lib/referral-model.ts), with the calculator’s scenario layer in [`src/lib/scenario.ts`](src/lib/scenario.ts).
- A simple earnings calculator: number of clients per package → Real Coder’s commission over 12 months.
- An access-code screen (a sharing deterrent, not authentication).
- A replaceable interim visual foundation; branding is deliberately deferred.

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
npm test             # referral model, price lists and calculator
npm run typecheck
npm run build
npm run test:security  # production access gate (needs a build)
npm run test:browser   # Playwright, five viewports
```

Set `KASCADE_ACCESS_CODE` in production (see `.env.example`). Without it, the production site stays locked.
