"use client";
import { useRef } from "react";
import { BRAND } from "@/brand/brand";
import PixelField from "../PixelField";

export default function Hero() {
  const copy = useRef<HTMLDivElement>(null);
  return (
    <section id="top" className="screen screen-hero" aria-labelledby="hero-title">
      <PixelField keepClear={copy} />
      <div className="wrap">
        <div className="hero-copy" ref={copy}>
          <h1 id="hero-title">
            {BRAND.studio} <em aria-hidden="true">×</em>
            <span className="sr-only">and</span> {BRAND.partner}
          </h1>
          <p className="hero-line">
            Think of us as your clients’ design department. You introduce them,
            we do the work, and you earn 10% of what they pay.
          </p>
        </div>
      </div>
    </section>
  );
}
