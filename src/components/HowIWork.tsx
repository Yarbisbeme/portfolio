"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
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
 * Coreografía de cada compás sobre su progreso local `u` (0 → 1). El scroll ES la línea de tiempo:
 * cada píxel hacia abajo avanza, cada píxel hacia arriba retrocede; nada corre por su cuenta.
 *   entra  [-0.15, 0]    sube desde abajo, crece y aparece
 *   tacha  [0, 0.35]     el lápiz cruza el cliché
 *   cambia [0.35, 0.6]   el cliché cede (se achica, pasa a gris) y la versión real toma la tinta
 *   lee    [0.6, 0.85]   pausa: nada se mueve
 *   sale   [0.85, 1]     sube, se achica y se desvanece mientras entra el siguiente
 */
const PHASE = { enter: 0.15, strikeEnd: 0.35, swapEnd: 0.6, readEnd: 0.85 };
const READ_AT = (PHASE.swapEnd + PHASE.readEnd) / 2; // punto de pausa: a donde llevan los botones
const ease = (x: number) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);

/**
 * Sección B: "Partitura corregida a lápiz rojo".
 * - pinned (pantalla ancha no táctil): la vista queda fija y el scroll recorre la coreografía de forma continua.
 * - flow (móvil, tablet, táctil): sin fijar nada; cada compás avanza su coreografía según su posición en pantalla.
 * - static (reducir movimiento): ya corregidos, sin animación.
 * El scroll nunca se reescribe: no hay saltos, bloqueos ni recolocación.
 */
export function HowIWork({ d, lang, tuning = null }: { d: Dictionary; lang: Locale; tuning?: Tuning | null }) {
  const rows = d.how.rows;
  const rowCount = rows.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const clicheRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const strikeRefs = useRef<(HTMLElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[][]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const linesRef = useRef<PencilLine[][]>(rows.map(() => [DEFAULT_LINE]));
  const lastLinesSigRef = useRef("");

  const [layout, setLayout] = useState<Layout>("flow");
  const [activeStep, setActiveStep] = useState(-1);
  const [struck, setStruck] = useState<boolean[]>(() => rows.map(() => false));
  const [pencilLines, setPencilLines] = useState<PencilLine[][]>(() => rows.map(() => [DEFAULT_LINE]));

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Escritorio = pantalla ancha que no es táctil (navegadores sin ratón, como CI, también cuentan).
    const wide = window.matchMedia("(min-width: 1024px)");
    const touch = window.matchMedia("(pointer: coarse)");
    const sync = () => setLayout(reduce.matches ? "static" : wide.matches && !touch.matches ? "pinned" : "flow");
    sync();
    const mqs = [reduce, wide, touch];
    mqs.forEach((m) => m.addEventListener("change", sync));
    return () => mqs.forEach((m) => m.removeEventListener("change", sync));
  }, []);

  /** Traza el lápiz sobre las líneas reales del cliché; cada línea recorre su tramo del tachado. */
  const measure = useCallback(() => {
    const nextLines: PencilLine[][] = [];
    for (let i = 0; i < rowCount; i += 1) {
      const pEl = clicheRefs.current[i];
      const sEl = strikeRefs.current[i];
      if (pEl && sEl) {
        // Medimos sin escala para que el trazo no dependa de la animación en curso.
        const prev = pEl.style.transform;
        pEl.style.transform = "none";
        const pRect = pEl.getBoundingClientRect();
        const rawRects = Array.from(sEl.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
        pEl.style.transform = prev;
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
              const y = (((line.top + (line.bottom - line.top) * 0.53) - pRect.top) / pRect.height) * 1000;
              const tilt = (20 + ((i + k) % 2 === 0 ? 6 : -3)) * lineAmp;
              const arch = (k % 2 === 0 ? -24 : 18) * lineAmp;
              const path = `M ${(x1 - 10).toFixed(1)} ${(y + tilt * 0.45).toFixed(1)} C ${(x1 + w * 0.32).toFixed(1)} ${(y + arch).toFixed(1)}, ${(x1 + w * 0.68).toFixed(1)} ${(y - arch * 0.65).toFixed(1)}, ${(x2 + 12).toFixed(1)} ${(y - tilt * 0.55).toFixed(1)}`;
              const dur = Math.round((Math.max(1, line.right - line.left) / totalW) * 1200);
              const delay = elapsed;
              elapsed += dur;
              return { d: path, dur, delay };
            }),
          );
          continue;
        }
      }
      nextLines.push([DEFAULT_LINE]);
    }
    linesRef.current = nextLines;
    const sig = JSON.stringify(nextLines);
    if (sig !== lastLinesSigRef.current) {
      lastLinesSigRef.current = sig;
      setPencilLines(nextLines);
    }
  }, [rowCount]);

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

  /** Pinta un compás a partir de su progreso local `u`. Escribe estilos directos: sin re-render por cuadro. */
  const paint = useCallback(
    (i: number, u: number, pinned: boolean) => {
      const li = rowRefs.current[i];
      if (!li) return;
      const s = clamp(u / PHASE.strikeEnd, 0, 1);
      const w = ease((u - PHASE.strikeEnd) / (PHASE.swapEnd - PHASE.strikeEnd));
      li.style.setProperty("--w", w.toFixed(3));
      li.dataset.progress = clamp(u, 0, 1).toFixed(2);

      const lines = linesRef.current[i] ?? [DEFAULT_LINE];
      (pathRefs.current[i] ?? []).forEach((path, k) => {
        const line = lines[k];
        if (!path || !line) return;
        const a = line.delay / 1200;
        const b = (line.delay + line.dur) / 1200;
        path.style.strokeDashoffset = (1 - clamp((s - a) / Math.max(0.001, b - a), 0, 1)).toFixed(3);
      });

      if (pinned) {
        const drumH = drumRef.current?.clientHeight ?? 600;
        const travel = drumH * 0.42;
        const last = i === rowCount - 1;
        let y = 0;
        let sc = 1;
        let o = 1;
        if (u < 0) {
          const e = ease((u + PHASE.enter) / PHASE.enter);
          y = (1 - e) * travel;
          sc = 0.82 + 0.18 * e;
          o = e;
        } else if (u > PHASE.readEnd && !last) {
          const x = ease((u - PHASE.readEnd) / (1 - PHASE.readEnd));
          y = -x * travel;
          sc = 1 - 0.18 * x;
          o = 1 - x;
        }
        li.style.transform = `translate3d(0, calc(-50% + ${y.toFixed(1)}px), 0) scale(${sc.toFixed(3)})`;
        li.style.opacity = o.toFixed(3);
        li.style.visibility = o < 0.01 ? "hidden" : "visible";
      }
    },
    [rowCount],
  );

  // Estado discreto (botones, atributos de prueba): solo cambia al cruzar un umbral.
  const commit = useCallback((focus: number, struckNow: boolean[]) => {
    setActiveStep((prev) => (prev === focus ? prev : focus));
    setStruck((prev) => (prev.every((v, k) => v === struckNow[k]) ? prev : struckNow));
  }, []);

  // pinned: progreso global P ∈ [0, filas] desde el scroll, con un suavizado corto para la rueda.
  useEffect(() => {
    if (layout !== "pinned") return;
    let target = 0;
    let current = -1;
    let raf = 0;

    const read = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const max = Math.max(1, track.offsetHeight - window.innerHeight);
      return clamp(-rect.top / max, 0, 1) * rowCount;
    };
    const frame = () => {
      raf = 0;
      current = current < 0 ? target : current + (target - current) * 0.22;
      if (Math.abs(target - current) < 0.0008) current = target;
      for (let i = 0; i < rowCount; i += 1) paint(i, current - i, true);
      const focus = Math.min(rowCount - 1, Math.floor(current));
      const track = trackRef.current;
      const before = track ? track.getBoundingClientRect().top > window.innerHeight * 0.45 : false;
      commit(before ? -1 : focus, rows.map((_, i) => current - i >= PHASE.strikeEnd));
      if (current !== target) raf = window.requestAnimationFrame(frame);
    };
    const onScroll = () => {
      target = read();
      if (!raf) raf = window.requestAnimationFrame(frame);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [layout, rowCount, rows, paint, commit]);

  // flow: sin fijar; cada compás avanza según dónde está su centro en la pantalla.
  useEffect(() => {
    if (layout !== "flow") return;
    let raf = 0;
    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      const states: boolean[] = [];
      let focus = -1;
      rowRefs.current.forEach((li, i) => {
        if (!li) return states.push(false);
        const r = li.getBoundingClientRect();
        const center = r.top + r.height / 2;
        // centro en el borde inferior → 0; centro al 30 % de la pantalla → 1
        const u = (vh - center) / (vh * 0.7);
        paint(i, u, false);
        states.push(u >= PHASE.strikeEnd);
        if (u >= 0 && u < 1) focus = i;
      });
      commit(focus, states);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(frame);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [layout, paint, commit]);

  // Al cambiar el trazo medido, repinta con el progreso actual.
  useEffect(() => {
    window.dispatchEvent(new Event("scroll"));
  }, [pencilLines]);

  /** Botones y flechas: llevan a la pausa de lectura de cada compás. Desplazamiento pedido por el usuario. */
  const goTo = (step: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = clamp(step, 0, rowCount - 1);
    const max = Math.max(0, track.offsetHeight - window.innerHeight);
    const top = window.scrollY + track.getBoundingClientRect().top + ((target + READ_AT) / rowCount) * max;
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
    // La prueba es un bloque propio, en claro: no forma parte del escenario oscuro.
    <div data-proof className="surface-paper surface-block bar-double">
      <div className="mx-auto max-w-[90rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
        <ProofBlock d={d} lang={lang} tuning={tuning} />
      </div>
    </div>
  );

  const TEXT = "max-w-[16ch] text-[2.375rem] leading-[1.05] tracking-[-0.02em] xs:max-w-[17ch] xs:text-[2.75rem] sm:max-w-[26ch] sm:text-[2.75rem] lg:text-[3.25rem]";

  /**
   * Un compás: el cliché y la versión real. `--w` (0 → 1) es el cambio de voz que escribe el scroll:
   * el cliché se achica y pasa a gris, la versión real crece y toma la tinta.
   */
  const measureRow = (i: number) => (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <span aria-hidden="true" className="inline-flex items-center gap-2 font-mono text-xs text-muted">
        <span className="relative h-[0.58em] w-[0.82em] -rotate-[20deg] rounded-[50%] bg-rest">
          <span className="absolute inset-0 rounded-[50%] bg-wine" style={{ opacity: "var(--w, 0)" }} />
        </span>
        <span>{ROMAN[i] ?? i + 1}</span>
      </span>
      <p
        ref={(el) => {
          clicheRefs.current[i] = el;
        }}
        className={`relative inline-block origin-bottom italic ${TEXT}`}
        style={{
          transform: "scale(calc(1 - 0.32 * var(--w, 0)))",
          color: "color-mix(in srgb, var(--color-muted) calc(var(--w, 0) * 100%), var(--color-ink))",
        }}
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
              ref={(el) => {
                (pathRefs.current[i] ??= [])[idx] = el;
              }}
              d={line.d}
              pathLength={1}
              strokeWidth={3}
              vectorEffect="non-scaling-stroke"
              className="pencil-scrub"
            />
          ))}
        </svg>
      </p>
      <p
        data-fix
        className={`origin-top not-italic ${TEXT}`}
        style={{
          transform: "scale(calc(0.68 + 0.32 * var(--w, 0)))",
          color: "color-mix(in srgb, var(--color-ink) calc(var(--w, 0) * 100%), var(--color-muted))",
        }}
      >
        {rows[i].fix}
      </p>
    </div>
  );

  if (layout === "static") {
    return (
      <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="static" className="bar-double surface-ink pt-16 sm:pt-22 lg:pt-28">
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
        </div>
        <div className="mt-20 lg:mt-28">{proof}</div>
      </section>
    );
  }

  if (layout === "flow") {
    return (
      <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="flow" className="bar-double surface-ink">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-20">
          {header(false)}
          <ol className="mt-12 flex w-full max-w-5xl flex-col gap-20 sm:mt-16 sm:gap-24">
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
                {measureRow(i)}
              </li>
            ))}
          </ol>
        </div>
        {proof}
      </section>
    );
  }

  return (
    <section id="como-trabajo" aria-labelledby="how-title" data-how-layout="pinned" className="bar-double surface-ink">
      {/* Unos 90svh de scroll por compás: espacio para entrar, tachar, cambiar de voz, leer y salir. */}
      <div ref={trackRef} style={{ height: `${100 + rowCount * 90}svh` }}>
        <div className="sticky top-0 mx-auto flex h-[100svh] max-w-[90rem] flex-col items-center justify-between px-5 py-6 text-center sm:px-8 sm:py-10 lg:px-16 lg:py-14">
          {header(true)}

          {/* Los bordes se desvanecen: un compás que entra o sale nunca aparece cortado en seco. */}
          <div
            ref={drumRef}
            className="relative my-4 w-full max-w-5xl flex-1 overflow-x-clip overflow-y-hidden"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0, #000 14%, #000 86%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 14%, #000 86%, transparent 100%)",
            }}
          >
            <ol className="relative h-full w-full">
              {rows.map((r, i) => (
                <li
                  key={r.fix}
                  data-row={i}
                  data-struck={struck[i]}
                  data-focus={activeStep === i ? "true" : "false"}
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  className="absolute inset-x-0 top-1/2 flex origin-center flex-col items-center will-change-transform"
                  style={{ transform: "translate3d(0, -50%, 0)", opacity: i === 0 ? 1 : 0 }}
                >
                  {measureRow(i)}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6">
            <div role="group" aria-label={d.how.title} onKeyDown={handleGroupKeyDown} className="flex items-center gap-2 font-mono text-xs">
              {rows.map((r, i) => {
                const label = String(i + 1).padStart(2, "0");
                const isActive = activeStep === i;
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
                    <span aria-hidden="true" className={`h-[0.55em] w-[0.78em] -rotate-[20deg] rounded-[50%] transition-colors duration-300 ${struck[i] ? "bg-wine" : isActive ? "bg-ink" : "bg-rest"}`} />
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
