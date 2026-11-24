"use client";

import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/**
 * Movimiento del portfolio. Una sola regla: cada animación es algo que pasa en una partitura
 * (se traza una línea, se toca una nota, pasa un cursor, se marca una sección). Nada genérico.
 * Nunca se reemplaza el scroll nativo: todo se engancha a él.
 */
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);

/** Condición común: solo hay movimiento si el visitante no pidió reducirlo. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Quita el ocultamiento previo del hero (ver script del layout). */
export function revealPage() {
  document.documentElement.classList.remove("motion-pending");
}

/** Espera a las fuentes antes de partir texto en palabras, para que no se descuadre. */
export function afterFonts(fn: () => void) {
  if (typeof document === "undefined") return;
  if (document.fonts?.status === "loaded") fn();
  else void document.fonts?.ready.then(fn);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
