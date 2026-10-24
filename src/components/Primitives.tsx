"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { money } from "@/lib/format";

/** Eases displayed numbers towards their targets. At rest the output equals the
 * target exactly, so every figure on screen still comes straight from the model. */
export function useTween(target: number[], duration = 500): number[] {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const key = target.join(",");
  useEffect(() => {
    const from = current.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (duration <= 0 || reduce || from.length !== target.length) {
      current.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      const next = p < 1 ? target.map((t, i) => from[i] + (t - from[i]) * e) : target;
      current.current = next;
      setValue(next);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // The serialised key captures every change to the target values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration]);
  return value;
}

export function Money({ cents, className, testId }: { cents: number; className?: string; testId?: string }) {
  const [shown] = useTween([cents]);
  return (
    <span className={className} data-testid={testId} data-value={cents}>
      {money(Math.round(shown) || 0)}
    </span>
  );
}

/** Sets one word or phrase of a heading in the serif italic. Use once per heading at most. */
export function emphasise(text: string, word?: string): ReactNode {
  const at = word ? text.indexOf(word) : -1;
  if (!word || at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <em>{word}</em>
      {text.slice(at + word.length)}
    </>
  );
}

/** A hairline frame with small + marks at its corners. */
export function Frame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`frame ${className}`}>
      <span className="corner corner-tl" aria-hidden="true" />
      <span className="corner corner-tr" aria-hidden="true" />
      <span className="corner corner-bl" aria-hidden="true" />
      <span className="corner corner-br" aria-hidden="true" />
      {children}
    </div>
  );
}

/** A full-height screen with one clear heading and an optional intro line. */
export function Screen({
  id,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`screen ${className}`} aria-labelledby={`${id}-title`}>
      <div className="wrap">
        <header className="screen-head">
          <h2 id={`${id}-title`} className="title">
            {title}
          </h2>
          {intro && <p className="intro">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Disclosure({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  return (
    <div className="disclosure" data-open={open}>
      <button
        type="button"
        className="disclosure-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        {label}
        <span className="disclosure-icon" aria-hidden="true" />
      </button>
      <div className="disclosure-body" id={bodyId}>
        <div className="disclosure-inner" inert={!open}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Fewer: ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        <Icon name="minus" />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </output>
      <button type="button" aria-label={`More: ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

const ICONS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
} as const;
export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
