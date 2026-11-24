"use client";

import { contact, type Dictionary } from "@/content/site";
import { useMode } from "./mode";

/** Email · GitHub · LinkedIn · CV según el enfoque. Se usa al pie del hero y en el contacto. */
export function ContactLinks({ d, className = "", showEmail = true }: { d: Dictionary; className?: string; showEmail?: boolean }) {
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
    <ul className={`flex flex-wrap items-center gap-x-8 gap-y-1 font-mono text-sm ${className}`}>
      {showEmail ? (
        <li>
          <a href={`mailto:${contact.email}`} className="inline-block py-3 underline decoration-1 underline-offset-4 hover:text-wine">
            {contact.email}
          </a>
        </li>
      ) : null}
      <li>
        <a href={contact.github} rel="me" className="inline-block py-3 underline decoration-1 underline-offset-4 hover:text-wine">
          GitHub
        </a>
      </li>
      <li>
        <a href={contact.linkedin} rel="me" className="inline-block py-3 underline decoration-1 underline-offset-4 hover:text-wine">
          LinkedIn
        </a>
      </li>
      <li className="flex flex-wrap gap-x-8 sm:ml-auto">
        {cvs.map((c) => (
          <a key={c.href} href={c.href} data-cv download className="inline-block py-3 text-wine underline decoration-1 underline-offset-4">
            {c.label} ↓
          </a>
        ))}
      </li>
    </ul>
  );
}
