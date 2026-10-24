# Content architecture

The reader is Matt and Sam at Real Coder. The page is deliberately minimal: dark throughout, nine screens, one job per screen, and headings that say exactly what each screen is.

No eyebrows: each screen has one heading that says exactly what it is.

| # | Heading | The one job |
|---|---|---|
| 1 | Kascade Studio × Real Coder | Your clients’ design department: you introduce, we do the work, you earn 10% |
| 2 | Who does what | Real Coder keeps web/SEO/technical; Kascade only does design |
| 2b | What everyone gains | Three overlapping circles: Real Coder, your clients, Kascade — one line each |
| 3 | Branding & Identity | Price list |
| 4 | Real Estate Campaign Retainers | Price list |
| 5 | Ongoing Design Retainers | Price list |
| 6 | How referrals work | Four steps and two worked payment examples, always visible |
| 7 | Calculate your earnings | How many clients → what Real Coder earns over 12 months |
| 8 | Terms | Seven one-line terms and the one open point |
| 9 | Next steps | Agree → trial for 90 days → review |

## The price-list system

Every service uses the same table: **Package · Price · Real Coder earns**. Each row has a name, a one-line description, the price with its unit (one-off / per month), and Real Coder’s 10% with its unit (once / per month). Add-ons sit at the bottom of their list with a dashed rule and an “Add-on” tag. One fine-print line states the commission rule; full inclusions sit behind a single “What’s included” toggle. Rows come from `src/data/pricing.ts`, which is built from the catalogue.

## Why commission is explained once

“How referrals work” is the only screen that explains the commission rules, with two worked examples (a one-off project and a monthly package). The calculator then only does arithmetic; it doesn’t re-explain anything.

## What was removed in the simplification

Section navigation, the header Scenario drawer, the referral animation, the services overview cards, the “What everyone gains” screen (its useful points became terms), diagrams (overlap, listing lifecycle, capacity bars), tabs, the calculator’s scenario builder, presets, negotiation settings, chart, month table and exports. The referral model still supports deposits, refunds, shorter stays, other horizons and rates; they are tested, just not exposed on the page.

## Copy principles

Plain and specific. “You” is Real Coder, “we” is Kascade. No superlatives, guarantees, invented results or claimed approvals. Everything commercial is marked as proposed.
