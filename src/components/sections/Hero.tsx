"use client";
import { useRef } from "react";
import { BRAND } from "@/brand/brand";
import PixelField from "../PixelField";
import { Icon, tone } from "../Primitives";
import RealCoderLogo from "../RealCoderLogo";
import Wordmark from "../Wordmark";

/** Glides the page down to an element: slow out, slow in, about a second. */
function glideTo(target: HTMLElement) {
  const from = window.scrollY;
  const to = from + target.getBoundingClientRect().top;
  const settle = () => {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: to, behavior: "instant" });
    return settle();
  }
  const duration = 1100;
  const ease = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
  let start = 0;
  // The reader can take over at any point.
  const stop = () => {
    start = -1;
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("wheel", stop);
  };
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("wheel", stop, { passive: true });
  const step = (now: number) => {
    if (start < 0) return;
    if (!start) start = now;
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo({ top: from + (to - from) * ease(t), behavior: "instant" });
    if (t < 1) requestAnimationFrame(step);
    else {
      stop();
      settle();
    }
  };
  requestAnimationFrame(step);
}

export default function Hero() {
  const copy = useRef<HTMLDivElement>(null);
  return (
    <section id="top" className="screen screen-hero" aria-labelledby="hero-title">
      <PixelField keepClear={copy} />
      <div className="wrap">
        <div className="hero-copy" ref={copy}>
          <h1 id="hero-title">
            <span className="hi">{BRAND.studio}</span> <span aria-hidden="true">×</span>
            <span className="sr-only">and</span> <span className="hi">{BRAND.partner}</span>
          </h1>
          <p className="hero-line">
            {tone(
              "Think of us as **your clients’ design department**. You introduce them, we do the work, and **you earn 10%** of what they pay.",
            )}
          </p>
          {/* Phones: a clear first step, gliding down to the proposal. */}
          <button
            type="button"
            className="hero-cta"
            onClick={() => {
              const next = document.getElementById("roles");
              if (next) glideTo(next);
            }}
          >
            View proposal
            <span className="hero-cta-icon">
              <Icon name="down" />
            </span>
          </button>
        </div>
      </div>
      {/* Phones: the logos sit centred in the black at the foot of the screen
          (the header carries a small nav instead). The title already names both. */}
      <p className="hero-lockup lockup" aria-hidden="true">
        <Wordmark />
        <span className="lockup-x">×</span>
        <RealCoderLogo />
      </p>
    </section>
  );
}
