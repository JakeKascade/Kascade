# Brand foundation (interim)

The Kascade visual identity for this proposal is deliberately deferred. The page uses a neutral, finished-looking foundation that can be rebranded without touching components.

## Where branding lives

| What | File |
|---|---|
| Colour, surface, accent, glow and shape tokens | `src/brand/tokens.css` |
| Typefaces (`sans`, `serif`, `mono`, `dots`; CSS uses only the matching `--font-*` variables) | `src/brand/fonts.ts` |
| Names, wordmark text, audience, positioning line, draft status and date | `src/brand/brand.ts` |
| Placeholder logo (typographic “Kascade Studio”) | `src/components/Wordmark.tsx` |
| Favicon | `src/app/icon.svg` |
| Browser theme colour | `src/app/layout.tsx` (`viewport.themeColor`) |

Components never hard-code a colour; `globals.css` refers only to tokens (the print block switches to light values so PDFs stay legible).

## Current direction

- **Opening screen:** a two-colour pixel field (`src/components/PixelField.tsx`). Light cream cells at the top break down into the dark page below, with small minesweeper-style counts beside the dark cells. The dark rises into place on load, a few edge cells quietly flip, and the cell under the pointer lights up in sea-glass. The text always sits on light cells. It pauses off-screen, is still for reduced motion, and is omitted in print. The header wordmark blends with whatever is behind it, so it reads on both colours.
- **Colour:** warm near-black (`#15130F`), cream (`#ECE7DE` for the light field, `#F2EDE4` for type on dark), warm stone greys, and one accent — **sea-glass** (`#A8D8CC`; `#3F6E66` on light), used for step numerals, Real Coder’s earnings, the pointer cell and focus. Each dark screen has one very soft sea-glass light; a fine film grain sits over everything.
- **Type — under review:** currently Geist Sans, Instrument Serif italic for one word per heading, Geist Mono for labels and Doto for step numerals. The **typography study at `/type`** compares 8 sans, 6 serifs and 4 numeral styles, with curated pairings and a live tester. Once a combination is chosen, swap it in `src/brand/fonts.ts`.
- **Structure:** no eyebrows; one heading per screen. Hairline frames with small `+` marks at the corners, square marks rather than pills, 4px corners.

## For the branding pass

1. **Logo:** put the file in `public/brand/` and replace the text inside `src/components/Wordmark.tsx` with it (keep the accessible name). That updates the header and the access screen.
2. Adjust token values in `tokens.css` if needed (keep the names).
3. Swap fonts in `fonts.ts` if needed; confirm web licences for any non-OFL font.
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.
5. Remove or update `BRAND.status` once the proposal is approved for sharing.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
