# ELITA — A Potential Partnership

Standalone ELITA capital partnership presentation and interactive 12-month financial simulator.

**Live site:** https://elita-capital-simulator.vercel.app

**Access:** no application username or password. The site is accessible by link; search engines are discouraged from indexing it, but this does not make the information private.

## Deployment

GitHub: `JakeKascade/elita-capital-simulator` (`main`).
Vercel: `elita-capital-simulator`, Next.js, Node 24.x, project root `.`.
Commands are set in `vercel.json`. The deployment requires no application credentials or other secrets.

## Local development

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run test:security
npm run test:browser
```

## Included functionality

- ELITA-branded presentation with its authorised supplied logo and colour system; system fonts are used in place of the proprietary font binaries while public web-hosting rights are unverified.
- Interactive initial capital, net trading margin, utilisation, settlement period, term and demand controls.
- Three settlement scenarios, fund growth and profit allocation charts.
- Jake's and ELITA's individual capital, profit, withdrawals, availability fee and exit payouts.
- Assumption and viability disclosures, JSON/CSV exports and print view.
- Public access without a username or password; noindex/nofollow metadata and no-referrer headers.

The financial projections are hypothetical, before tax, foreign exchange movements, general overhead and credit risk. See [the model methodology](docs/MODEL.md), [brand provenance and licensing](docs/BRAND.md), [deployment details](docs/DEPLOYMENT.md), and [validation](docs/VALIDATION.md).

**Brand licensing:** The provided Unica77 and Optician font files were removed from the deployable public folder. Verify the corresponding webfont licence before reusing them on an open site.
