"use client";

import type { Dictionary } from "@/content/site";
import { useRef } from "react";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import { useMode } from "./mode";

type Voice = "build" | "verify" | "both";
type Item = Dictionary["about"]["timeline"][number];

const START = "2025-03";

const toIndex = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  const [y0, m0] = START.split("-").map(Number);
  return (y - y0) * 12 + (m - m0);
};

/**
 * La trayectoria como polifonía: dos voces en el tiempo. Los Hidalgos toca ambas;
 * después hay un silencio, y desde dic 2025 Eikôn (Build) y TMM (Verify) suenan a la vez.
 * La promoción en Eikôn es una barra de compás dentro de la misma voz.
 *
 * Es una figura decorativa (aria-hidden): la lista accesible con el texto completo va aparte.
 */
/** `now` llega del servidor (mes de compilación) para que servidor y cliente coincidan. */
export function Polyphony({ d, now }: { d: Dictionary; now: string }) {
  const NOW = now;
  const { mode } = useMode();
  const total = toIndex(NOW) + 1;
  const pct = (i: number) => `${(i / total) * 100}%`;
  const items = [...d.about.timeline].reverse() as Item[];
  const sounds = (v: Voice) => mode === "general" || v === "both" || (v === "build" ? mode === "backend" : mode === "qa");

  const years: number[] = [];
  for (let y = Number(START.slice(0, 4)) + 1; y <= Number(NOW.slice(0, 4)); y++) years.push(y);

  // La trayectoria se escribe con el scroll: un cursor avanza en el tiempo y cada trabajo
  // crece desde su fecha de inicio; las barras de año aparecen al cruzarlas.
  const figRef = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const fig = figRef.current;
        if (!fig) return;
        const q = gsap.utils.selector(fig);
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: fig, start: "top 85%", end: "top 35%", scrub: 0.6 },
        });
        tl.fromTo(q("[data-phead]"), { left: "0%", autoAlpha: 1 }, { left: "100%", duration: 1 }, 0);
        (q("[data-voice]") as HTMLElement[]).forEach((v) => {
          const at = Number(v.dataset.at);
          const len = Number(v.dataset.len);
          tl.fromTo(v.querySelectorAll("[data-pbar]"), { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", duration: len }, at);
          tl.fromTo(v.querySelectorAll("[data-ptie], [data-plabel]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, at);
        });
        (q("[data-pyear]") as HTMLElement[]).forEach((y) => {
          tl.fromTo(y, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, Number(y.dataset.at));
        });
        tl.to(q("[data-phead]"), { autoAlpha: 0, duration: 0.05 }, 0.98);
      });
    },
    { scope: figRef },
  );

  return (
    <figure ref={figRef} className="flex flex-col gap-2" data-polyphony>
      <figcaption className="kicker md:sr-only">{d.about.timelineTitle}</figcaption>
      <div aria-hidden="true" title={d.about.timelineStaff} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <div className="relative h-36 font-serif text-base italic text-muted sm:h-40 sm:text-xl">
          <span className="absolute top-[30%] -translate-y-1/2">Build</span>
          <span className="absolute top-[70%] -translate-y-1/2">Verify</span>
          <svg viewBox="0 0 10 100" preserveAspectRatio="none" className="absolute right-0 top-[22%] h-[56%] w-2.5 text-ink">
            <path d="M9 0C4 0 4 10 4 25 4 42 3 50 1 50 3 50 4 58 4 75 4 90 4 100 9 100" fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="relative h-36 sm:h-40">
          {/* Las dos líneas de voz */}
          <span className="absolute inset-x-0 top-[30%] h-px bg-ink" />
          <span className="absolute inset-x-0 top-[70%] h-px bg-ink" />
          <span data-phead className="pointer-events-none invisible absolute top-[20%] z-10 h-[60%] w-[2px] -translate-x-1/2 bg-wine opacity-0" />
          <span className="absolute left-0 top-[70%] mt-7 font-mono text-[0.6875rem] text-muted">{START.slice(0, 4)}</span>
          {/* Barras de compás en cada cambio de año */}
          {years.map((y) => (
            <span key={y} data-pyear data-at={(toIndex(`${y}-01`) / total).toFixed(4)} className="absolute top-[30%] h-[40%] w-px bg-ink" style={{ left: pct(toIndex(`${y}-01`)) }}>
              <span className="absolute top-full mt-7 -translate-x-1/2 font-mono text-[0.6875rem] text-muted">{y}</span>
            </span>
          ))}
          {items.map((t) => {
            const v = t.voice as Voice;
            const from = toIndex(t.from);
            const to = t.to ? toIndex(t.to) : total;
            const on = sounds(v);
            const left = pct(from);
            const width = `calc(${pct(to - from)} - 3px)`;
            const bar = (voice: "build" | "verify") => `absolute h-[5px] -translate-y-1/2 transition-colors duration-300 ${on ? (voice === "verify" ? "bg-verify" : "bg-wine") : "bg-rest"}`;
            const label = `absolute whitespace-nowrap font-mono text-[0.6875rem] leading-none transition-colors duration-300 sm:text-xs ${on ? "text-ink" : "text-muted"}`;
            return (
              <div key={t.when + t.what} data-voice={v} data-sounding={on} data-at={(from / total).toFixed(4)} data-len={((to - from) / total).toFixed(4)}>
                {v !== "verify" ? <span data-pbar className={`${bar("build")} top-[30%]`} style={{ left, width }} /> : null}
                {v !== "build" ? <span data-pbar className={`${bar("verify")} top-[70%]`} style={{ left, width }} /> : null}
                {v === "both" ? <span data-ptie className={`absolute top-[30%] h-[40%] w-[1.5px] ${on ? "bg-wine" : "bg-rest"}`} style={{ left }} /> : null}
                <span data-plabel className={`${label} ${v === "verify" ? "top-[70%] mt-2.5" : "top-[30%] -mt-6"}`} style={{ left }}>
                  {t.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
