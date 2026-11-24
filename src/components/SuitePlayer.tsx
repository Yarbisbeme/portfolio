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

  const scenario = features[fi]?.scenarios[si];
  const steps: Step[] = useMemo(() => scenario?.steps ?? [], [scenario]);
  const current = steps[step];

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
      <nav aria-label={t.scenarios} className="flex flex-col gap-8">
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

      <section aria-live="polite" className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        {live ? (
          <figure className="m-0 flex flex-col gap-2">
            <div className="relative aspect-[16/10] overflow-hidden border-l-[6px] border-wine bg-panel">
              {current?.shot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.shot} alt={`${t.step} ${step + 1}: ${current.keyword} ${current.text}`} className="h-full w-full object-cover object-top" />
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
                <button type="button" disabled={step >= steps.length - 1} onClick={() => { setStep((s) => Math.min(steps.length - 1, s + 1)); setPlaying(false); }} className="min-h-11 min-w-11 cursor-pointer border border-ink px-3 font-mono text-sm hover:bg-ink hover:text-paper disabled:cursor-default disabled:opacity-40">
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">{t.next}</span>
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
    </div>
  );
}
