"use client";

import { useState } from "react";
import { projects, staves, type Dictionary, type Mode } from "@/content/site";
import { ContactLinks } from "./ContactLinks";
import { Media } from "./Media";
import { modes, useMode } from "./mode";

type Note = { t: string; short?: string; y: number; desktopOnly?: boolean };

/**
 * Un pentagrama. Cada nota es un botón: al tocarla/enfocarla se marcan los proyectos que la usan.
 * `isOn(nota)` decide si suena (vino) o queda en silencio (gris).
 */
function Staff({
  label,
  notes,
  isOn,
  onNote,
  usedInLabel,
}: {
  label: string;
  notes: Note[];
  isOn: (t: string) => boolean;
  onNote: (t: string | null) => void;
  usedInLabel: (t: string) => string;
}) {
  return (
    <div className="relative h-[calc(var(--gap)*4+1px)]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} aria-hidden="true" className="absolute inset-x-0 h-px bg-ink" style={{ top: `calc(var(--gap) * ${i})` }} />
      ))}
      <ul aria-label={label} data-staff={label.toLowerCase()} className="absolute inset-x-0 top-0 flex justify-between px-1 sm:px-4">
        {notes.map((n) => {
          const on = isOn(n.t);
          return (
            <li key={n.t} className={n.desktopOnly ? "hidden md:block" : "block"} style={{ marginTop: `calc(var(--gap) * ${n.y / 2} - 0.75em)` }}>
              <button
                type="button"
                data-note={n.t}
                data-sounding={on}
                aria-label={usedInLabel(n.t)}
                onMouseEnter={() => onNote(n.t)}
                onMouseLeave={() => onNote(null)}
                onFocus={() => onNote(n.t)}
                onBlur={() => onNote(null)}
                className={`flex h-[1.5em] cursor-default items-center gap-[0.4em] font-mono text-xs leading-none transition-colors duration-300 xs:text-[0.8125rem] sm:text-sm lg:text-base ${on ? "text-ink" : "text-muted"}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-[0.68em] w-[0.92em] shrink-0 -rotate-[20deg] rounded-[50%] transition-colors duration-300 ${on ? "bg-wine" : "bg-rest"}`}
                />
                <span className="bg-paper px-[0.2em]">
                  {n.short ? (
                    <>
                      <span className="md:hidden">{n.short}</span>
                      <span className="hidden md:inline">{n.t}</span>
                    </>
                  ) : (
                    n.t
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Hero({ d }: { d: Dictionary }) {
  const { mode, setMode } = useMode();
  const [active, setActive] = useState(0);
  const [focusProject, setFocusProject] = useState<number | null>(null);
  const [focusNote, setFocusNote] = useState<string | null>(null);

  const buildOn = mode !== "qa";
  const verifyOn = mode !== "backend";
  const buildSet = new Set(staves.build.map((n) => n.t));

  // Si hay un proyecto enfocado, suenan solo sus notas; si no, manda el enfoque elegido.
  const lit = focusProject !== null ? new Set(projects[focusProject].notes) : null;
  const isOn = (t: string) => (lit ? lit.has(t) : buildSet.has(t) ? buildOn : verifyOn);
  const projectsUsing = (t: string) => projects.filter((p) => p.notes.includes(t)).map((p) => p.name);
  const usedInLabel = (t: string) => `${t} — ${d.hero.usedIn}: ${projectsUsing(t).join(", ") || "—"}`;

  const pick = (i: number) => {
    setActive(i);
    setFocusProject(i);
  };
  const current = projects[active];

  return (
    <section aria-labelledby="hero-title" className="mx-auto flex min-h-[calc(100svh-3.75rem)] max-w-[90rem] flex-col justify-between px-5 pt-5 sm:px-8 sm:pt-8 lg:block lg:min-h-0 lg:px-16 lg:pt-12">
      <div className="grid flex-1 gap-8 pb-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-16 lg:pb-12">
        <div className="flex flex-1 flex-col justify-between gap-6 py-1 sm:gap-8 lg:justify-start lg:gap-10 lg:py-0">
          <div className="flex flex-col gap-3 sm:gap-6">
            <p className="kicker">
              <span className="sm:hidden">{d.hero.eyebrowShort}</span>
              <span className="hidden sm:inline">{d.hero.eyebrow}</span>
            </p>
            <h1 id="hero-title" className="text-[2.875rem] font-normal leading-[1.01] tracking-[-0.02em] xs:text-[3.375rem] sm:text-6xl lg:text-[4.75rem]">
              {d.hero.line1}
              <br />
              <em className="text-wine">{d.hero.line2}</em>
            </h1>
          </div>

          <figure className="m-0 flex gap-3 [--gap:13px] xs:[--gap:14px] sm:gap-4 lg:[--gap:15px]" aria-label={d.hero.staffLabel}>
            <div className="flex w-16 shrink-0 flex-col justify-between py-1 xs:w-20 sm:w-24 lg:w-28">
              <span className={`text-xl italic transition-colors duration-300 xs:text-2xl lg:text-3xl ${lit ? "text-ink" : buildOn ? "text-ink" : "text-muted"}`}>Build</span>
              <span className={`text-xl italic transition-colors duration-300 xs:text-2xl lg:text-3xl ${lit ? "text-ink" : verifyOn ? "text-ink" : "text-muted"}`}>Verify</span>
            </div>
            <div aria-hidden="true" className="relative w-5 shrink-0 self-stretch">
              <svg viewBox="0 0 22 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 2C8 4 12 30 11 60C10 70 6 74 2 75C6 76 10 80 11 90C12 120 8 146 20 148" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[calc(var(--gap)*3.1)] pb-1.5 sm:gap-[calc(var(--gap)*3.5)] sm:pb-2">
              <Staff label="Build" notes={staves.build} isOn={isOn} onNote={setFocusNote} usedInLabel={usedInLabel} />
              <Staff label="Verify" notes={staves.verify} isOn={isOn} onNote={setFocusNote} usedInLabel={usedInLabel} />
            </div>
          </figure>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 lg:mt-auto">
            <span id="listen-label" className="sr-only sm:not-sr-only sm:kicker">{d.hero.listen}</span>
            <div role="group" aria-labelledby="listen-label" className="grid grid-cols-3 rule-top rule-bottom sm:flex">
              {modes.map((m: Mode, i) => {
                const on = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    data-mode={m}
                    onClick={() => setMode(m)}
                    className={`min-h-[52px] cursor-pointer px-3 text-lg transition-colors xs:text-xl sm:px-7 ${i < 2 ? "border-r border-ink" : ""} ${on ? "italic text-wine underline decoration-1 underline-offset-[6px]" : "text-ink hover:text-wine"}`}
                  >
                    {d.hero.modes[m]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside aria-label={d.hero.preview} className="hidden flex-col gap-5 lg:flex">
          <figure className="m-0 flex flex-col gap-2">
            <div data-preview className="relative aspect-[4/3] overflow-hidden border-l-[6px] border-wine bg-panel">
              {projects.map((p, i) => {
                const shown = i === active;
                return (
                  <div
                    key={p.slug}
                    aria-hidden={!shown}
                    data-shown={shown}
                    className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${shown ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
                  >
                    <Media
                      name={p.image}
                      loop={p.loop}
                      play={shown}
                      alt={shown ? d.work.items[p.slug].alt : ""}
                      priority={i === 0}
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="h-full w-full"
                    />
                  </div>
                );
              })}
            </div>
            <figcaption className="flex items-baseline justify-between gap-4 font-mono text-xs text-muted">
              <span>
                {current.num} · {current.name} — {d.work.items[current.slug].period}
              </span>
              <a href={`#trabajo-${current.slug}`} className="inline-flex min-h-11 items-center text-ink underline decoration-1 underline-offset-4 hover:text-wine">
                {d.hero.seeCase} →
              </a>
            </figcaption>
          </figure>
          <nav aria-label={d.nav.work} className="rule-top" onMouseLeave={() => setFocusProject(null)}>
            <ul>
              {projects.map((p, i) => {
                const relevant = mode === "general" || p.modes.includes(mode);
                const isActive = i === active;
                const usesNote = focusNote !== null && p.notes.includes(focusNote);
                return (
                  <li key={p.slug} className="rule-bottom">
                    <button
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      data-project={p.slug}
                      data-marked={usesNote}
                      onClick={() => pick(i)}
                      onMouseEnter={() => pick(i)}
                      onFocus={() => pick(i)}
                      onBlur={() => setFocusProject(null)}
                      className={`grid min-h-[60px] w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] py-2 text-left transition-colors ${relevant || usesNote ? "text-ink" : "text-muted"}`}
                    >
                      <span className={`pt-1 font-mono text-sm ${usesNote ? "text-wine" : ""}`}>{p.num}</span>
                      <span>
                        <span
                          className={`block text-[1.375rem] leading-tight decoration-wine decoration-1 underline-offset-[5px] ${isActive ? "italic text-wine" : ""} ${usesNote ? "underline" : ""}`}
                        >
                          {p.name}
                        </span>
                        <span className="block font-mono text-xs text-muted">{d.work.items[p.slug].role}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
      <ContactLinks d={d} className="rule-top py-3 sm:py-2" />
    </section>
  );
}
