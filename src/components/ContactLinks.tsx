"use client";

import { contact, type Dictionary } from "@/content/site";
import { useMode } from "./mode";

/** Email · GitHub · LinkedIn · CV según el enfoque. Se usa al pie del hero y en el contacto. */
export function ContactLinks({ d, className = "", showEmail = true }: { d: Dictionary; className?: string; showEmail?: boolean }) {
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
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm sm:gap-x-8 sm:gap-y-1 ${className}`}>
      {showEmail && contact.email ? (
        <li>
          <a href={`mailto:${contact.email}`} className="inline-block py-2 underline decoration-1 underline-offset-4 hover:text-wine sm:py-3">
            <span className="sm:hidden">{d.contact.emailShort}</span>
            <span className="hidden sm:inline">{contact.email}</span>
          </a>
        </li>
      ) : null}
      {contact.github ? (
        <li>
          <a href={contact.github} rel="me" className="inline-block py-2 underline decoration-1 underline-offset-4 hover:text-wine sm:py-3">
            GitHub
          </a>
        </li>
      ) : null}
      {contact.linkedin ? (
        <li>
          <a href={contact.linkedin} rel="me" className="inline-block py-2 underline decoration-1 underline-offset-4 hover:text-wine sm:py-3">
            LinkedIn
          </a>
        </li>
      ) : null}
      <li className="order-first flex w-full flex-wrap gap-2 pt-2 sm:order-none sm:ml-auto sm:w-auto sm:gap-x-8 sm:pt-0">
        {cvs.map((c) => (
          <a
            key={c.href}
            href={c.href}
            data-cv
            download
            className="inline-flex min-h-11 flex-1 items-center justify-center border border-wine bg-wine px-3.5 text-center text-paper no-underline hover:border-ink hover:bg-ink sm:inline-block sm:min-h-0 sm:flex-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-3 sm:text-left sm:text-wine sm:underline sm:decoration-1 sm:underline-offset-4 sm:hover:bg-transparent sm:hover:text-ink"
          >
            {c.label} ↓
          </a>
        ))}
      </li>
    </ul>
  );
}
