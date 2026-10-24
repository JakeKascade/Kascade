# Brand foundation (interim)

The Kascade visual identity for this proposal is deliberately deferred. The page uses a neutral, finished-looking foundation that can be rebranded without touching components.

## Where branding lives

| What | File |
|---|---|
| Colour, surface, accent and shape tokens (dark throughout) | `src/brand/tokens.css` |
| Typefaces (exported as `sans` and `mono`; CSS uses only `--font-sans` / `--font-mono`) | `src/brand/fonts.ts` |
| Names, wordmark text, audience, positioning line, draft status and date | `src/brand/brand.ts` |
| Placeholder logo (typographic “Kascade Studio”) | `src/components/Wordmark.tsx` |
| Favicon | `src/app/icon.svg` |
| Browser theme colour | `src/app/layout.tsx` (`viewport.themeColor`) |

Components never hard-code a colour; `globals.css` refers only to tokens (the print block switches to light values so PDFs stay legible).

## Current choices

- **Type:** Geist Sans and Geist Mono (SIL Open Font License), self-hosted through `next/font` via the `geist` package — no licensed brand fonts, no third-party font requests at runtime.
- **Colour:** dark throughout — near-black background, warm off-white type, restrained greys — with one accent (`#9AA6FF`) used only for Real Coder’s earnings and focus states.

## For the branding pass

1. Replace the token values in `tokens.css` (keep the names).
2. Swap the font exports in `fonts.ts`; confirm web licences for any brand font.
3. Replace `Wordmark` with the approved logo artwork (keep the accessible name).
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.
5. Remove or update `BRAND.status` once the proposal is approved for sharing.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
