"use client";

import { useRef } from "react";
import { MOTION_OK, SplitText, afterFonts, gsap, useGSAP } from "@/lib/motion";

/**
 * Transiciones entre secciones, con gramática de partitura:
 * - la doble barra se traza de lado a lado al llegar a la sección,
 * - la letra de ensayo se marca como un sello,
 * - el título entra por palabras.
 * Todo se dispara una vez al entrar en pantalla; con "reducir movimiento" no hay nada.
 */
export function ScoreMotion() {
  const anchor = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, (ctx) => {
      const bars = gsap.utils.toArray<HTMLElement>(".bar-double");
      bars.forEach((el) => {
        gsap.fromTo(
          el,
          { "--bar": "0%" },
          { "--bar": "100%", duration: 1, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 92%", once: true } },
        );
      });

      gsap.utils.toArray<HTMLElement>("main [data-rehearsal] > span[aria-hidden]").forEach((mark) => {
        gsap.from(mark, {
          scale: 1.9,
          rotate: -12,
          autoAlpha: 0,
          duration: 0.55,
          ease: "back.out(2.6)",
          scrollTrigger: { trigger: mark, start: "top 88%", once: true },
        });
      });

      afterFonts(() =>
        ctx.add(() => {
          gsap.utils.toArray<HTMLElement>("main section h2, footer h2").forEach((h) => {
            if (h.closest("[data-hero]")) return;
            const split = SplitText.create(h, { type: "words" });
            gsap.from(split.words, {
              yPercent: 60,
              autoAlpha: 0,
              duration: 0.6,
              stagger: 0.06,
              ease: "power3.out",
              scrollTrigger: { trigger: h, start: "top 88%", once: true },
            });
          });
        }),
      );
    });
  });

  return <span ref={anchor} hidden />;
}
