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
