/**
 * Small dot-matrix pictograms (7 × 7), echoing the pixel field. "x" marks a
 * lit dot; the rest of the grid shows faintly.
 */
const ICONS = {
  website: ["xxxxxxx", "x.x.x.x", "xxxxxxx", "x.....x", "x.xxx.x", "x.....x", "xxxxxxx"],
  search: [".xxx...", "x...x..", "x...x..", "x...x..", ".xxx...", ".....x.", "......x"],
  ads: ["x......", "xx.....", "x.x....", "x..x...", "x.xxx..", "xx.x...", "....x.."],
  brand: ["...x...", "..xxx..", ".x.x.x.", "xxx.xxx", ".x.x.x.", "..xxx..", "...x..."],
  house: ["...x...", "..x.x..", ".x...x.", "xxxxxxx", ".x...x.", ".x.xxx.", ".x.xxx."],
  ongoing: [".x...x.", "xxxxxxx", "x.....x", "x.x.x.x", "x.....x", "x.x.x.x", "xxxxxxx"],
} as const;
export type DotIconName = keyof typeof ICONS;

export default function DotIcon({ name }: { name: DotIconName }) {
  const rows = ICONS[name];
  return (
    <svg className="dot-icon" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      {rows.flatMap((row, y) =>
        [...row].map((c, x) => (
          <circle key={`${x}-${y}`} cx={2 + x * 4} cy={2 + y * 4} r={c === "x" ? 1.45 : 0.75} data-on={c === "x" || undefined} />
        )),
      )}
    </svg>
  );
}
