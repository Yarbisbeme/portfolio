"use client";

import { contact, projects, stackGroups, type Dictionary, type Locale } from "@/content/site";
import { Media } from "./Media";
import { useMode } from "./mode";

function SectionHead({ kicker, title, intro, id }: { kicker: string; title: string; intro?: string; id: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="kicker">{kicker}</p>
      <h2 id={id} className="text-5xl font-normal leading-none lg:text-6xl">
        {title}
      </h2>
      {intro ? <p className="max-w-md text-lg text-ink">{intro}</p> : null}
    </div>
  );
}

const wrap = "mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-16";
const grid = "grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16";

export function Work({ d }: { d: Dictionary }) {
  const { mode } = useMode();
  const ordered = [...projects].sort((a, b) => {
    const ra = mode === "general" || a.modes.includes(mode) ? 0 : 1;
    const rb = mode === "general" || b.modes.includes(mode) ? 0 : 1;
    return ra - rb;
  });

  return (
    <section id="trabajo" aria-labelledby="work-title" className="rule-top py-16 lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <SectionHead id="work-title" kicker={d.work.kicker} title={d.work.title} intro={d.work.intro} />
        <ol className="rule-top">
          {ordered.map((p) => {
            const it = d.work.items[p.slug];
            const relevant = mode !== "general" && p.modes.includes(mode);
            return (
              <li key={p.slug} id={`trabajo-${p.slug}`} className={`scroll-mt-24 rule-bottom grid gap-6 py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10`}>
                <Media name={p.image} loop={p.loop} alt={it.alt} sizes="(min-width: 768px) 30vw, 100vw" className="aspect-[4/3]" />
                <div className="flex flex-col gap-3">
                  <p className="flex flex-wrap items-baseline gap-x-3 font-mono text-sm text-muted">
                    <span>{p.num}.</span>
                    <span>{it.period}</span>
                  </p>
                  <h3 className="text-3xl font-normal leading-tight lg:text-4xl">
                    {p.name} <em className="text-xl text-muted lg:text-2xl">— {it.role}</em>
                  </h3>
                  {relevant ? <p className="font-mono text-xs uppercase tracking-[0.12em] text-wine">{d.work.relevant}</p> : null}
                  <p className="max-w-[60ch]">{it.summary}</p>
                  {it.note ? <p className="text-base italic text-muted">{it.note}</p> : null}
                  <p className="font-mono text-[0.8125rem] leading-relaxed text-muted">{p.stack.join(" · ")}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function HowIWork({ d, lang }: { d: Dictionary; lang: Locale }) {
  return (
    <section id="como-trabajo" aria-labelledby="how-title" className="rule-top py-20 lg:py-32">
      <div className={`${wrap} flex flex-col items-center text-center`}>
        <p className="kicker">{d.how.kicker}</p>
        <h2 id="how-title" className="mt-4 text-5xl font-normal leading-none lg:text-6xl">
          {d.how.title}
        </h2>
        <p className="mt-4 text-lg text-muted">{d.how.intro}</p>
        <ol className="mt-14 flex w-full max-w-5xl flex-col gap-14 lg:mt-20 lg:gap-20">
          {d.how.rows.map((r) => (
            <li key={r.fix} className="flex flex-col items-center gap-3">
              <p className="text-lg text-muted lg:text-xl">
                <s className="decoration-wine decoration-2">{r.cliche}</s>
              </p>
              <p className="max-w-[24ch] text-[2rem] leading-[1.1] tracking-[-0.01em] sm:max-w-[28ch] sm:text-5xl lg:text-[3.5rem]">{r.fix}</p>
            </li>
          ))}
        </ol>
        <div className="mt-20 w-full max-w-5xl border-y border-ink py-10 text-left lg:mt-28">
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
        </div>
      </div>
    </section>
  );
}

export function Stack({ d }: { d: Dictionary }) {
  const { mode } = useMode();
  const ordered = [...stackGroups].sort((a, b) => {
    const ra = mode === "general" || (a.modes as readonly string[]).includes(mode) ? 0 : 1;
    const rb = mode === "general" || (b.modes as readonly string[]).includes(mode) ? 0 : 1;
    return ra - rb;
  });
  return (
    <section aria-labelledby="stack-title" className="rule-top py-16 lg:py-24">
      <div className={wrap}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="stack-title" className="text-5xl font-normal leading-none lg:text-6xl">
            {d.stack.title}
          </h2>
          <p className="kicker">{d.stack.kicker}</p>
        </div>
        <dl className="rule-top mt-10 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
          {ordered.map((g) => {
            return (
              <div key={g.id} className="rule-bottom py-6 lg:border-b-0">
                <dt className="text-2xl italic">{d.stack.groups[g.id]}</dt>
                <dd className="mt-4">
                  <ul className="flex flex-col gap-1.5 font-mono text-sm">
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
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

export function About({ d }: { d: Dictionary }) {
  return (
    <section id="sobre-mi" aria-labelledby="about-title" className="rule-top py-16 lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <div className="flex flex-col gap-8">
          <SectionHead id="about-title" kicker={d.about.kicker} title={d.about.title} />
          <Media name="firma-piano" alt={d.about.alt} sizes="(min-width: 1024px) 30vw, 100vw" className="aspect-[4/3] border-l-[6px] border-wine" />
        </div>
        <div className="flex flex-col gap-12">
          <div className="flex max-w-[60ch] flex-col gap-4 text-xl leading-relaxed lg:text-2xl">
            {d.about.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="kicker mb-3">{d.about.timelineTitle}</h3>
              <ol className="rule-top">
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
            <div>
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
  const cvs =
    mode === "backend"
      ? [{ href: contact.cv.backend, label: d.contact.cv }]
      : mode === "qa"
        ? [{ href: contact.cv.qa, label: d.contact.cv }]
        : [
            { href: contact.cv.backend, label: d.contact.cvBackend },
            { href: contact.cv.qa, label: d.contact.cvQa },
          ];
  return (
    <footer id="contacto" aria-labelledby="contact-title" className="rule-top bg-ink py-16 text-paper lg:py-24">
      <div className={`${wrap} ${grid}`}>
        <div className="flex flex-col gap-4">
          <p className="font-mono text-[0.8125rem] uppercase tracking-[0.12em] text-panel">{d.contact.kicker}</p>
          <h2 id="contact-title" className="text-5xl font-normal leading-none lg:text-6xl">
            {d.contact.title}
          </h2>
        </div>
        <div className="flex flex-col gap-10">
          <p className="max-w-[40ch] text-2xl leading-snug lg:text-3xl">{d.contact.body}</p>
          <a href={`mailto:${contact.email}`} className="w-fit text-2xl italic underline decoration-1 underline-offset-[6px] hover:text-panel sm:text-3xl lg:text-4xl">
            {contact.email}
          </a>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
            <li>
              <a href={contact.github} className="inline-block py-3 underline underline-offset-4" rel="me">
                GitHub
              </a>
            </li>
            <li>
              <a href={contact.linkedin} className="inline-block py-3 underline underline-offset-4" rel="me">
                LinkedIn
              </a>
            </li>
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
    </footer>
  );
}
