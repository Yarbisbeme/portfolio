"use client";

import { useState } from "react";
import { contact, projects, stackGroups, type Dictionary } from "@/content/site";
import { Media } from "./Media";
import { NoteHead, Rehearsal, VoiceSign } from "./Score";
import { Polyphony } from "./Polyphony";
import { useMode } from "./mode";

function SectionHead({
  kicker,
  label,
  title,
  intro,
  id,
  hideIntroMobile = false,
}: {
  kicker: string;
  label: string;
  title: string;
  intro?: string;
  id: string;
  hideIntroMobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <Rehearsal mark={kicker} label={label} />
      <h2 id={id} className="text-4xl font-normal leading-tight xs:text-[2.625rem] sm:text-5xl lg:text-6xl lg:leading-none">
        {title}
      </h2>
      {intro ? <p className={`max-w-md text-base text-muted sm:text-lg sm:text-ink ${hideIntroMobile ? "hidden sm:block" : ""}`}>{intro}</p> : null}
    </div>
  );
}

const wrap = "mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-16";
const grid = "grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16";

export function Work({ d }: { d: Dictionary }) {
  const { mode } = useMode();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ordered = [...projects].sort((a, b) => {
    const ra = mode === "general" || a.modes.includes(mode) ? 0 : 1;
    const rb = mode === "general" || b.modes.includes(mode) ? 0 : 1;
    return ra - rb;
  });

  return (
    <section id="trabajo" aria-labelledby="work-title" className="bar-double py-10 sm:py-16 lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <SectionHead id="work-title" kicker={d.work.kicker} label={d.nav.section} title={d.work.title} intro={d.work.intro} hideIntroMobile />
        <ol className="rule-top">
          {ordered.map((p) => {
            const it = d.work.items[p.slug];
            const relevant = mode !== "general" && p.modes.includes(mode);
            const silent = mode !== "general" && !p.modes.includes(mode);
            const isOpen = Boolean(expanded[p.slug]);
            return (
              <li key={p.slug} id={`trabajo-${p.slug}`} data-work={p.slug} data-silent={silent} className="scroll-mt-24 rule-bottom grid gap-4 py-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 md:py-8">
                <Media name={p.image} loop={p.loop} alt={it.alt} sizes="(min-width: 768px) 30vw, 100vw" className={`aspect-[16/9] transition-[filter] duration-500 md:aspect-[4/3] ${silent ? "grayscale-[0.85]" : ""}`} />
                <div className={`flex flex-col gap-2 sm:gap-3 ${relevant ? "border-l-[3px] border-wine pl-3 sm:border-l-0 sm:pl-0" : ""}`}>
                  <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-sm text-muted">
                    <span>{p.num}.</span>
                    <span>{it.period}</span>
                    <span className="basis-full text-xs sm:ml-auto sm:basis-auto">
                      <VoiceSign
                        voices={p.modes.map((m) => (m === "backend" ? "build" : "verify"))}
                        sounding={(v) => mode === "general" || (v === "build" ? mode === "backend" : mode === "qa")}
                        solo={d.work.solo}
                        ensemble={d.work.ensemble}
                      />
                    </span>
                  </p>
                  <h3 className={`flex flex-wrap items-baseline gap-x-2 text-2xl font-normal leading-tight transition-colors duration-300 sm:text-3xl lg:text-4xl ${silent ? "text-muted" : ""}`}>
                    <NoteHead on={!silent} className="self-center text-base sm:text-lg" />
                    {p.name}{" "}
                    {silent ? <span className="sr-only">({d.nav.silent})</span> : null}
                    <em className="mt-0.5 block text-base text-muted sm:mt-0 sm:inline sm:text-xl lg:text-2xl">
                      <span className="hidden sm:inline">— </span>
                      {it.role}
                    </em>
                  </h3>
                  {relevant ? <p className="hidden font-mono text-xs uppercase tracking-[0.12em] text-wine sm:block">{d.work.relevant}</p> : null}
                  <p className={`max-w-[60ch] text-[0.9375rem] leading-relaxed md:text-base ${isOpen ? "" : "line-clamp-2 md:line-clamp-none"}`}>
                    {it.summary}
                  </p>
                  {it.note ? (
                    <p className={`text-sm italic text-muted md:text-base ${isOpen ? "" : "hidden md:block"}`}>{it.note}</p>
                  ) : null}
                  {isOpen ? (
                    <ul className="flex flex-wrap gap-1.5 pt-1 md:hidden">
                      {p.stack.map((tech) => (
                        <li key={tech} className="bg-panel px-2.5 py-0.5 font-mono text-xs text-ink">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="hidden font-mono text-[0.8125rem] leading-relaxed text-muted md:block">{p.stack.join(" · ")}</p>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded((prev) => ({ ...prev, [p.slug]: !prev[p.slug] }))}
                    className="inline-flex min-h-11 w-fit cursor-pointer items-center font-mono text-xs uppercase tracking-[0.08em] text-wine underline underline-offset-4 md:hidden"
                  >
                    {isOpen ? d.work.less : d.work.more}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export { HowIWork } from "./HowIWork";

export function Stack({ d }: { d: Dictionary }) {
  const { mode } = useMode();
  const ordered = [...stackGroups].sort((a, b) => {
    const ra = mode === "general" || (a.modes as readonly string[]).includes(mode) ? 0 : 1;
    const rb = mode === "general" || (b.modes as readonly string[]).includes(mode) ? 0 : 1;
    return ra - rb;
  });
  const primary = mode === "general" ? ordered : ordered.filter((g) => (g.modes as readonly string[]).includes(mode));
  const rest = mode === "general" ? [] : ordered.filter((g) => !(g.modes as readonly string[]).includes(mode));

  return (
    <section aria-labelledby="stack-title" className="bar-double py-10 sm:py-16 lg:py-24">
      <div className={wrap}>
        <div className="flex flex-col gap-3 sm:gap-4">
          <Rehearsal mark={d.stack.kicker} label={d.nav.section} />
          <h2 id="stack-title" className="text-4xl font-normal leading-tight xs:text-[2.625rem] sm:text-5xl lg:text-6xl lg:leading-none">
            {d.stack.title}
          </h2>
        </div>

        <div className="rule-top mt-6 sm:hidden">
          {primary.map((g) => (
            <div key={g.id} className="rule-bottom py-4">
              <p className="text-xl italic">{d.stack.groups[g.id]}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs">
                {g.items.map((it) => (
                  <li key={it} className="bg-panel px-2.5 py-1 text-ink">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {rest.length > 0 ? (
            <details className="group rule-bottom">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-3 font-mono text-xs uppercase tracking-[0.12em] text-ink">
                <span>{d.stack.other}</span>
                <span aria-hidden="true" className="text-wine transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="flex flex-col gap-4 pb-4">
                {rest.map((g) => (
                  <div key={g.id}>
                    <p className="text-lg italic">{d.stack.groups[g.id]}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5 font-mono text-xs">
                      {g.items.map((it) => (
                        <li key={it} className="bg-panel px-2.5 py-1 text-ink">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <dl className="rule-top mt-10 hidden gap-x-10 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((g) => {
            const silent = mode !== "general" && !(g.modes as readonly string[]).includes(mode);
            return (
              <div key={g.id} data-stack={g.id} data-silent={silent} className="rule-bottom py-6 lg:border-b-0">
                <dt className={`flex items-baseline gap-2 text-2xl italic transition-colors duration-300 ${silent ? "text-muted" : ""}`}>
                  <NoteHead on={!silent} className="self-center text-lg" />
                  {d.stack.groups[g.id]}
                  {silent ? <span className="sr-only">({d.nav.silent})</span> : null}
                </dt>
                <dd className="mt-4">
                  <ul className={`flex flex-wrap gap-1.5 font-mono text-sm transition-colors duration-300 lg:flex-col lg:gap-1.5 ${silent ? "text-muted" : "text-ink"}`}>
                    {g.items.map((it) => (
                      <li key={it} className="bg-panel px-2.5 py-1 lg:bg-transparent lg:p-0">
                        {it}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

export function About({ d, now }: { d: Dictionary; now: string }) {
  return (
    <section id="sobre-mi" aria-labelledby="about-title" className="bar-double py-10 sm:py-16 lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <div className="flex flex-col gap-5 sm:gap-8">
          <SectionHead id="about-title" kicker={d.about.kicker} label={d.nav.section} title={d.about.title} />
          <Media name="firma-piano" alt={d.about.alt} sizes="(min-width: 1024px) 30vw, 100vw" className="aspect-[21/9] border-l-[6px] border-wine md:aspect-[4/3]" />
        </div>
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="flex max-w-[60ch] flex-col gap-3 text-base leading-relaxed sm:gap-4 sm:text-xl lg:text-2xl">
            {d.about.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>


          <Polyphony d={d} now={now} />

          <div className="flex flex-col md:hidden">
            <details className="group rule-top rule-bottom">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-3 font-mono text-xs uppercase tracking-[0.12em] text-ink">
                <span>{d.about.eduTitle}</span>
                <span aria-hidden="true" className="text-wine transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ul className="pb-4">
                {d.about.edu.map((e) => (
                  <li key={e} className="rule-top py-2.5 text-sm">
                    {e}
                  </li>
                ))}
              </ul>
            </details>
          </div>

          <div className="gap-10 md:grid md:grid-cols-2">
            <div className="sr-only md:not-sr-only">
              <h3 className="kicker mb-3">{d.about.timelineTitle}</h3>
              <ol className="rule-top" data-timeline>
                {d.about.timeline.map((t) => (
                  <li key={t.when + t.what} className="rule-bottom py-3">
                    <p className="font-mono text-xs text-muted">{t.when}</p>
                    <p>
                      {t.what} <span className="italic text-muted">— {t.where}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="hidden md:block">
              <h3 className="kicker mb-3">{d.about.eduTitle}</h3>
              <ul className="rule-top">
                {d.about.edu.map((e) => (
                  <li key={e} className="rule-bottom py-3">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact({ d }: { d: Dictionary }) {
  const { mode } = useMode();
  const cvs = (
    mode === "backend"
      ? [{ href: contact.cv.backend, label: d.contact.cv }]
      : mode === "qa"
        ? [{ href: contact.cv.qa, label: d.contact.cv }]
        : [
            { href: contact.cv.backend, label: d.contact.cvBackend },
            { href: contact.cv.qa, label: d.contact.cvQa },
          ]
  ).filter((c) => Boolean(c.href));
  return (
    <footer id="contacto" aria-labelledby="contact-title" className="rule-top bg-ink py-12 text-paper sm:py-16 lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-panel">{d.contact.kicker}</p>
          <h2 id="contact-title" className="text-4xl font-normal leading-tight xs:text-[2.625rem] sm:text-5xl lg:text-6xl lg:leading-none">
            {d.contact.title}
          </h2>
        </div>
        <div className="flex flex-col gap-7 sm:gap-10">
          <p className="max-w-[40ch] text-xl leading-snug sm:text-2xl lg:text-3xl">{d.contact.body}</p>
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="w-fit break-all text-xl italic underline decoration-1 underline-offset-[6px] hover:text-panel sm:text-3xl lg:text-4xl">
              {contact.email}
            </a>
          ) : null}
          <ul className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
            {contact.github ? (
              <li>
                <a href={contact.github} className="inline-block py-3 underline underline-offset-4" rel="me">
                  GitHub
                </a>
              </li>
            ) : null}
            {contact.linkedin ? (
              <li>
                <a href={contact.linkedin} className="inline-block py-3 underline underline-offset-4" rel="me">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {cvs.map((c) => (
              <li key={c.href}>
                <a href={c.href} download className="inline-block py-3 underline underline-offset-4">
                  {c.label} ↓
                </a>
              </li>
            ))}
          </ul>
          <p className="font-mono text-xs text-panel">{d.contact.footer}</p>
        </div>
      </div>
      <div className={`${wrap} mt-12 sm:mt-16`}>
        <span aria-hidden="true" data-bar="final" className="bar-final text-panel" />
        <p className="mt-3 flex justify-end font-mono text-sm">
          <a href="#top" data-dc className="inline-flex min-h-11 items-center gap-2 underline decoration-1 underline-offset-4 hover:text-panel">
            {d.contact.dc} <span aria-hidden="true">↑</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
