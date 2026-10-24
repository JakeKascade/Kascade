"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { money } from "@/lib/model";

/** Eases displayed numbers towards their targets. At rest the output equals the
 * target exactly, so every figure on screen still comes straight from the model. */
export function useTween(target: number[], duration = 650): number[] {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const key = target.join(",");
  useEffect(() => {
    const from = current.current;
    const reduce =
      duration <= 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from.length !== target.length) {
      current.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      const next =
        p < 1 ? target.map((t, i) => from[i] + (t - from[i]) * e) : target;
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
    <span className={className} data-testid={testId}>
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
        height: Math.max(100, Math.round(el.clientHeight)),
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
export function Disclosure({
  label,
  children,
  open,
  onOpenChange,
  className = "",
  id,
}: {
  label: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  id?: string;
}) {
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const bodyId = useId();
  return (
    <div className={`disclosure ${className}`} data-open={isOpen} id={id}>
      <button
        type="button"
        className="disclosure-toggle"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={() => {
          onOpenChange?.(!isOpen);
          if (open === undefined) setOwn(!isOpen);
        }}
      >
        <span>{label}</span>
        <span className="disclosure-icon" aria-hidden="true" />
      </button>
      <div className="disclosure-body" id={bodyId}>
        <div className="disclosure-inner" inert={!isOpen}>
          {children}
        </div>
      </div>
    </div>
  );
}
export function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </svg>
  );
}
