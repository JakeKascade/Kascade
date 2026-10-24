"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { money } from "@/lib/format";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases displayed numbers towards their targets. At rest the output equals the
 * target exactly, so every figure on screen still comes straight from the model. */
export function useTween(target: number[], duration = 600): number[] {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const key = target.join(",");
  useEffect(() => {
    const from = current.current;
    if (duration <= 0 || prefersReducedMotion() || from.length !== target.length) {
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

export function Money({
  cents,
  className,
  testId,
  duration,
}: {
  cents: number;
  className?: string;
  testId?: string;
  duration?: number;
}) {
  const [shown] = useTween([cents], duration);
  return (
    <span className={className} data-testid={testId} data-value={cents}>
      {money(Math.round(shown) || 0)}
    </span>
  );
}

/** Tracks an element's rendered size, so a chart can draw to fill its frame. */
export function useSize(
  ref: RefObject<HTMLElement | null>,
  fallback: { width: number; height: number },
) {
  const [size, setSize] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setSize({
        width: Math.max(240, Math.round(el.clientWidth)),
        height: Math.max(120, Math.round(el.clientHeight)),
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/** True while the element is at least `threshold` visible. */
export function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.35) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

export function Disclosure({
  label,
  children,
  className = "",
  defaultOpen = false,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <div className={`disclosure ${className}`} data-open={open}>
      <button
        type="button"
        className="disclosure-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(!open)}
      >
        <span>{label}</span>
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

/** Accessible tabs: arrow keys move between tabs, each tab owns one panel. */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  className = "",
  idPrefix,
}: {
  label: string;
  tabs: readonly { id: T; label: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  idPrefix: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next = index;
    if (e.key in moves) next = (index + moves[e.key] + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${t.id}`}
          aria-controls={`${idPrefix}-panel-${t.id}`}
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
export function TabPanel({
  idPrefix,
  id,
  active,
  children,
  className = "",
}: {
  idPrefix: string;
  id: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      className={`tab-panel ${className}`}
      data-hidden={!active}
      hidden={!active}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

export function Stepper({
  id,
  label,
  value,
  min,
  max,
  onChange,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  unit?: (n: number) => string;
}) {
  return (
    <div className="stepper" role="group" aria-labelledby={`${id}-label`}>
      <span className="sr-only" id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        aria-label={`Fewer: ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon name="minus" />
      </button>
      <output id={id} aria-live="polite">
        <strong>{value}</strong>
        {unit && ` ${unit(value)}`}
      </output>
      <button
        type="button"
        aria-label={`More: ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}

const ICONS = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  down: "M12 4v15m-6-6 6 6 6-6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17 19 7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  sliders: "M4 7h10M18 7h2M4 12h4M12 12h8M4 17h9M17 17h3",
  print: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
} as const;
export function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
      {name === "sliders" && (
        <>
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="15" cy="17" r="2" />
        </>
      )}
    </svg>
  );
}

/** "Proposed" marker for terms that are not agreed. */
export function Proposed({ children = "Proposed" }: { children?: ReactNode }) {
  return <span className="proposed">{children}</span>;
}
