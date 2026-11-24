"use client";

import type { Dictionary } from "@/content/site";
import { modes, useMode } from "./mode";
import { MODE_CHORD, playChord, setSoundEnabled, soundEnabled, useSoundEnabled } from "@/lib/sound";

/**
 * Las dos voces en miniatura (Build arriba, Verify abajo), con la misma regla del hero:
 * vino = suena, gris = silencio. Decorativo: el estado real lo anuncian los botones.
 */
export function VoicesGlyph({ className = "" }: { className?: string }) {
  const { mode } = useMode();
  const build = mode !== "qa";
  const verify = mode !== "backend";
  return (
    <svg aria-hidden="true" viewBox="0 0 24 16" width="24" height="16" className={className} data-voices-glyph={mode}>
      <path d="M1 4.5h22M1 11.5h22" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="12" cy="4.5" rx="3.4" ry="2.4" transform="rotate(-20 12 4.5)" className={`transition-colors duration-300 ${build ? "fill-wine" : "fill-rest"}`} />
      <ellipse cx="12" cy="11.5" rx="3.4" ry="2.4" transform="rotate(-20 12 11.5)" className={`transition-colors duration-300 ${verify ? "fill-wine" : "fill-rest"}`} />
    </svg>
  );
}

/**
 * Selector de enfoque que acompaña todo el recorrido (header). Comparte estado con el del hero.
 * Usa data-header-mode, nunca data-mode: ese atributo es del selector del hero en la suite.
 */
export function VoiceSwitch({ d, variant }: { d: Dictionary; variant: "compact" | "full" }) {
  const { mode, setMode } = useMode();
  const compact = variant === "compact";
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "flex-col items-stretch gap-3"}`}>
      <span id={`voices-${variant}`} className={compact ? "sr-only" : "kicker flex items-center gap-2"}>
        {!compact ? <VoicesGlyph className="text-ink" /> : null}
        {d.nav.voices}
      </span>
      {compact ? <VoicesGlyph className="text-ink" /> : null}
      <div role="group" aria-labelledby={`voices-${variant}`} className={`flex ${compact ? "" : "rule-top rule-bottom"}`}>
        {modes.map((m, i) => {
          const on = mode === m;
          return (
            <button
              key={m}
              type="button"
              data-header-mode={m}
              aria-pressed={on}
              onClick={() => {
                setMode(m);
                if (soundEnabled()) playChord(MODE_CHORD[m]);
              }}
              className={
                compact
                  ? `min-h-11 min-w-11 cursor-pointer px-1.5 font-mono text-xs tracking-[0.04em] ${on ? "text-wine underline decoration-1 underline-offset-4" : "text-ink hover:text-wine"}`
                  : `min-h-12 flex-1 cursor-pointer font-serif text-lg ${i < 2 ? "border-r border-ink" : ""} ${on ? "italic text-wine underline decoration-1 underline-offset-[5px]" : "text-ink"}`
              }
            >
              {d.hero.modes[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Interruptor de sonido. Apagado por defecto; se recuerda en este navegador. */
export function SoundToggle({ d, className = "" }: { d: Dictionary; className?: string }) {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      data-sound-toggle
      aria-pressed={on}
      onClick={() => {
        setSoundEnabled(!on);
        if (!on) playChord([60, 64, 67], { vel: 0.5, dur: 1.2 });
      }}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-1.5 font-mono text-xs tracking-[0.04em] hover:text-wine ${className}`}
    >
      {d.nav.sound}: <span className={on ? "text-wine underline decoration-1 underline-offset-4" : "text-muted"}>{on ? d.nav.soundOn : d.nav.soundOff}</span>
    </button>
  );
}
