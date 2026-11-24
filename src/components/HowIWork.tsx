"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Dictionary, Locale } from "@/content/site";
import { Rehearsal } from "./Score";
import { TuningStaff, type Tuning } from "./Tuning";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const ROMAN = ["I", "II", "III", "IV", "V"];

type PencilLine = { d: string; dur: number; delay: number };

const DEFAULT_LINE: PencilLine = { d: "M 10 530 C 330 500, 670 515, 990 485", dur: 1200, delay: 0 };

function ProofBlock({ d, lang, tuning }: { d: Dictionary; lang: Locale; tuning: Tuning | null }) {
  return (
    <div className="mx-auto w-full max-w-5xl border-y border-ink py-10 text-left">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-12">
        <div>
          <p className="text-3xl leading-tight lg:text-4xl">
            <em className="text-wine">{d.how.proofTitle}</em>
          </p>
          <p className="mt-3 max-w-[56ch]">{d.how.proofBody}</p>
        </div>
        <p className="flex flex-col gap-1 font-mono text-sm lg:items-end">
          <a href={`/${lang}/automation/`} className="inline-block py-3 underline decoration-1 underline-offset-4 hover:text-wine">
            {d.how.proofSuite} →
          </a>
          <a href={`/${lang}/dev/`} className="inline-block py-3 underline decoration-1 underline-offset-4 hover:text-wine">
            {d.how.proofCode} →
          </a>
        </p>
      </div>
      {tuning ? <TuningStaff d={d} tuning={tuning} /> : null}
    </div>
  );
}

type Layout = "flow" | "pinned" | "static";

/**
 * Sección B: "Partitura corregida a lápiz rojo".
 * Cada compás muestra el cliché en cursiva; un trazo en vino lo tacha y cede el lugar a la versión real.
 *
 * Tres formas, según el dispositivo:
 * - pinned (pantalla ancha no táctil): la vista queda fija y el avance sale directamente de la
 *   posición del scroll. Nunca se recoloca al usuario, no hay bloqueos ni temporizadores: el scroll es suyo.
 * - flow (móvil, tablet, táctil): los compases van uno debajo del otro y cada uno se tacha al entrar en pantalla.
 * - static (reducir movimiento): ya corregidos, sin animación.
 */
export function HowIWork({ d, lang, tuning = null }: { d: Dictionary; lang: Locale; tuning?: Tuning | null }) {
  const rows = d.how.rows;
  const rowCount = rows.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const clicheRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const strikeRefs = useRef<(HTMLElement | null)[]>([]);
  const fixRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeStepRef = useRef(-1);
  const correctTimerRef = useRef<number | null>(null);
  const lastLinesSigRef = useRef("");

  // "flow" es el punto de partida seguro (sin 300svh) hasta saber qué dispositivo es.
  const [layout, setLayout] = useState<Layout>("flow");
  const [activeStep, setActiveStep] = useState(-1);
  const [correctedUpTo, setCorrectedUpTo] = useState(-1);
  const [struck, setStruck] = useState<boolean[]>(() => rows.map(() => false));
  const [stepY, setStepY] = useState(184);
  const [pencilLines, setPencilLines] = useState<PencilLine[][]>(() => rows.map(() => [DEFAULT_LINE]));

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Escritorio = pantalla ancha que no es táctil. No se exige "pointer: fine": navegadores sin
    // ratón (CI, algunos lectores) informan "none" y también deben ver la versión de escritorio.
    const wide = window.matchMedia("(min-width: 1024px)");
    const touch = window.matchMedia("(pointer: coarse)");
    const sync = () => setLayout(reduce.matches ? "static" : wide.matches && !touch.matches ? "pinned" : "flow");
    sync();
    const mqs = [reduce, wide, touch];
    mqs.forEach((m) => m.addEventListener("change", sync));
    return () => mqs.forEach((m) => m.removeEventListener("change", sync));
  }, []);

  /** Traza el lápiz sobre las líneas reales del cliché (sirve para pinned y flow). */
  const measure = useCallback(() => {
    let maxVisualH = 0;
    const nextLines: PencilLine[][] = [];

    for (let i = 0; i < rowCount; i += 1) {
      const pEl = clicheRefs.current[i];
      const sEl = strikeRefs.current[i];
      const fEl = fixRefs.current[i];

      const clicheH = pEl?.offsetHeight ?? 0;
      const fixH = fEl?.offsetHeight ?? 0;
      const visualH = Math.max(clicheH + fixH * 0.62, clicheH * 0.62 + fixH) + 32;
      if (visualH > maxVisualH) maxVisualH = visualH;

      if (pEl && sEl) {
        const pRect = pEl.getBoundingClientRect();
        const rawRects = Array.from(sEl.getClientRects()).filter((r) => r.width > 2 && r.height > 2);

        if (pRect.width > 0 && pRect.height > 0 && rawRects.length > 0) {
          const merged: { left: number; right: number; top: number; bottom: number }[] = [];
          for (const r of rawRects) {
            const last = merged[merged.length - 1];
            if (last && Math.abs(r.top - last.top) < r.height * 0.5) {
              last.left = Math.min(last.left, r.left);
              last.right = Math.max(last.right, r.right);
              last.top = Math.min(last.top, r.top);
              last.bottom = Math.max(last.bottom, r.bottom);
            } else {
              merged.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
            }
          }

          const totalW = merged.reduce((acc, l) => acc + Math.max(1, l.right - l.left), 0);
          const lineAmp = 1 / Math.max(1, merged.length);
          let elapsed = 0;

          nextLines.push(
            merged.map((line, k) => {
              const x1 = ((line.left - pRect.left) / pRect.width) * 1000;
              const x2 = ((line.right - pRect.left) / pRect.width) * 1000;
              const w = Math.max(1, x2 - x1);
              const centerY = line.top + (line.bottom - line.top) * 0.53;
              const y = ((centerY - pRect.top) / pRect.height) * 1000;

              const tilt = (20 + ((i + k) % 2 === 0 ? 6 : -3)) * lineAmp;
              const arch = (k % 2 === 0 ? -24 : 18) * lineAmp;
              const d = `M ${(x1 - 10).toFixed(1)} ${(y + tilt * 0.45).toFixed(1)} C ${(x1 + w * 0.32).toFixed(1)} ${(y + arch).toFixed(1)}, ${(x1 + w * 0.68).toFixed(1)} ${(y - arch * 0.65).toFixed(1)}, ${(x2 + 12).toFixed(1)} ${(y - tilt * 0.55).toFixed(1)}`;

              const rawDur = Math.max(140, Math.round((Math.max(1, line.right - line.left) / totalW) * 1200));
              const delay = k === 0 ? 0 : Math.max(0, elapsed - 40);
              const dur = k === merged.length - 1 ? Math.max(140, 1200 - delay) : rawDur;
              elapsed = delay + dur;
              return { d, dur, delay };
            }),
          );
          continue;
        }
      }
      nextLines.push([DEFAULT_LINE]);
    }

    const drum = drumRef.current;
    if (drum) {
      const nextStepY = Math.max(maxVisualH * 1.08, drum.clientHeight * 0.36);
      setStepY((prev) => (Math.abs(prev - nextStepY) > 0.5 ? nextStepY : prev));
    }

    const sig = JSON.stringify(nextLines);
    if (sig !== lastLinesSigRef.current) {
      lastLinesSigRef.current = sig;
      setPencilLines(nextLines);
    }
  }, [rowCount]);

  // Medición (fuentes, tamaño) en pinned y flow.
  useEffect(() => {
    if (layout === "static") return;
    let rafId = window.requestAnimationFrame(measure);
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    const onResize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [layout, measure]);

  // pinned: el paso activo sale de la posición del scroll. Solo lee; nunca escribe el scroll.
  useEffect(() => {
    if (layout !== "pinned") return;

    const apply = (next: number) => {
      if (next === activeStepRef.current) return;
      activeStepRef.current = next;
      setActiveStep(next);
      if (correctTimerRef.current !== null) window.clearTimeout(correctTimerRef.current);
      if (next < 0) {
        setCorrectedUpTo(-1);
        return;
      }
      setCorrectedUpTo((prev) => (prev >= next ? next : Math.max(prev, next - 1)));
      // Un respiro para leer el cliché antes de que el lápiz lo tache.
      correctTimerRef.current = window.setTimeout(() => {
        correctTimerRef.current = null;
        setCorrectedUpTo((prev) => Math.max(prev, next));
      }, 420);
    };

    let raf = 0;
    const sync = () => {
      raf = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top > vh * 0.45) return apply(-1);
      const maxScroll = Math.max(1, track.offsetHeight - vh);
      const progress = clamp(-rect.top / maxScroll, 0, 0.9999);
      apply(Math.floor(progress * rowCount));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      if (correctTimerRef.current !== null) window.clearTimeout(correctTimerRef.current);
    };
  }, [layout, rowCount]);

  // flow: cada compás se tacha una vez, al cruzar el 60 % de la pantalla.
  useEffect(() => {
    if (layout !== "flow" || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.row);
          // Los compases que quedaron arriba (por un salto o un gesto rápido) también se dan por corregidos.
          setStruck((prev) => (prev.slice(0, i + 1).every(Boolean) ? prev : prev.map((v, k) => v || k <= i)));
        }
      },
      // Cuenta también lo que ya quedó por encima de la pantalla.
      { rootMargin: "100000px 0px -40% 0px" },
    );
    rowRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [layout]);

  /** Ir a un compás (botones y flechas). Es un desplazamiento que pide el usuario: sin bloqueo. */
  const goTo = (step: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = clamp(step, 0, rowCount - 1);
    const maxScroll = Math.max(0, track.offsetHeight - window.innerHeight);
    const top = window.scrollY + track.getBoundingClientRect().top + ((target + 0.5) / rowCount) * maxScroll;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleGroupKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = clamp((activeStep < 0 ? 0 : activeStep) + dir, 0, rowCount - 1);
    goTo(next);
    buttonRefs.current[next]?.focus();
  };

  const header = (pinned: boolean) => (
    <header className="flex flex-col items-center">
      <Rehearsal mark={d.how.kicker} label={d.nav.section} />
      <h2 id="how-title" className={`text-4xl font-normal leading-none xs:text-[2.625rem] sm:text-5xl lg:text-6xl ${pinned ? "mt-2 sm:mt-3 lg:mt-4" : "mt-4"}`}>
        {d.how.title}
      </h2>
      <p className={`mt-3 text-base text-muted sm:text-lg lg:mt-4 ${pinned ? "hidden sm:block" : ""}`}>{d.how.intro}</p>
    </header>
  );

  const skip = (
    <a href="#stack" data-skip-how className="inline-flex min-h-11 items-center font-mono text-xs text-muted underline decoration-1 underline-offset-4 hover:text-ink">
      {d.how.skip} ↓
    </a>
  );

  const proof = (
    <div className="mx-auto max-w-[90rem] px-5 pb-20 pt-8 sm:px-8 lg:px-16 lg:pb-28">
      <ProofBlock d={d} lang={lang} tuning={tuning} />
    </div>
  );

  /** El cliché con su trazo y la versión real. `corrected` decide qué voz manda. */
  const voices = (i: number, corrected: boolean, emphasis: boolean, size: string) => (
    <div data-corrected={corrected ? "true" : "false"} className="voice-stage flex flex-col items-center gap-2 sm:gap-3">
      <span aria-hidden="true" className="inline-flex items-center gap-2 font-mono text-xs text-muted">
        <span className={`h-[0.58em] w-[0.82em] -rotate-[20deg] rounded-[50%] transition-all duration-500 ${corrected ? "scale-110 bg-wine" : emphasis ? "bg-ink" : "bg-rest"}`} />
        <span>{ROMAN[i] ?? i + 1}</span>
      </span>
      <p
        ref={(el) => {
          clicheRefs.current[i] = el;
        }}
        data-corrected={corrected ? "true" : "false"}
        className={`voice-cliche relative inline-block italic ${size} ${emphasis && !corrected ? "text-ink" : "text-muted"}`}
      >
        <s
          ref={(el) => {
            strikeRefs.current[i] = el;
          }}
          className="no-underline"
        >
          {rows[i].cliche}
        </s>
        <svg aria-hidden="true" viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {(pencilLines[i] ?? []).map((line, idx) => (
            <path
              key={idx}
              d={line.d}
              pathLength={1}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              data-struck={corrected ? "true" : "false"}
              style={{ "--stroke-dur": `${line.dur}ms`, "--stroke-delay": `${line.delay}ms` } as CSSProperties}
              className="pencil-stroke"
            />
          ))}
        </svg>
      </p>
      <p
        ref={(el) => {
          fixRefs.current[i] = el;
        }}
        data-fix
        data-corrected={corrected ? "true" : "false"}
        className={`voice-truth not-italic ${size} ${emphasis && corrected ? "text-ink" : "text-muted"}`}
      >
        {rows[i].fix}
      </p>
    </div>
  );

  if (layout === "static") {
    return (
      <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="static" className="bar-double py-20 lg:py-32">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center px-5 text-center sm:px-8 lg:px-16">
          {header(false)}
          <ol className="mt-14 flex w-full max-w-5xl flex-col gap-14 lg:mt-20 lg:gap-20">
            {rows.map((r, i) => (
              <li key={r.fix} className="flex flex-col items-center gap-3">
                <span aria-hidden="true" className="inline-flex items-center gap-2 font-mono text-xs text-muted">
                  <span className="h-[0.58em] w-[0.82em] -rotate-[20deg] rounded-[50%] bg-wine" />
                  <span>{ROMAN[i] ?? i + 1}</span>
                </span>
                <p className="text-lg italic text-muted lg:text-xl">
                  <s className="cliche-strike">{r.cliche}</s>
                </p>
                <p className="max-w-[24ch] text-[2rem] leading-[1.1] tracking-[-0.01em] sm:max-w-[28ch] sm:text-5xl lg:text-[3.5rem]">{r.fix}</p>
              </li>
            ))}
          </ol>
          <div className="mt-20 w-full lg:mt-28">
            <ProofBlock d={d} lang={lang} tuning={tuning} />
          </div>
        </div>
      </section>
    );
  }

  const TEXT = "max-w-[16ch] text-[2.375rem] leading-[1.05] tracking-[-0.02em] xs:max-w-[17ch] xs:text-[2.75rem] sm:max-w-[26ch] sm:text-[2.75rem] lg:text-[3.25rem]";

  if (layout === "flow") {
    return (
      <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="flow" className="bar-double">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center px-5 pt-16 text-center sm:px-8 sm:pt-20">
          {header(false)}
          <ol className="mt-12 flex w-full max-w-5xl flex-col gap-16 sm:mt-16 sm:gap-20">
            {rows.map((r, i) => (
              <li
                key={r.fix}
                data-row={i}
                data-struck={struck[i]}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                className="flex flex-col items-center"
              >
                {voices(i, struck[i], true, TEXT)}
              </li>
            ))}
          </ol>
        </div>
        {proof}
      </section>
    );
  }

  const focusVal = activeStep < 0 ? -0.5 : activeStep;

  return (
    <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="pinned" className="bar-double">
      {/* Un tramo corto por compás: ágil, no un túnel. */}
      <div ref={trackRef} style={{ height: `${100 + rowCount * 65}svh` }}>
        <div className="sticky top-0 mx-auto flex h-[100svh] max-w-[90rem] flex-col items-center justify-between px-5 py-6 text-center sm:px-8 sm:py-10 lg:px-16 lg:py-14">
          {header(true)}

          <div ref={drumRef} className="relative my-4 w-full max-w-5xl flex-1 overflow-x-clip overflow-y-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-2 md:flex">
              <span className="h-6 w-px bg-ink/35" />
              <span className="h-2 w-2.5 -rotate-[20deg] rounded-[50%] bg-wine" />
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 items-center md:flex">
              <span className="h-6 w-px bg-ink/35" />
            </div>
            <ol className="relative h-full w-full">
              {rows.map((r, i) => {
                const delta = i - focusVal;
                const abs = Math.abs(delta);
                const y = stepY * ((1.12 * delta) / (1 + 0.12 * abs));
                const scale = 0.72 + 0.28 / (1 + Math.pow(abs * 1.15, 2));
                const isFocused = activeStep === i;
                const isCorrected = correctedUpTo >= 0 && i <= correctedUpTo;
                return (
                  <li
                    key={r.fix}
                    data-focus={isFocused ? "true" : "false"}
                    style={{ transform: `translate3d(0, calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale.toFixed(3)})` }}
                    className="group absolute inset-x-0 top-1/2 flex origin-center flex-col items-center transition-transform duration-[760ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                  >
                    {voices(i, isCorrected, isFocused, TEXT)}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6">
            <div role="group" aria-label={d.how.title} onKeyDown={handleGroupKeyDown} className="flex items-center gap-2 font-mono text-xs">
              {rows.map((r, i) => {
                const label = String(i + 1).padStart(2, "0");
                const isActive = activeStep === i;
                const isCorrected = correctedUpTo >= 0 && i <= correctedUpTo;
                return (
                  <button
                    key={r.fix}
                    ref={(el) => {
                      buttonRefs.current[i] = el;
                    }}
                    type="button"
                    data-active={isActive}
                    aria-label={`${label} — ${r.fix}`}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => goTo(i)}
                    className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 px-2.5 transition-colors ${
                      isActive ? "text-wine underline decoration-1 underline-offset-4" : "text-muted hover:text-ink"
                    }`}
                  >
                    <span aria-hidden="true" className={`h-[0.55em] w-[0.78em] -rotate-[20deg] rounded-[50%] transition-colors duration-300 ${isCorrected ? "bg-wine" : isActive ? "bg-ink" : "bg-rest"}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            {skip}
          </div>
        </div>
      </div>
      {proof}
    </section>
  );
}
