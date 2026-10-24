# Brand foundation (interim)

The Kascade visual identity for this proposal is deliberately deferred. The page uses a neutral, finished-looking foundation that can be rebranded without touching components.

## Where branding lives

| What | File |
|---|---|
| Colour, surface, brand-colour slot and shape tokens | `src/brand/tokens.css` |
| Typeface (`sans` only; CSS uses `--font-sans`) | `src/brand/fonts.ts` |
| Names, wordmark text, audience, positioning line and date | `src/brand/brand.ts` |
| Placeholder logo (typographic “Kascade Studio”) | `src/components/Wordmark.tsx` |
| Favicon | `src/app/icon.svg` |
| Browser theme colour | `src/app/layout.tsx` (`viewport.themeColor`) |

Components never hard-code a colour; `globals.css` refers only to tokens (the print block switches to light values so PDFs stay legible).

## Current direction — blue-grey

- **Logo:** the supplied lockups in `public/brand/` (white for the dark page and the access screen; black for print). The favicon is the mark on charcoal (`src/app/icon.svg`).
- **Partner logo:** Real Coder’s logo (as supplied, unaltered) sits beside Kascade’s as “Kascade × real_coder” in the header, the closing line and the code screen of the `/real-coder` link (`src/components/RealCoderLogo.tsx`). It is inlined, not a public file, so it only appears behind the access code and the bare address never names the partner. On phones the header shows only the lockup.
- **Colour:** blue-black charcoal (`#111317`, raised `#181B21`) with a fine film grain. Text is two-tone: key words white (`#F2F4F6`), the rest blue-grey (`#8A919A`).
- **Background system:** four ingredients, each used sparingly (set per screen with `Screen`’s `tone`, `glow` and `dots` props):

  | Ingredient | Where |
  |---|---|
  | Flat charcoal (`base`) | Opening run (Who does what, What everyone gains), How referrals work, Calculator, Terms |
  | Raised charcoal (`raised`) | The three price lists, as one block |
  | Soft blue glow | Only “What everyone gains” and the Calculator, the two moments to linger on |
  | Dot pattern | Once, on Branding & Identity; desktop only (hidden on phones) |
  | Light (`light`) | Next steps, closing on the opening screen’s pale blue-grey with the black logo |
  | Pixel strip (`PixelBand`) | Wherever the background changes: into the price lists, out of them, and into Next steps |

  The pixel strips share the opening screen’s cell size, rounding and fillets (`src/lib/pixels.ts`), so every change of background steps down in the same rounded cells instead of a hard line.
- **Earnings colour (`--brand`):** the one colour, used only for Real Coder’s earnings — the price-list earnings column, the worked examples and the calculator card. **Chosen: A · Steel blue** `#8DB4E2` (deep `#5D84B3`), confirmed October 2026. The options considered, each a two-value change in `tokens.css`:

  | Option | `--brand` | `--brand-deep` |
  |---|---|---|
  | A · Steel blue (chosen) | `#8DB4E2` | `#5D84B3` |
  | B · Glacier | `#BCD6EE` | `#86A8C9` |
  | C · Sea-glass | `#9AD1C4` | `#5F9A8D` |
  | D · Sage | `#BCCAA9` | `#87977A` |
  | E · Amber | `#E9B872` | `#B8853F` |

- **Type:** one typeface, **Inter Tight**, light (300) for headings with gentle negative tracking (−0.025em), regular for body and small text.
- **Opening screen:** the rounded pixel field (`src/components/PixelField.tsx`), pale blue-grey breaking into charcoal, with the title centred. Every load (refreshes included) opens on solid black, like the code screen, and the black pours away from top to bottom while the title fades in. On phones the dark rises as an even skyline below the text, the two logos sit centred in the black at the foot of the screen, the header becomes a small jump nav (Pricing · Calculator · Terms), and a **View proposal** pill (the shared pill style, in the opening screen’s light colours) fades in after the reveal and glides down to “Who does what” in about a second. Still for reduced motion; omitted in print (as are the strips).
- **Shapes:** glassy rounded cards (16px, hairline border, faint gradient), pill buttons with a round icon, pill steppers; three overlapping outline circles on “What everyone gains”.
- **Not used:** eyebrows, divider lines between screens, serif/mono/display faces.

## For the branding pass

1. **Logo:** replace the SVGs in `public/brand/` (keep the file names).
2. Adjust token values in `tokens.css` if needed (keep the names).
3. Swap fonts in `fonts.ts` if needed; confirm web licences for any non-OFL font.
4. Use only approved and permitted Kascade imagery; Botwright work needs permission first.

No ELITA fonts, logos, artwork, copy or identifying information remain in this repository.
