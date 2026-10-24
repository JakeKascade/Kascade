# ELITA — A Potential Partnership

Standalone ELITA capital partnership presentation and interactive 12-month financial simulator.

**Live site:** https://elita-capital-simulator.vercel.app

**Access:** a confidential code screen, not an account system. Visitors enter one shared numeric code (default `1991`); the server checks it and sets a 30-day httpOnly cookie holding only a hash of the code. Without that cookie the proposal page is never sent. To change the code, set `ELITA_ACCESS_CODE` (digits only; 4 to 8 work best, and the screen shows one box per digit) in the Vercel project's environment variables and redeploy; changing it signs everyone out. After five wrong codes from one address in ten minutes, further attempts are refused until the ten minutes pass. That limit is held in server memory, so treat it as a brake on scripted guessing, not a guarantee; a longer code is the stronger protection. Search engines are still discouraged from indexing the site.

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

- ELITA-branded presentation with its authorised supplied logo and colour system; the original supplied Optician Sans and Unica77 typography is retained with the user's confirmation of web-use approval.
- Interactive initial capital, net trading margin, utilisation, settlement period, term and demand controls.
- Three settlement scenarios, fund growth and profit allocation charts.
- Jake's and ELITA's individual capital, profit, withdrawals, availability fee and exit payouts.
- Assumption and viability disclosures, JSON/CSV exports and print view.
- A shared access-code screen (no usernames or passwords); noindex/nofollow metadata and no-referrer headers.

The financial projections are hypothetical, before tax, foreign exchange movements, general overhead and credit risk. See [the model methodology](docs/MODEL.md), [brand provenance and licensing](docs/BRAND.md), [deployment details](docs/DEPLOYMENT.md), and [validation](docs/VALIDATION.md).

**Typography:** The original supplied Unica77 and Optician Sans fonts are retained for the public ELITA-branded presentation. The site owner has confirmed approval for their web use.
