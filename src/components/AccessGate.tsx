"use client";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "checking" | "wrong" | "locked" | "open";

/** A slowly turning wireframe globe, drawn in faint ELITA red. */
function Globe({ spin }: { spin: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const speed = useRef(spin);
  speed.current = spin;
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = 0,
      height = 0,
      dpr = 1,
      frame = 0,
      angle = 0.6,
      last = performance.now();
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = el.clientWidth;
      height = el.clientHeight;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
    };
    const tilt = 0.38;
    const project = (
      lat: number,
      lon: number,
      r: number,
      cx: number,
      cy: number,
    ) => {
      const x = Math.cos(lat) * Math.sin(lon),
        y = Math.sin(lat),
        z = Math.cos(lat) * Math.cos(lon);
      const x1 = x * Math.cos(angle) + z * Math.sin(angle),
        z1 = -x * Math.sin(angle) + z * Math.cos(angle);
      const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt),
        z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
      return { x: cx + r * x1, y: cy - r * y2, z: z2 };
    };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const r = Math.max(height * 0.95, Math.min(width * 0.46, height * 1.5));
      const cx = width / 2,
        cy = height + r * 0.22;
      const front = new Path2D(),
        back = new Path2D();
      const line = (points: { x: number; y: number; z: number }[]) => {
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i];
          const path = (a.z + b.z) / 2 >= 0 ? front : back;
          path.moveTo(a.x, a.y);
          path.lineTo(b.x, b.y);
        }
      };
      const step = Math.PI / 90;
      for (let lat = -75; lat <= 75; lat += 15) {
        const pts = [];
        for (let lon = 0; lon <= Math.PI * 2 + 1e-6; lon += step)
          pts.push(project((lat * Math.PI) / 180, lon, r, cx, cy));
        line(pts);
      }
      for (let lon = 0; lon < 360; lon += 15) {
        const pts = [];
        for (let lat = -Math.PI / 2; lat <= Math.PI / 2 + 1e-6; lat += step)
          pts.push(project(lat, (lon * Math.PI) / 180, r, cx, cy));
        line(pts);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(237, 28, 36, 0.09)";
      ctx.stroke(back);
      ctx.strokeStyle = "rgba(237, 28, 36, 0.38)";
      ctx.stroke(front);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(237, 28, 36, 0.45)";
      ctx.stroke();
    };
    const tick = (now: number) => {
      angle += ((now - last) / 1000) * 0.06 * speed.current;
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(el);
    if (reduce) draw();
    else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return <canvas ref={canvas} className="gate-globe" aria-hidden="true" />;
}

export default function AccessGate({ length }: { length: number }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const input = useRef<HTMLInputElement>(null);

  const submit = async (value: string) => {
    setStatus("checking");
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value }),
    }).catch(() => null);
    if (response?.ok) {
      setStatus("open");
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // Let the digits roll away before the proposal loads.
      setTimeout(() => window.location.replace("/"), reduce ? 0 : 1300);
      return;
    }
    setStatus(response?.status === 429 ? "locked" : "wrong");
    setTimeout(() => {
      setCode("");
      input.current?.focus();
    }, 650);
  };
  const onChange = (raw: string) => {
    if (status === "checking" || status === "open") return;
    const next = raw.replace(/\D/g, "").slice(0, length);
    setCode(next);
    if (status === "wrong" || status === "locked") setStatus("idle");
    if (next.length === length) submit(next);
  };

  return (
    <main
      className="gate"
      data-status={status === "locked" ? "wrong" : status}
      style={{ ["--slots" as string]: length }}
    >
      <div className="gate-content">
        {/* Supplied ELITA artwork, reproduced in white as the brand guidelines permit. */}
        <img
          className="gate-logo"
          src="/brand/elita-logo-white.png"
          alt="ELITA"
          width="132"
          height="20"
        />
        <p className="gate-kicker">
          Private <span aria-hidden="true">•</span> Confidential
        </p>
        <h1 className="gate-title">Enter your access code</h1>
        <label className="gate-code" htmlFor="access-code">
          <span className="sr-only">Access code, {length} digits</span>
          <input
            ref={input}
            id="access-code"
            className="gate-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={length}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            aria-invalid={status === "wrong" || status === "locked"}
            aria-describedby="access-status"
          />
          <span className="gate-slots" aria-hidden="true">
            {Array.from({ length }, (_, i) => (
              <span
                key={i}
                className="gate-slot"
                data-filled={i < code.length}
                data-current={i === code.length && status === "idle"}
                style={{ ["--i" as string]: i }}
              >
                <span className="gate-digit">{code[i] ?? ""}</span>
              </span>
            ))}
          </span>
        </label>
        <p className="gate-status" id="access-status" role="status">
          {status === "wrong"
            ? "That code isn’t right. Please try again."
            : status === "locked"
              ? "Too many attempts. Please try again in ten minutes."
              : status === "open"
                ? "Welcome."
                : "Shared privately with you."}
        </p>
      </div>
      <Globe spin={status === "open" ? 6 : 1} />
    </main>
  );
}
