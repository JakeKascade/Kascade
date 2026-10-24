# Brand foundation (interim)

The Kascade visual identity for this proposal is deliberately deferred. The page uses a neutral, finished-looking foundation that can be rebranded without touching components.

## Where branding lives

| What | File |
|---|---|
| Colour, surface, accent, chart-series and shape tokens; light, alternate and dark (“ink”) section tones | `src/brand/tokens.css` |
| Typefaces (exported as `sans` and `mono`; CSS uses only `--font-sans` / `--font-mono`) | `src/brand/fonts.ts` |
| Names, wordmark text, audience, positioning line, draft status and date | `src/brand/brand.ts` |
| Placeholder logo (typographic “Kascade Studio”) | `src/components/Wordmark.tsx` |
| Favicon | `src/app/icon.svg` |
| Browser theme colour | `src/app/layout.tsx` (`viewport.themeColor`) |

Components never hard-code a colour; `globals.css` refers only to tokens (the print block restates light values so PDFs stay legible).

## Current choices

- **Type:** Geist Sans and Geist Mono (SIL Open Font License), self-hosted through `next/font` via the `geist` package — no licensed brand fonts, no third-party font requests at runtime.
- **Colour:** off-white paper, charcoal ink, restrained greys, with one accent (`#2E45F0`, lightened to `#8E9BFF` on dark sections) used only for navigation, interaction and Real Coder’s earnings.
- **Charts:** recurring commission uses the accent; one-off commission is deliberately neutral grey. Validated for colour-vision separation and ≥3:1 contrast against the chart surface; identity is also carried by legend, readout and table.

## For the branding pass

1. Replace the token values in `tokens.css` (keep the names).
2. Swap the font exports in `fonts.ts`; confirm web licences for any brand font.
3. Replace `Wordmark` with the approved logo artwork (keep the accessible name).
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.
5. Remove or update `BRAND.status` once the proposal is approved for sharing.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
