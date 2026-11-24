"use client";

import { useEffect, useRef, useState } from "react";
import { diatonic, playChord, playNote } from "@/lib/sound";
import { MOTION_OK, gsap, useGSAP } from "@/lib/motion";
import type { Dictionary } from "@/content/site";

export type TuningNote = { name: string; status: string };
export type Tuning = {
  runAt: string;
  totals: { scenarios: number; passed: number; failed: number };
  notes: TuningNote[];
};

/** Altura de cada nota (en medios espacios del pentagrama): una línea melódica simple. */
const PITCH = [4, 3, 2, 3, 1, 2, 0, 1, 2, 4, 3, 5, 4, 2, 3, 1, 2, 3];
const GAP = 7; // separación entre líneas
const TOP = 14;

function System({ notes, offset, playing }: { notes: TuningNote[]; offset: number; playing: number }) {
  const step = 34;
  const width = notes.length * step + 40;
  return (
    <svg viewBox={`0 0 ${width} 66`} className="h-auto w-full" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((l) => (
        <line key={l} x1="0" x2={width} y1={TOP + l * GAP} y2={TOP + l * GAP} stroke="currentColor" strokeWidth="0.8" />
      ))}
      <line x1="0.5" x2="0.5" y1={TOP} y2={TOP + 4 * GAP} stroke="currentColor" strokeWidth="1" />
      <line x1={width - 0.5} x2={width - 0.5} y1={TOP} y2={TOP + 4 * GAP} stroke="currentColor" strokeWidth="1" />
      {notes.map((n, i) => {
        const x = 26 + i * step;
        const y = TOP + 4 * GAP - (PITCH[(offset + i) % PITCH.length] * GAP) / 2;
        const passed = n.status === "passed";
        const failed = n.status === "failed";
        return (
          <g key={n.name + i} data-tuning-note={n.status} data-playing={playing === offset + i}>
            <title>{n.name}</title>
            <ellipse
              cx={x}
              cy={y}
              rx={playing === offset + i ? 6.6 : 5.2}
              ry={playing === offset + i ? 4.8 : 3.8}
              transform={`rotate(-20 ${x} ${y})`}
              className={passed ? "fill-verify" : "fill-paper"}
              stroke={passed ? "none" : "currentColor"}
              strokeWidth="1.2"
            />
            {/* Un fallo no se distingue solo por color: lleva una cruz y queda hueco. */}
            {failed ? <path d={`M${x - 4} ${y - 9}l8 8M${x + 4} ${y - 9}l-8 8`} stroke="currentColor" strokeWidth="1.4" /> : null}
            <line x1={x + 4.8} x2={x + 4.8} y1={y - 1} y2={y - 22} stroke="currentColor" strokeWidth="0.9" />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Afinación: cada escenario de la última ejecución real en CI es una nota.
 * Lleno en vino = en verde; hueco con cruz = en rojo; hueco = no se ejecutó.
 * En móvil se parte en dos sistemas para que las notas no se aprieten.
 */
/** Altura de cada nota del pentagrama de afinación: línea inferior = mi4. */
const pitchOf = (k: number) => diatonic(64, PITCH[k % PITCH.length]);

export function TuningStaff({ d, tuning }: { d: Dictionary; tuning: Tuning }) {
  const { notes, totals } = tuning;
  const [playing, setPlaying] = useState(-1);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Al llegar, las notas aparecen una tras otra, como si se tocara la ejecución (sin sonido:
  // nada suena si el visitante no lo pide).
  const figRef = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<SVGSVGElement>("svg", figRef.current).forEach((svg) => {
          if (!svg.getBoundingClientRect().width) return;
          gsap.from(svg.querySelectorAll("[data-tuning-note]"), {
            opacity: 0,
            y: -8,
            duration: 0.35,
            stagger: 0.025,
            ease: "back.out(2)",
            scrollTrigger: { trigger: svg, start: "top 88%", once: true },
          });
        });
      });
    },
    { scope: figRef },
  );

  /**
   * Escuchar la suite: cada escenario es una nota. Lo que pasó suena afinado;
   * un fallo suena con su semitono de al lado (desafina) y la frase no resuelve.
   * Pulsar el botón es pedir el sonido, así que suena aunque el interruptor general esté apagado.
   */
  const listen = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    const beat = 0.2;
    notes.forEach((n, k) => {
      const midi = pitchOf(k);
      playNote(midi, { delay: k * beat, dur: 0.9, vel: 0.7 });
      if (n.status === "failed") playNote(midi + 1, { delay: k * beat, dur: 0.9, vel: 0.6 });
      timers.current.push(window.setTimeout(() => setPlaying(k), k * beat * 1000));
    });
    const end = notes.length * beat;
    if (totals.failed === 0) playChord([48, 60, 64, 67, 72], { delay: end, dur: 2.4, vel: 0.6 });
    else playChord([47, 59, 62, 65], { delay: end, dur: 2, vel: 0.55 });
    timers.current.push(window.setTimeout(() => setPlaying(-1), (end + 0.6) * 1000));
  };
  const half = Math.ceil(notes.length / 2);
  const date = new Intl.DateTimeFormat(d.how.tuningLocale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(tuning.runAt));
  return (
    <figure ref={figRef} className="mt-8 flex flex-col gap-3" data-tuning>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs text-muted sm:text-sm">
        <span>{d.how.tuningTitle}</span>
        <span>
          {d.how.tuningRun} · {date}
        </span>
      </figcaption>
      <div className="text-ink">
        <div className="hidden sm:block">
          <System notes={notes} offset={0} playing={playing} />
        </div>
        <div className="flex flex-col gap-4 sm:hidden">
          <System notes={notes.slice(0, half)} offset={0} playing={playing} />
          <System notes={notes.slice(half)} offset={half} playing={playing} />
        </div>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-sm">
        <strong className="font-medium text-ink" data-tuning-count>
          {totals.passed}/{totals.scenarios} {d.how.tuningPassed}
        </strong>
        {totals.failed > 0 ? (
          <span className="text-wine">
            {totals.failed} {d.how.tuningFailed}
          </span>
        ) : null}
        <button
          type="button"
          data-listen
          onClick={listen}
          disabled={playing >= 0}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 underline decoration-1 underline-offset-4 hover:text-wine disabled:cursor-default disabled:no-underline disabled:text-muted"
        >
          <span aria-hidden="true">♪</span>
          {playing >= 0 ? d.how.listening : d.how.listen}
        </button>
        <span aria-hidden="true" className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2.5 -rotate-[20deg] rounded-[50%] bg-verify" /> {d.how.tuningLegendPass}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative inline-block h-2 w-2.5 -rotate-[20deg] rounded-[50%] border border-ink" /> × {d.how.tuningLegendFail}
          </span>
        </span>
      </p>
    </figure>
  );
}
