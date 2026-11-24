"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/content/site";
import type { Feature, Step } from "@/lib/automation";

const MARK: Record<string, string> = { passed: "✓", failed: "✕", skipped: "–", pending: "·", undefined: "?", ambiguous: "?" };

/** Resalta en vino los parámetros entre comillas del paso, como en un editor de Gherkin. */
function StepText({ text }: { text: string }) {
  const parts = text.split(/("[^"]*")/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('"') ? (
          <span key={i} className="text-wine">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

const PITCH = [2, 4, 3, 5, 4, 6, 3, 5, 2, 4];

/**
 * Los pasos del escenario como notas en un pentagrama, con un cursor de reproducción.
 * Sonó y pasó = nota llena en vino; falló = hueca con cruz (no solo color); aún no suena = gris.
 * Es una vista: la lista de pasos de abajo sigue siendo el control accesible, así que esto va aria-hidden.
 */
function StepStaff({ steps, step, live, onPick }: { steps: Step[]; step: number; live: boolean; onPick: (i: number) => void }) {
  const n = Math.max(1, steps.length);
  const x = (i: number) => `${((i + 0.5) / n) * 100}%`;
  return (
    <div aria-hidden="true" data-step-staff className="relative h-24 select-none sm:h-28">
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className="absolute inset-x-0 h-px bg-ink" style={{ top: `${22 + l * 12}%` }} />
      ))}
      <span className="absolute left-0 top-[22%] h-[48%] w-px bg-ink" />
      <span className="absolute right-0 top-[22%] h-[48%] w-[3px] bg-ink" />
      <span className="absolute right-[5px] top-[22%] h-[48%] w-px bg-ink" />
      {live ? (
        <span
          data-playhead={step}
          className="absolute top-[8%] h-[76%] w-[2px] -translate-x-1/2 bg-wine transition-[left] duration-500 ease-out motion-reduce:transition-none"
          style={{ left: x(step) }}
        />
      ) : null}
      {steps.map((s, i) => {
        const sounded = live && i <= step;
        const failed = sounded && s.status === "failed";
        const passed = sounded && s.status === "passed";
        const top = 70 - PITCH[i % PITCH.length] * 6; // % desde arriba: línea inferior en 70 %
        return (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            disabled={!live}
            data-step-note={sounded ? s.status : "waiting"}
            onClick={() => onPick(i)}
            className="absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center disabled:cursor-default"
            style={{ left: x(i), top: `${top}%` }}
          >
            <span
              className={`block h-[0.7rem] w-[0.95rem] -rotate-[20deg] rounded-[50%] border-[1.5px] transition-colors duration-300 ${
                passed ? "border-verify bg-verify" : failed ? "border-ink bg-paper" : sounded ? "border-ink bg-paper" : "border-rest bg-rest"
              } ${i === step && live ? "scale-125" : ""}`}
            />
            {failed ? <span className="absolute font-mono text-sm leading-none text-ink">×</span> : null}
          </button>
        );
      })}
      <span className="absolute inset-x-0 bottom-0 flex">
        {steps.map((s, i) => (
          <span key={i} className={`flex-1 text-center font-mono text-[0.625rem] italic sm:text-xs ${live && i === step ? "text-wine" : "text-muted"}`}>
            {s.keyword}
          </span>
        ))}
      </span>
    </div>
  );
}

function scenarioLabel(feature: Feature, i: number) {
  const s = feature.scenarios[i];
  const twins = feature.scenarios.filter((x) => x.name === s.name);
  if (twins.length < 2) return s.name;
  // Scenario Outline: muestra el primer parámetro que distingue este ejemplo de sus gemelos.
  const params = (sc: typeof s) => sc.steps.flatMap((st) => [...st.text.matchAll(/"([^"]*)"/g)].map((m) => m[1]));
  const mine = params(s);
  const k = mine.findIndex((v, idx) => twins.some((tw) => params(tw)[idx] !== v));
  return k >= 0 ? `${s.name} · ${mine[k]}` : s.name;
}

export function SuitePlayer({ d, features, live }: { d: Dictionary; features: Feature[]; live: boolean }) {
  const t = d.automation;
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const scenario = features[fi]?.scenarios[si];
  const steps: Step[] = useMemo(() => scenario?.steps ?? [], [scenario]);
  const current = steps[step];
  const totalScenarios = useMemo(() => features.reduce((n, f) => n + f.scenarios.length, 0), [features]);
  const currentPos = useMemo(
    () => features.slice(0, fi).reduce((n, f) => n + f.scenarios.length, 0) + si + 1,
    [features, fi, si],
  );

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
        setPlaying(false);
      } else if (e.key === "ArrowRight") {
        setStep((s) => Math.min(steps.length - 1, s + 1));
        setPlaying(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, steps.length]);

  useEffect(() => {
    if (!playing) return;
    if (step >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), 1500);
    return () => window.clearTimeout(id);
  }, [playing, step, steps.length]);

  const choose = (f: number, s: number) => {
    setFi(f);
    setSi(s);
    setStep(0);
    setPlaying(false);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
      <nav aria-label={t.scenarios} className="hidden flex-col gap-8 lg:flex">
        {features.map((f, fIdx) => (
          <div key={f.uri}>
            <h2 className="text-2xl italic leading-tight">{f.name}</h2>
            <p className="mt-1 font-mono text-xs text-muted">{f.uri.replace("cypress/e2e/", "")}</p>
            <ul className="rule-top mt-3">
              {f.scenarios.map((s, sIdx) => {
                const on = fIdx === fi && sIdx === si;
                return (
                  <li key={sIdx} className="rule-bottom">
                    <button
                      type="button"
                      aria-current={on ? "true" : undefined}
                      onClick={() => choose(fIdx, sIdx)}
                      className={`grid min-h-11 w-full cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)] items-baseline gap-1 py-2 text-left text-base ${on ? "text-wine" : "text-ink hover:text-wine"}`}
                    >
                      <span aria-hidden="true" className={`font-mono text-sm ${s.status === "failed" ? "text-wine" : "text-muted"}`}>
                        {MARK[s.status] ?? "·"}
                      </span>
                      <span className={on ? "italic" : ""}>
                        {scenarioLabel(f, sIdx)}
                        <span className="sr-only"> — {t.status[s.status] ?? s.status}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <section aria-live="polite" className="flex min-w-0 flex-col gap-5 sm:gap-6 lg:sticky lg:top-6 lg:self-start">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-expanded={pickerOpen}
            className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border border-ink bg-paper px-4 py-3 text-left hover:border-wine"
          >
            <span className="min-w-0">
              <span className="block font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted">
                {t.pickScenario} · {currentPos}/{totalScenarios}
              </span>
              <span className="mt-0.5 flex items-baseline gap-2 text-base italic text-ink">
                <span aria-hidden="true" className="font-mono text-xs not-italic text-wine">
                  {scenario ? MARK[scenario.status] ?? "·" : "·"}
                </span>
                <span className="truncate">{scenario ? scenarioLabel(features[fi], si) : ""}</span>
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 font-mono text-sm text-wine">
              ▾
            </span>
          </button>
        </div>

        {live ? (
          <figure className="m-0 flex flex-col gap-2">
            <div className="relative aspect-[16/10] overflow-hidden border-l-[6px] border-wine bg-panel">
              {current?.shot ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  aria-label={t.expand}
                  title={t.expand}
                  className="block h-full w-full cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.shot} alt={`${t.step} ${step + 1}: ${current.keyword} ${current.text}`} className="h-full w-full object-contain" />
                </button>
              ) : (
                <p className="absolute inset-0 grid place-items-center font-mono text-sm text-muted">{t.noShot}</p>
              )}
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted">
                {t.step} {step + 1} {t.of} {steps.length} · {t.status[current?.status ?? "pending"] ?? current?.status} · {current?.durationMs ?? 0} ms
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => { setStep(0); setPlaying(false); }} className="min-h-11 min-w-11 cursor-pointer border border-ink px-3 font-mono text-sm hover:bg-ink hover:text-paper">
                  <span aria-hidden="true">↺</span>
                  <span className="sr-only">{t.restart}</span>
                </button>
                <button type="button" disabled={step === 0} onClick={() => { setStep((s) => Math.max(0, s - 1)); setPlaying(false); }} className="min-h-11 min-w-11 cursor-pointer border border-ink px-3 font-mono text-sm hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40">
                  <span aria-hidden="true">←</span>
                  <span className="sr-only">{t.prev}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (step >= steps.length - 1) setStep(0);
                    setPlaying((p) => !p);
                  }}
                  className="min-h-11 min-w-28 cursor-pointer bg-ink px-4 font-mono text-sm text-paper hover:bg-wine"
                >
                  {playing ? t.pause : t.play}
                </button>
                <button type="button" data-control="next" disabled={step >= steps.length - 1} onClick={() => { setStep((s) => Math.min(steps.length - 1, s + 1)); setPlaying(false); }} className="min-h-11 min-w-11 cursor-pointer border border-ink px-3 font-mono text-sm hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40">
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">{t.next}</span>
                </button>
                <button
                  type="button"
                  disabled={!current?.shot}
                  onClick={() => setExpanded(true)}
                  title={t.expand}
                  className="min-h-11 min-w-11 cursor-pointer border border-ink px-3 font-mono text-sm hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40"
                >
                  <span aria-hidden="true">⛶</span>
                  <span className="sr-only">{t.expand}</span>
                </button>
              </span>
            </figcaption>
          </figure>
        ) : (
          <div className="border-l-[6px] border-wine bg-panel p-6">
            <p className="text-2xl">{t.pendingTitle}</p>
            <p className="mt-2 max-w-[60ch] text-base text-ink">{t.pendingBody}</p>
          </div>
        )}

        <StepStaff
          steps={steps}
          step={step}
          live={live}
          onPick={(i) => {
            setStep(i);
            setPlaying(false);
          }}
        />

        <div className="min-w-0">
          <h3 className="text-3xl leading-tight">{scenario ? scenarioLabel(features[fi], si) : ""}</h3>
          <ol className="rule-top mt-4 font-mono text-sm leading-relaxed">
            {steps.map((s, i) => {
              const on = live && i === step;
              return (
                <li key={i} className={`rule-bottom ${on ? "bg-panel" : ""}`}>
                  <button
                    type="button"
                    disabled={!live}
                    onClick={() => { setStep(i); setPlaying(false); }}
                    aria-current={on ? "step" : undefined}
                    className="grid w-full min-h-11 cursor-pointer grid-cols-[1.5rem_4.5rem_minmax(0,1fr)] items-baseline gap-2 px-2 py-2 text-left disabled:cursor-default"
                  >
                    <span aria-hidden="true" className={s.status === "failed" ? "text-wine" : "text-muted"}>
                      {live && i <= step ? MARK[s.status] ?? "·" : "·"}
                    </span>
                    <span className="italic text-muted">{s.keyword}</span>
                    <span className="min-w-0 break-words">
                      <StepText text={s.text} />
                      {s.table ? (
                        <span className="mt-1 block overflow-x-auto text-xs text-muted">
                          {s.table.map((r, k) => (
                            <span key={k} className="block whitespace-pre">| {r.join(" | ")} |</span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {current?.error && live ? (
            <pre className="mt-4 overflow-x-auto border-l-[6px] border-wine bg-panel p-4 font-mono text-xs text-ink">{current.error}</pre>
          ) : null}
        </div>
      </section>

      {expanded && current?.shot ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${scenario ? scenarioLabel(features[fi], si) : ""} — ${t.step} ${step + 1} ${t.of} ${steps.length}`}
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4 text-paper sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/20 pb-3"
          >
            <div className="min-w-0 font-mono text-xs sm:text-sm">
              <span className="text-paper/70">
                {t.step} {step + 1} {t.of} {steps.length} ·{" "}
              </span>
              <span className="italic text-paper/70">{current.keyword} </span>
              <span className="break-words">{current.text}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => { setStep((s) => Math.max(0, s - 1)); setPlaying(false); }}
                className="min-h-11 min-w-11 cursor-pointer border border-paper/40 px-3 font-mono text-sm hover:bg-paper hover:text-ink disabled:cursor-default disabled:opacity-40"
              >
                <span aria-hidden="true">←</span>
                <span className="sr-only">{t.prev}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step >= steps.length - 1) setStep(0);
                  setPlaying((p) => !p);
                }}
                className="min-h-11 min-w-28 cursor-pointer bg-wine px-4 font-mono text-sm text-paper hover:bg-paper hover:text-ink"
              >
                {playing ? t.pause : t.play}
              </button>
              <button
                type="button"
                disabled={step >= steps.length - 1}
                onClick={() => { setStep((s) => Math.min(steps.length - 1, s + 1)); setPlaying(false); }}
                className="min-h-11 min-w-11 cursor-pointer border border-paper/40 px-3 font-mono text-sm hover:bg-paper hover:text-ink disabled:cursor-default disabled:opacity-40"
              >
                <span aria-hidden="true">→</span>
                <span className="sr-only">{t.next}</span>
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="ml-2 min-h-11 cursor-pointer border border-paper/40 px-4 font-mono text-sm hover:bg-paper hover:text-ink"
              >
                {t.close} <span aria-hidden="true">✕</span>
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.shot}
              alt={`${t.step} ${step + 1}: ${current.keyword} ${current.text}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain shadow-2xl"
            />
          </div>
        </div>
      ) : null}

      {pickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.pickScenario}
          onClick={() => setPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-end bg-ink/60 lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[82svh] w-full flex-col border-t-2 border-wine bg-paper text-ink"
          >
            <div className="rule-bottom flex items-center justify-between gap-4 px-5 py-3">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
                {t.pickScenario} · {totalScenarios}
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="min-h-11 cursor-pointer px-2 font-mono text-xs uppercase tracking-[0.1em] text-ink hover:text-wine"
              >
                {t.close} <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-6">
                {features.map((f, fIdx) => (
                  <div key={f.uri}>
                    <p className="text-xl italic leading-tight">{f.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">{f.uri.replace("cypress/e2e/", "")}</p>
                    <ul className="rule-top mt-2.5">
                      {f.scenarios.map((s, sIdx) => {
                        const on = fIdx === fi && sIdx === si;
                        return (
                          <li key={sIdx} className="rule-bottom">
                            <button
                              type="button"
                              aria-current={on ? "true" : undefined}
                              onClick={() => {
                                choose(fIdx, sIdx);
                                setPickerOpen(false);
                              }}
                              className={`grid min-h-11 w-full cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)] items-baseline gap-1 py-2 text-left text-base ${on ? "text-wine" : "text-ink hover:text-wine"}`}
                            >
                              <span aria-hidden="true" className={`font-mono text-sm ${s.status === "failed" ? "text-wine" : "text-muted"}`}>
                                {MARK[s.status] ?? "·"}
                              </span>
                              <span className={on ? "italic" : ""}>{scenarioLabel(f, sIdx)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
