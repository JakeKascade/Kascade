"use client";
import { useId, useState, type CSSProperties } from "react";
import type { Face, Pairing } from "@/app/type/fonts";

const WEIGHTS = [300, 400, 500, 600, 700];

type Choice = { sans: string; serif: string | null; weight: number; numerals: string };

/** One proposal-like specimen: the light opening line, then a dark screen. */
function Sample({ choice, faces, compact = false }: { choice: Choice; faces: Record<string, Face>; compact?: boolean }) {
  const sans: CSSProperties = { fontFamily: faces[choice.sans].family };
  const heading: CSSProperties = { ...sans, fontWeight: choice.weight };
  const serif: CSSProperties | undefined = choice.serif
    ? { fontFamily: faces[choice.serif].family, fontStyle: "italic", fontWeight: 400 }
    : undefined;
  const em = (word: string) => (serif ? <em style={serif}>{word}</em> : word);
  const numerals: CSSProperties = { fontFamily: faces[choice.numerals].family };
  return (
    <div className={`tb-sample ${compact ? "tb-compact" : ""}`} style={sans}>
      <div className="tb-light">
        <p className="tb-h1" style={heading}>
          Kascade Studio {serif ? <em style={serif}>×</em> : "×"} Real Coder
        </p>
        <p className="tb-line">
          Think of us as your clients’ design department. You introduce them,
          we do the work, and you earn 10% of what they pay.
        </p>
      </div>
      <div className="tb-dark">
        <p className="tb-h2" style={heading}>
          Calculate your {em("earnings")}
        </p>
        <p className="tb-body">Choose how many clients you might refer in a year.</p>
        <div className="tb-row">
          <span>
            <strong style={{ fontWeight: Math.max(500, choice.weight) }}>Professional Branding</strong>
            <small>Two directions, a full logo system and guidelines</small>
          </span>
          <span className="tb-num">$4,800</span>
          <span className="tb-num tb-accent">$480</span>
        </div>
        <div className="tb-figures">
          <span className="tb-big" style={heading}>
            $4,620
          </span>
          <span className="tb-steps" style={numerals}>
            01 02 03 04
          </span>
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="tb-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TypeBoard({
  sans,
  serifs,
  numerals,
  pairings,
}: {
  sans: Face[];
  serifs: Face[];
  numerals: Face[];
  pairings: Pairing[];
}) {
  const faces = Object.fromEntries([...sans, ...serifs, ...numerals].map((f) => [f.code, f]));
  const [choice, setChoice] = useState<Choice>({ sans: "S1", serif: "R1", weight: 500, numerals: "N1" });
  const set = (patch: Partial<Choice>) => setChoice((c) => ({ ...c, ...patch }));
  const code = `${choice.sans}${choice.serif ? ` + ${choice.serif}` : ""} @${choice.weight} · ${choice.numerals}`;
  const tryOut = (patch: Partial<Choice>) => {
    set(patch);
    document.getElementById("tester")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="tb">
      <header className="tb-intro">
        <h1>Typography study</h1>
        <p>
          Mix and match on real proposal content. Reply with the codes you
          like, for example <code>P2</code> or <code>S3 + R1 @500</code>. All
          fonts here are free to use (Open Font License).
        </p>
      </header>

      <section id="tester" className="tb-section" aria-labelledby="tester-title">
        <h2 id="tester-title">Tester</h2>
        <div className="tb-controls">
          <Select
            label="Sans"
            value={choice.sans}
            options={sans.map((f) => ({ value: f.code, label: `${f.code} · ${f.name}` }))}
            onChange={(v) => set({ sans: v })}
          />
          <Select
            label="Serif accent"
            value={choice.serif ?? "none"}
            options={[
              { value: "none", label: "None" },
              ...serifs.map((f) => ({ value: f.code, label: `${f.code} · ${f.name}` })),
            ]}
            onChange={(v) => set({ serif: v === "none" ? null : v })}
          />
          <Select
            label="Numerals"
            value={choice.numerals}
            options={numerals.map((f) => ({ value: f.code, label: `${f.code} · ${f.name}` }))}
            onChange={(v) => set({ numerals: v })}
          />
          <fieldset className="tb-weights">
            <legend>Heading weight</legend>
            {WEIGHTS.map((w) => (
              <button key={w} type="button" aria-pressed={choice.weight === w} onClick={() => set({ weight: w })}>
                {w}
              </button>
            ))}
          </fieldset>
        </div>
        <p className="tb-code" aria-live="polite">
          {code}
        </p>
        <Sample choice={choice} faces={faces} />
      </section>

      <section className="tb-section" aria-labelledby="pairings-title">
        <h2 id="pairings-title">Pairings</h2>
        <div className="tb-grid">
          {pairings.map((p) => (
            <article key={p.code} className="tb-card">
              <header>
                <strong>{p.code}</strong>
                <span>
                  {faces[p.sans].name}
                  {p.serif ? ` + ${faces[p.serif].name}` : ""} · {p.weight}
                </span>
                <button type="button" onClick={() => tryOut({ sans: p.sans, serif: p.serif, weight: p.weight })}>
                  Try in tester
                </button>
              </header>
              <p className="tb-note">{p.note}</p>
              <Sample choice={{ sans: p.sans, serif: p.serif, weight: p.weight, numerals: choice.numerals }} faces={faces} compact />
            </article>
          ))}
        </div>
      </section>

      <section className="tb-section" aria-labelledby="sans-title">
        <h2 id="sans-title">Sans, by weight</h2>
        {sans.map((f) => (
          <article key={f.code} className="tb-specimen" style={{ fontFamily: f.family }}>
            <header>
              <strong>{f.code}</strong>
              <span>{f.name}</span>
              <small>{f.note}</small>
              <button type="button" onClick={() => tryOut({ sans: f.code })}>
                Try in tester
              </button>
            </header>
            <div className="tb-weights-row">
              {WEIGHTS.map((w) => (
                <p key={w} style={{ fontWeight: w }}>
                  <span>{w}</span>
                  Branding &amp; Identity
                </p>
              ))}
            </div>
            <p className="tb-specimen-body">
              Real Coder keeps all web, SEO and technical work. Kascade only does
              design. $1,800 · $4,800 · $4,620 · 12 months
            </p>
          </article>
        ))}
      </section>

      <section className="tb-section" aria-labelledby="serif-title">
        <h2 id="serif-title">Serif accents</h2>
        <p className="tb-hint">Shown with the tester’s sans ({faces[choice.sans].name}).</p>
        <div className="tb-grid">
          {serifs.map((f) => (
            <article key={f.code} className="tb-card tb-serif">
              <header>
                <strong>{f.code}</strong>
                <span>{f.name}</span>
                <button type="button" onClick={() => tryOut({ serif: f.code })}>
                  Try in tester
                </button>
              </header>
              <p className="tb-note">{f.note}</p>
              <p className="tb-h2" style={{ fontFamily: faces[choice.sans].family, fontWeight: choice.weight }}>
                How{" "}
                <em style={{ fontFamily: f.family, fontStyle: "italic", fontWeight: 400 }}>referrals</em>{" "}
                work
              </p>
              <p className="tb-alphabet" style={{ fontFamily: f.family }}>
                <span>Kascade Studio</span> <em>Kascade Studio</em>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="tb-section" aria-labelledby="numerals-title">
        <h2 id="numerals-title">Numerals</h2>
        <div className="tb-grid">
          {numerals.map((f) => (
            <article key={f.code} className="tb-card">
              <header>
                <strong>{f.code}</strong>
                <span>{f.name}</span>
                <button type="button" onClick={() => tryOut({ numerals: f.code })}>
                  Try in tester
                </button>
              </header>
              <p className="tb-note">{f.note}</p>
              <p className="tb-numerals" style={{ fontFamily: f.family }}>
                01 02 03 04
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
