# Brand foundation (interim)

The Kascade visual identity for this proposal is deliberately deferred. The page uses a neutral, finished-looking foundation that can be rebranded without touching components.

## Where branding lives

| What | File |
|---|---|
| Colour, surface, brand-colour slot and shape tokens | `src/brand/tokens.css` |
| Typeface (`sans` only; CSS uses `--font-sans`) | `src/brand/fonts.ts` |
| Names, wordmark text, audience, positioning line, draft status and date | `src/brand/brand.ts` |
| Placeholder logo (typographic “Kascade Studio”) | `src/components/Wordmark.tsx` |
| Favicon | `src/app/icon.svg` |
| Browser theme colour | `src/app/layout.tsx` (`viewport.themeColor`) |

Components never hard-code a colour; `globals.css` refers only to tokens (the print block switches to light values so PDFs stay legible).

## Current direction — blue-grey

- **Logo:** the supplied lockups in `public/brand/` (white for the dark page and the access screen; black for print). The favicon is the mark on charcoal (`src/app/icon.svg`).
- **Colour:** blue-black charcoal (`#111317` / `#15181D` on alternating screens), each screen with one soft blue light in a corner, a faint dot pattern fading out of some corners, and a fine film grain. Text is two-tone: key words white (`#F2F4F6`), the rest blue-grey (`#8A919A`).
- **Earnings colour (`--brand`):** the one colour, used only for Real Coder’s earnings — the price-list earnings column, the worked examples and the calculator card. Currently **A · Steel blue** `#8DB4E2` (deep `#5D84B3`). Alternatives, each a two-value change in `tokens.css`:

  | Option | `--brand` | `--brand-deep` |
  |---|---|---|
  | A · Steel blue (current) | `#8DB4E2` | `#5D84B3` |
  | B · Glacier | `#BCD6EE` | `#86A8C9` |
  | C · Sea-glass | `#9AD1C4` | `#5F9A8D` |
  | D · Sage | `#BCCAA9` | `#87977A` |
  | E · Amber | `#E9B872` | `#B8853F` |

- **Type:** one typeface, **Inter Tight**, light (300) for headings with gentle negative tracking (−0.025em), regular for body and small text.
- **Opening screen:** the rounded pixel field (`src/components/PixelField.tsx`), pale blue-grey breaking into charcoal. Still for reduced motion; omitted in print.
- **Shapes:** glassy rounded cards (16px, hairline border, faint gradient), pill buttons with a round icon, pill steppers; three overlapping outline circles on “What everyone gains”.
- **Not used:** eyebrows, divider lines between screens, serif/mono/display faces.

## For the branding pass

1. **Logo:** replace the SVGs in `public/brand/` (keep the file names).
2. Adjust token values in `tokens.css` if needed (keep the names).
3. Swap fonts in `fonts.ts` if needed; confirm web licences for any non-OFL font.
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.
5. Remove or update `BRAND.status` once the proposal is approved for sharing.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
