"use client";
import { useRef } from "react";
import { BRAND } from "@/brand/brand";
import PixelField from "../PixelField";
import { tone } from "../Primitives";

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
        </div>
      </div>
    </section>
  );
}
