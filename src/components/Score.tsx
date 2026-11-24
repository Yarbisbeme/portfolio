/**
 * Gramática de partitura compartida por toda la página (fuera del hero).
 *
 * - <Rehearsal>: letra de ensayo enmarcada. En una partitura las secciones se marcan con
 *   letras (A, B, C…), no con números de compás: un compás dura segundos, una sección muchos.
 * - Las barras se dibujan con CSS (.bar-double al abrir sección, .bar-final en la Coda).
 *
 * Nota para la suite: estos elementos usan data-rehearsal / data-bar. Nunca data-staff ni
 * data-note, que pertenecen al gran pentagrama del hero.
 */
export function Rehearsal({ mark, label }: { mark: string; label: string }) {
  return (
    <p className="flex items-center gap-3" data-rehearsal={mark}>
      <span
        aria-hidden="true"
        className="inline-flex h-9 min-w-9 items-center justify-center border-[1.5px] border-ink px-1.5 font-serif text-xl font-medium leading-none sm:h-10 sm:min-w-10 sm:text-2xl"
      >
        {mark}
      </span>
      <span className="sr-only">
        {label} {mark}
      </span>
    </p>
  );
}

/** Cabeza de nota en sonido o silencio: la misma regla visual que el hero. */
export function NoteHead({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[0.62em] w-[0.85em] shrink-0 -rotate-[20deg] rounded-[50%] transition-colors duration-300 ${on ? "bg-wine" : "bg-rest"} ${className}`}
    />
  );
}

type Voice = "build" | "verify";

/**
 * Firma de dos voces de un proyecto: Build arriba, Verify abajo. La llave solo aparece
 * cuando el proyecto toca las dos (ensamble). La cabeza de nota suena en vino si su voz
 * suena en el enfoque actual; si no, queda en gris (silencio). El texto lo dice igual.
 */
export function VoiceSign({
  voices,
  sounding,
  solo,
  ensemble,
}: {
  voices: readonly Voice[];
  sounding: (v: Voice) => boolean;
  solo: string;
  ensemble: string;
}) {
  const both = voices.includes("build") && voices.includes("verify");
  const names = voices.map((v) => (v === "build" ? "Build" : "Verify")).join(" + ");
  const head = (v: Voice, y: number) =>
    voices.includes(v) ? (
      <ellipse cx="17" cy={y} rx="3.2" ry="2.3" transform={`rotate(-20 17 ${y})`} className={`transition-colors duration-300 ${sounding(v) ? "fill-wine" : "fill-rest"}`} />
    ) : null;
  return (
    <span className="inline-flex items-center gap-2" data-voices={voices.join(" ")}>
      <svg aria-hidden="true" viewBox="0 0 28 20" width="28" height="20" className="text-ink">
        {both ? <path d="M4.5 2.5c-2 0-2 3.5-2 6 0 1-.6 1.5-1.5 1.5.9 0 1.5.5 1.5 1.5 0 2.5 0 6 2 6" fill="none" stroke="currentColor" strokeWidth="1" /> : null}
        <path d="M7 5h20M7 15h20" stroke="currentColor" strokeWidth="1" />
        {head("build", 5)}
        {head("verify", 15)}
      </svg>
      <span>
        {both ? ensemble : solo} · {names}
      </span>
    </span>
  );
}
