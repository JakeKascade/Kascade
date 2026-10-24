"use client";
import { useRef, useState } from "react";
import RealCoderLogo from "./RealCoderLogo";
import Wordmark from "./Wordmark";

type Status = "idle" | "checking" | "wrong" | "locked" | "open";

export default function AccessGate({ length, partner }: { length: number; partner: boolean }) {
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
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => window.location.replace(window.location.href), reduce ? 0 : 900);
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
    >
      <div className="gate-content">
        <p className="gate-lockup lockup">
          <Wordmark />
          {partner && (
            <>
              <span className="lockup-x" aria-hidden="true">×</span>
              <RealCoderLogo />
            </>
          )}
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
              >
                {code[i] ?? ""}
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
                : "A private partnership proposal, shared with you directly."}
        </p>
      </div>
    </main>
  );
}
