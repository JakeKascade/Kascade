"use client";
import { useEffect, useRef } from "react";
import { BRAND } from "@/brand/brand";
import { PRICE_LISTS } from "@/data/pricing";
import Wordmark from "./Wordmark";
import Calculator from "./sections/Calculator";
import { NextSteps, Terms } from "./sections/Close";
import { Hero, Roles } from "./sections/Intro";
import PriceScreen from "./sections/PriceScreen";
import Referrals from "./sections/Referrals";

export default function Presentation() {
  const progress = useRef<HTMLSpanElement>(null);

  // Marks the page as interactive (used by the browser tests before typing).
  useEffect(() => {
    document.documentElement.dataset.ready = "true";
  }, []);

  // A hairline under the header that fills as the page is read.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const range = el.scrollHeight - window.innerHeight;
      progress.current?.style.setProperty("--progress", String(range > 0 ? Math.min(1, el.scrollTop / range) : 0));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={`${BRAND.studio}, back to the top`}>
          <Wordmark />
        </a>
        <span className="read-progress" ref={progress} aria-hidden="true" />
      </header>
      <main>
        <Hero />
        <Roles />
        {PRICE_LISTS.map((list) => (
          <PriceScreen key={list.id} list={list} />
        ))}
        <Referrals />
        <Calculator />
        <Terms />
        <NextSteps />
      </main>
    </>
  );
}
