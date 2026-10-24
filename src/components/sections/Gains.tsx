"use client";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/brand/brand";
import { Screen, tone } from "../Primitives";

const CIRCLES = [
  { name: BRAND.partner, text: "**10% commission** on every referral, without adding headcount." },
  { name: "Your clients", text: "**A brand, website and marketing** that finally work together." },
  { name: "Kascade", text: "**Clients who need design**, and a trusted partner for web and SEO." },
];

/** Three overlapping circles: they start together and spread into place
 * when the screen arrives, then a dot quietly orbits each one. */
export default function Gains() {
  const figure = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = figure.current;
    if (!el || !("IntersectionObserver" in window)) return setInView(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <Screen id="gains" centered glow="50% 42%" title={tone("**What everyone** gains")}>
      <div className="gains">
        <ul className="circles" ref={figure} data-in={inView} aria-hidden="true">
          {CIRCLES.map((c, i) => (
            <li key={c.name} data-centre={i === 1 || undefined} style={{ ["--i" as string]: i - 1 }}>
              <i className="orbit" />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
        <dl className="gains-list">
          {CIRCLES.map((c) => (
            <div key={c.name}>
              <dt>{c.name}</dt>
              <dd>{tone(c.text)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Screen>
  );
}
