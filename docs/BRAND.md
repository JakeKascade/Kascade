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

## Current direction — monochrome

- **Colour:** black, white and greys only. Emphasis is **two-tone text**: the key words in white, the rest in grey (`--mute`, 6:1 on black). Neighbouring screens alternate between two close shades of black (`#000` and `#0A0A0A`) instead of divider lines. `--brand` in `tokens.css` is the single slot for a future brand colour (currently white): it colours Real Coder’s earnings and focus states.
- **Type:** one typeface, **Inter Tight**, at light/regular weights with tight tracking. No serif, mono or display faces. Large type can be light; small text stays at 400 for legibility.
- **Opening screen:** a two-colour pixel field (`src/components/PixelField.tsx`) — light grey (`#EFEFEF`) breaking down into the black page. Outer corners of each shape are rounded and inner corners filleted, so the forms read as smooth stepped shapes. The dark rises into place on load, a few edge cells quietly flip, and the cell under the pointer softly highlights. Text always sits on light cells; still for reduced motion; omitted in print. The header wordmark inverts against whatever is behind it.
- **Shapes:** rounded cards (24px), pill buttons with a round icon, pill steppers. The calculator total sits in the one light card on its screen.
- **Not used:** eyebrows, film grain, glows, hairline frames, dot-matrix numerals.

## For the branding pass

1. **Logo:** put the file in `public/brand/` and replace the text inside `src/components/Wordmark.tsx` with it (keep the accessible name). That updates the header and the access screen.
2. Adjust token values in `tokens.css` if needed (keep the names).
3. Swap fonts in `fonts.ts` if needed; confirm web licences for any non-OFL font.
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.
5. Remove or update `BRAND.status` once the proposal is approved for sharing.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
