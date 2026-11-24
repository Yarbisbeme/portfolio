"use client";

import { useState } from "react";
import { siteConfig, type Dictionary, type Locale } from "@/content/site";

export function Header({ d, lang }: { d: Dictionary; lang: Locale }) {
  const [open, setOpen] = useState(false);
  const other = lang === "es" ? "en" : "es";
  const links = [
    [`/${lang}/#trabajo`, d.nav.work],
    [`/${lang}/#como-trabajo`, d.nav.how],
    [`/${lang}/#sobre-mi`, d.nav.about],
    [`/${lang}/automation/`, d.nav.automation],
    [`/${lang}/dev/`, d.nav.code],
    [`/${lang}/#contacto`, d.nav.contact],
  ] as const;

  return (
    <header className="rule-bottom font-mono text-sm tracking-[0.03em]">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-5 py-1.5 sm:px-8 lg:px-16 lg:py-3">
        <a href={`/${lang}/`} className="py-3 font-medium no-underline">
          {siteConfig.authorName}
        </a>
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex gap-6 xl:gap-9">
            {links.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="inline-block py-3 no-underline hover:text-wine">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <a
            href={`/${other}/`}
            onClick={(e) => {
              // Conserva el enfoque (?enfoque=…) y la sección al cambiar de idioma.
              e.preventDefault();
              const rest = window.location.pathname.replace(/^\/(es|en)/, "");
              window.location.href = `/${other}${rest || "/"}${window.location.search}${window.location.hash}`;
            }}
            hrefLang={other}
            lang={other}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ink px-2 no-underline hover:bg-ink hover:text-paper"
          >
            {d.langSwitch.short}
            <span className="sr-only"> — {d.langSwitch.label}</span>
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center lg:hidden"
          >
            <span className="sr-only">{open ? d.nav.close : d.nav.menu}</span>
            <svg aria-hidden="true" width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              {open ? <path d="M4 0l14 14M18 0L4 14" /> : <path d="M0 1h22M0 7h22M0 13h22" />}
            </svg>
          </button>
        </div>
      </div>
      {open ? (
        <nav id="menu-movil" aria-label="Principal" className="rule-top lg:hidden">
          <ul className="mx-auto max-w-[90rem] px-5 sm:px-8">
            {links.map(([href, label]) => (
              <li key={href} className="rule-bottom last:border-b-0">
                <a href={href} onClick={() => setOpen(false)} className="block py-4 font-serif text-2xl no-underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
