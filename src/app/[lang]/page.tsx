import { notFound } from "next/navigation";
import { dictionaries, locales, type Locale } from "@/content/site";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ModeProvider } from "@/components/mode";
import { About, Contact, HowIWork, Stack, Work } from "@/components/Sections";
import type { Tuning } from "@/components/Tuning";
import { loadResults } from "@/lib/automation";
import { ScoreMotion } from "@/components/ScoreMotion";

function loadTuning(): Tuning | null {
  const r = loadResults();
  if (!r) return null;
  return {
    runAt: r.runAt,
    totals: { scenarios: r.totals.scenarios, passed: r.totals.passed, failed: r.totals.failed },
    notes: r.features.flatMap((f) => f.scenarios.map((s) => ({ name: s.name, status: s.status }))),
  };
}

export default async function Page({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!(locales as readonly string[]).includes(lang)) notFound();
  const d = dictionaries[lang as Locale];

  return (
    <ModeProvider>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper">
        {d.skip}
      </a>
      <Header d={d} lang={lang as Locale} />
      <main id="contenido">
        <Hero d={d} />
        <Work d={d} />
        <HowIWork d={d} lang={lang as Locale} tuning={loadTuning()} />
        <Stack d={d} />
        <About d={d} now={new Date().toISOString().slice(0, 7)} />
      </main>
      <Contact d={d} />
      <ScoreMotion />
    </ModeProvider>
  );
}
