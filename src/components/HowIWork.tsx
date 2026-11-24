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

/**
 * Compás 02: "Partitura corregida a lápiz rojo".
 * Cada compás llega al centro con el cliché en cursiva como voz principal; tras un breve respiro,
 * un trazo gestual en vino lo tacha en 1.2s mientras cede protagonismo a la voz real en romana firme.
 */
export function HowIWork({ d, lang, tuning = null }: { d: Dictionary; lang: Locale; tuning?: Tuning | null }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const clicheRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const strikeRefs = useRef<(HTMLElement | null)[]>([]);
  const fixRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeStepRef = useRef(-1);
  const lockUntilRef = useRef(0);
  const programmaticUntilRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);
  const correctTimerRef = useRef<number | null>(null);
  const lastLinesSigRef = useRef("");

  const rows = d.how.rows;
  const rowCount = rows.length;

  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [correctedUpTo, setCorrectedUpTo] = useState(-1);
  const [stepY, setStepY] = useState(184);
  const [pencilLines, setPencilLines] = useState<PencilLine[][]>(() => rows.map(() => [DEFAULT_LINE]));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const applyStep = useCallback((next: number) => {
    if (next === activeStepRef.current) return;
    activeStepRef.current = next;
    setActiveStep(next);

    if (correctTimerRef.current !== null) {
      window.clearTimeout(correctTimerRef.current);
      correctTimerRef.current = null;
    }

    if (next < 0) {
      setCorrectedUpTo(-1);
      return;
    }

    setCorrectedUpTo((prev) => (prev >= next ? next : Math.max(prev, next - 1)));
    correctTimerRef.current = window.setTimeout(() => {
      correctTimerRef.current = null;
      setCorrectedUpTo((prev) => Math.max(prev, next));
    }, 680);
  }, []);

  const getStepScrollY = useCallback(
    (step: number) => {
      const track = trackRef.current;
      if (!track) return 0;
      const maxScroll = Math.max(0, track.offsetHeight - window.innerHeight);
      const trackTop = window.scrollY + track.getBoundingClientRect().top;
      const ratio = rowCount > 1 ? step / (rowCount - 1) : 0;
      return trackTop + ratio * maxScroll;
    },
    [rowCount],
  );

  const snapToStep = useCallback(
    (step: number) => {
      const target = clamp(step, 0, rowCount - 1);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      applyStep(target);
      const now = Date.now();
      lockUntilRef.current = now + 740;
      programmaticUntilRef.current = now + 740;
      window.scrollTo({ top: getStepScrollY(target), behavior: "smooth" });
    },
    [applyStep, getStepScrollY, rowCount],
  );

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    let cancelled = false;

    const measure = () => {
      const drum = drumRef.current;
      if (!drum) return;

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
                const yStart = y + tilt * 0.45;
                const yEnd = y - tilt * 0.55;
                const cx1 = x1 + w * 0.32;
                const cy1 = y + arch;
                const cx2 = x1 + w * 0.68;
                const cy2 = y - arch * 0.65;
                const d = `M ${(x1 - 10).toFixed(1)} ${yStart.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${(x2 + 12).toFixed(1)} ${yEnd.toFixed(1)}`;

                const wNorm = Math.max(1, line.right - line.left);
                const rawDur = Math.max(140, Math.round((wNorm / totalW) * 1200));
                const delay = k === 0 ? 0 : Math.max(0, elapsed - 40);
                const isLast = k === merged.length - 1;
                const dur = isLast ? Math.max(140, 1200 - delay) : rawDur;
                elapsed = delay + dur;

                return { d, dur, delay };
              }),
            );
            continue;
          }
        }

        nextLines.push([DEFAULT_LINE]);
      }

      const nextStepY = Math.max(maxVisualH * 1.08, drum.clientHeight * 0.36);
      setStepY((prev) => (Math.abs(prev - nextStepY) > 0.5 ? nextStepY : prev));

      const sig = JSON.stringify(nextLines);
      if (sig !== lastLinesSigRef.current) {
        lastLinesSigRef.current = sig;
        setPencilLines(nextLines);
      }
    };

    const syncFromScroll = (alignOnIdle: boolean) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const maxScroll = track.offsetHeight - vh;

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }

      if (rect.top > vh * 0.45) {
        applyStep(-1);
        return;
      }
      if (rect.top > 24) {
        applyStep(0);
        return;
      }
      if (rect.bottom < vh - 24) {
        applyStep(rowCount - 1);
        return;
      }

      const raw = maxScroll > 0 ? clamp(-rect.top / maxScroll, 0, 1) : 0;
      const nearest = Math.round(raw * (rowCount - 1));
      applyStep(nearest);

      if (alignOnIdle) {
        idleTimerRef.current = window.setTimeout(() => {
          idleTimerRef.current = null;
          const targetY = getStepScrollY(nearest);
          if (Math.abs(window.scrollY - targetY) > 8) {
            programmaticUntilRef.current = Date.now() + 450;
            window.scrollTo({ top: targetY, behavior: "smooth" });
          }
        }, 150);
      }
    };

    const onScroll = () => {
      if (Date.now() < programmaticUntilRef.current) return;
      syncFromScroll(true);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 4) return;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const isPinned = rect.top <= 24 && rect.bottom >= vh - 24;

      if (Date.now() < lockUntilRef.current) {
        if (isPinned) e.preventDefault();
        return;
      }

      if (rect.top > 24 && rect.top <= 140 && e.deltaY > 0 && activeStepRef.current < 0) {
        e.preventDefault();
        snapToStep(0);
        return;
      }

      if (rect.bottom < vh - 24 && rect.bottom >= vh - 140 && e.deltaY < 0) {
        e.preventDefault();
        snapToStep(rowCount - 1);
        return;
      }

      if (isPinned) {
        const dir = e.deltaY > 0 ? 1 : -1;
        const current = clamp(activeStepRef.current, 0, rowCount - 1);
        const next = current + dir;
        if (next >= 0 && next <= rowCount - 1) {
          e.preventDefault();
          snapToStep(next);
        }
      }
    };

    const onResize = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (!cancelled) measure();
      });
    };

    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      if (cancelled) return;
      measure();
      syncFromScroll(false);
    });

    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    const drum = drumRef.current;
    const ro = drum && typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    if (ro && drum) ro.observe(drum);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (correctTimerRef.current !== null) {
        window.clearTimeout(correctTimerRef.current);
        correctTimerRef.current = null;
      }
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, [applyStep, getStepScrollY, reducedMotion, rowCount, snapToStep]);

  const handleGroupKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const current = activeStep < 0 ? 0 : activeStep;
    const next = clamp(current + dir, 0, rowCount - 1);
    snapToStep(next);
    buttonRefs.current[next]?.focus();
  };

  if (reducedMotion) {
    return (
      <section id="como-trabajo" aria-labelledby="how-title" className="bar-double py-20 lg:py-32">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center px-5 text-center sm:px-8 lg:px-16">
          <Rehearsal mark={d.how.kicker} label={d.nav.section} />
          <h2 id="how-title" className="mt-4 text-5xl font-normal leading-none lg:text-6xl">
            {d.how.title}
          </h2>
          <p className="mt-4 text-lg text-muted">{d.how.intro}</p>
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

  const focusVal = activeStep < 0 ? -0.5 : activeStep;

  return (
    <section id="como-trabajo" aria-labelledby="how-title" className="bar-double">
      <div ref={trackRef} className="h-[300svh]">
        <div className="sticky top-0 mx-auto flex h-[100svh] max-w-[90rem] flex-col items-center justify-between px-5 py-6 text-center sm:px-8 sm:py-10 lg:px-16 lg:py-14">
          <header className="flex flex-col items-center">
            <Rehearsal mark={d.how.kicker} label={d.nav.section} />
            <h2 id="how-title" className="mt-2 text-4xl font-normal leading-none xs:text-[2.625rem] sm:mt-3 sm:text-5xl lg:mt-4 lg:text-6xl">
              {d.how.title}
            </h2>
            <p className="mt-3 hidden text-base text-muted sm:block sm:text-lg lg:mt-4">{d.how.intro}</p>
          </header>

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

                const noteClass = isCorrected
                  ? "bg-wine scale-110"
                  : isFocused
                    ? "bg-ink"
                    : "bg-rest";

                return (
                  <li
                    key={r.fix}
                    data-focus={isFocused ? "true" : "false"}
                    style={{
                      transform: `translate3d(0, calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale.toFixed(3)})`,
                    }}
                    className="group absolute inset-x-0 top-1/2 flex origin-center flex-col items-center transition-transform duration-[760ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
                  >
                    <div data-corrected={isCorrected ? "true" : "false"} className="voice-stage flex flex-col items-center gap-2 sm:gap-3">
                      <span aria-hidden="true" className="inline-flex items-center gap-2 font-mono text-xs text-muted">
                        <span className={`h-[0.58em] w-[0.82em] -rotate-[20deg] rounded-[50%] transition-all duration-500 ${noteClass}`} />
                        <span>{ROMAN[i] ?? i + 1}</span>
                      </span>
                      <p
                        ref={(el) => {
                          clicheRefs.current[i] = el;
                        }}
                        data-corrected={isCorrected ? "true" : "false"}
                        className={`voice-cliche relative inline-block max-w-[16ch] italic text-[2.375rem] leading-[1.05] tracking-[-0.02em] xs:max-w-[17ch] xs:text-[2.75rem] sm:max-w-[26ch] sm:text-[2.75rem] lg:text-[3.25rem] ${
                          isFocused && !isCorrected ? "text-ink" : "text-muted"
                        }`}
                      >
                        <s
                          ref={(el) => {
                            strikeRefs.current[i] = el;
                          }}
                          className="no-underline"
                        >
                          {r.cliche}
                        </s>
                        <svg aria-hidden="true" viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                          {(pencilLines[i] ?? []).map((line, idx) => (
                            <path
                              key={idx}
                              d={line.d}
                              pathLength={1}
                              strokeWidth={3}
                              vectorEffect="non-scaling-stroke"
                              data-struck={isCorrected ? "true" : "false"}
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
                        data-corrected={isCorrected ? "true" : "false"}
                        className={`voice-truth max-w-[16ch] not-italic text-[2.375rem] leading-[1.05] tracking-[-0.02em] xs:max-w-[17ch] xs:text-[2.75rem] sm:max-w-[26ch] sm:text-[2.75rem] lg:text-[3.25rem] ${
                          isFocused && isCorrected ? "text-ink" : "text-muted"
                        }`}
                      >
                        {r.fix}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div role="group" aria-label={d.how.title} onKeyDown={handleGroupKeyDown} className="flex items-center gap-2 font-mono text-xs">
            {rows.map((r, i) => {
              const label = String(i + 1).padStart(2, "0");
              const isActive = activeStep === i;
              const isCorrected = correctedUpTo >= 0 && i <= correctedUpTo;
              const dotClass = isCorrected ? "bg-wine" : isActive ? "bg-ink" : "bg-rest";

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
                  onClick={() => snapToStep(i)}
                  className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 px-2.5 transition-colors ${
                    isActive ? "text-wine underline decoration-1 underline-offset-4" : "text-muted hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true" className={`h-[0.55em] w-[0.78em] -rotate-[20deg] rounded-[50%] transition-colors duration-300 ${dotClass}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-5 pb-20 pt-8 sm:px-8 lg:px-16 lg:pb-28">
        <ProofBlock d={d} lang={lang} tuning={tuning} />
      </div>
    </section>
  );
}
