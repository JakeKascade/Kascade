"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/brand/brand";
import { exportCsv, exportResults } from "@/lib/export";
import { money, plural } from "@/lib/format";
import { DEFAULT_SCENARIO, run, settingsAdjusted, type Scenario } from "@/lib/scenario";
import Builder from "./calculator/Builder";
import Results from "./calculator/Results";
import { Icon } from "./Primitives";
import Wordmark from "./Wordmark";
import Calculator from "./sections/Calculator";
import { Complement, Hero } from "./sections/Opening";
import ReferralFlow from "./sections/ReferralFlow";
import { Branding, CreativePartner, RealEstate, ServicesIndex } from "./sections/Services";
import { Gains, NextSteps, Terms } from "./sections/Together";

const GROUPS = [
  { id: "partnership", href: "#partnership", number: "01", label: "Partnership" },
  { id: "services", href: "#services", number: "02", label: "Services" },
  { id: "referrals", href: "#how-it-works", number: "03", label: "Referrals" },
  { id: "together", href: "#gains", number: "04", label: "Working together" },
] as const;
type Group = (typeof GROUPS)[number]["id"];

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Presentation() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [current, setCurrent] = useState<Group>("partnership");
  const [exported, setExported] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const output = useMemo(() => run(scenario), [scenario]);

  // Marks the page as interactive (used by the browser tests before typing).
  useEffect(() => {
    document.documentElement.dataset.ready = "true";
  }, []);

  // A quiet fade-in for each module as it arrives, only when motion is welcome.
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const root = document.documentElement;
    root.classList.add("motion");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    const reveal = () =>
      document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    window.addEventListener("beforeprint", reveal);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", reveal);
      root.classList.remove("motion");
    };
  }, []);

  // A hairline under the header that fills as the page is read.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = document.documentElement;
      const range = el.scrollHeight - window.innerHeight;
      const share = range > 0 ? Math.min(1, el.scrollTop / range) : 0;
      progress.current?.style.setProperty("--progress", String(share));
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

  // Which chapter is in view, for the header navigation.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.getAttribute("data-group") as Group);
        }),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll(".panel").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const update = (next: Scenario) => {
    setScenario(next);
    setExported("");
  };
  const openDrawer = () => {
    setDrawerOpen(true);
    drawer.current?.showModal();
  };
  const closeDrawer = () => drawer.current?.close();
  const exportFile = (format: "json" | "csv") => {
    const payload =
      format === "json" ? JSON.stringify(exportResults(scenario), null, 2) : exportCsv(scenario);
    download(
      `kascade-real-coder-referral-scenario.${format}`,
      payload,
      format === "json" ? "application/json" : "text/csv",
    );
    setExported(`${format.toUpperCase()} downloaded with the current scenario and every month.`);
  };
  const t = output.totals;
  const referrals = t.projects + t.retainerClients;
  const summary = `${plural(referrals, "referral")} · ${money(t.totalCommission)}`;
  const adjusted = settingsAdjusted(scenario.settings);

  return (
    <>
      <a className="skip-link" href="#calculator">
        Skip to the calculator
      </a>
      <header className="site-header">
        <div className="wrap header-inner">
          <a className="brand" href="#partnership" aria-label={`${BRAND.studio} × ${BRAND.partner}, back to the top`}>
            <Wordmark />
            <span className="brand-x" aria-hidden="true">
              ×
            </span>
            <span className="brand-partner" aria-hidden="true">
              {BRAND.partner}
            </span>
          </a>
          <nav aria-label="Sections">
            {GROUPS.map((g) => (
              <a key={g.id} href={g.href} aria-current={current === g.id ? "true" : undefined}>
                <span>{g.number}</span>
                {g.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="scenario-button"
            onClick={openDrawer}
            aria-haspopup="dialog"
            aria-label={`Scenario: ${summary}${adjusted ? ", testing settings" : ""}. Edit the referral scenario`}
          >
            <Icon name="sliders" size={16} />
            <span className="scenario-label">Scenario</span>
            <span className="scenario-summary">{summary}</span>
            {adjusted && <span className="scenario-dot" aria-hidden="true" />}
          </button>
        </div>
        <span className="read-progress" ref={progress} aria-hidden="true" />
      </header>

      {/* The same scenario as the calculator, reachable from anywhere on the page. */}
      <dialog
        ref={drawer}
        className="drawer"
        aria-labelledby="drawer-title"
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDrawer();
        }}
      >
        {/* Mounted only while open, so the page never holds a hidden second set of controls. */}
        {drawerOpen && (
          <div className="drawer-inner">
            <div className="drawer-head">
              <h2 id="drawer-title">Referral scenario</h2>
              <button type="button" className="icon-button" onClick={closeDrawer} aria-label="Close the scenario panel">
                <Icon name="close" />
              </button>
            </div>
            <p className="fine">
              The calculator and every result on the page follow this scenario.
              Changes are kept when you close the panel.
            </p>
            <Results output={output} settings={scenario.settings} compact />
            <Builder scenario={scenario} onChange={update} idPrefix="d-" />
            <div className="drawer-actions">
              <a className="text-button" href="#calculator" onClick={closeDrawer}>
                Open the full calculator
              </a>
              <button type="button" className="button" onClick={closeDrawer}>
                Done
              </button>
            </div>
          </div>
        )}
      </dialog>

      <main>
        <Hero />
        <Complement />
        <ServicesIndex />
        <Branding />
        <RealEstate />
        <CreativePartner />
        <ReferralFlow />
        <Calculator scenario={scenario} output={output} onChange={update} onExport={exportFile} exported={exported} />
        <Gains />
        <Terms />
        <NextSteps onPrint={() => window.print()} />
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <Wordmark />
          <p>
            {BRAND.status} · Prepared for {BRAND.audience} at {BRAND.partner} ·{" "}
            {BRAND.dated}. A proposed partnership, not an offer or agreement.
            Indicative pricing and illustrative figures in Australian dollars,
            excluding GST.
          </p>
        </div>
      </footer>
    </>
  );
}
