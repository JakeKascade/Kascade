/** The ELITA background texture (fine vertical streaks, per the brand
 * guidelines), drawn as a faint red field. Seeded so it renders identically
 * on the server and in the browser. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = seeded(4057);
const BLOCKS = [
  { x: 40, w: 150, top: 0, bottom: 760 },
  { x: 230, w: 120, top: 120, bottom: 520 },
  { x: 380, w: 170, top: 0, bottom: 820 },
  { x: 250, w: 90, top: 640, bottom: 900 },
];
const LINES = BLOCKS.map((b) =>
  Array.from({ length: Math.round(b.w / 2.2) }, () => {
    const x = b.x + random() * b.w;
    return {
      x: x.toFixed(1),
      y1: (b.top + random() * 60).toFixed(1),
      y2: (b.bottom - random() * 140).toFixed(1),
      width: (0.3 + random() * 1.4).toFixed(2),
      opacity: (0.15 + random() * 0.85).toFixed(2),
    };
  }),
);
// Alternate blocks drift in opposite directions, so the field slowly shifts.
const LAYERS = [0, 1].map((layer) =>
  LINES.filter((_, i) => i % 2 === layer).flat(),
);

export default function BrandTexture() {
  return (
    <svg
      className="brand-texture"
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {LAYERS.map((lines, layer) => (
        <g key={layer} className={`texture-drift texture-drift-${layer}`}>
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x}
              x2={l.x}
              y1={l.y1}
              y2={l.y2}
              strokeWidth={l.width}
              opacity={l.opacity}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
