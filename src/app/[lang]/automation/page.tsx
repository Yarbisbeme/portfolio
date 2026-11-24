import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionaries, locales, type Locale } from "@/content/site";
import { Header } from "@/components/Header";
import { ModeProvider } from "@/components/mode";
import { SuitePlayer } from "@/components/SuitePlayer";
import { loadResults, loadWrittenFeatures } from "@/lib/automation";

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export async function generateMetadata({ params }: PageProps<"/[lang]/automation">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${dictionaries[lang].automation.title} — Yarbis Beltré Mercedes`, description: dictionaries[lang].automation.intro };
}

const fmtMs = (ms: number) => (ms >= 60000 ? `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s` : `${(ms / 1000).toFixed(1)} s`);

export default async function AutomationPage({ params }: PageProps<"/[lang]/automation">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  const t = d.automation;
  const results = loadResults();
  const features = results?.features ?? loadWrittenFeatures();
  const written = loadWrittenFeatures();
  const totalWritten = written.reduce((n, f) => n + f.scenarios.length, 0);
  const runAt = results ? new Intl.DateTimeFormat(lang === "es" ? "es-DO" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }).format(new Date(results.runAt)) : null;

  return (
    <ModeProvider>
      <Header d={d} lang={lang} />
      <main id="contenido" className="mx-auto max-w-[90rem] px-5 pb-20 pt-10 sm:px-8 lg:px-16 lg:pt-14">
        <p className="kicker">{t.kicker}</p>
        <h1 className="mt-4 max-w-[18ch] text-5xl font-normal leading-[1.02] tracking-[-0.015em] lg:text-[4.25rem]">{t.title}</h1>
        <p className="mt-6 max-w-[62ch] text-xl leading-relaxed">{results ? t.intro : t.introPending}</p>

        <dl className="rule-top rule-bottom mt-10 grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-6">
          {(results
            ? [
                [t.lastRun, runAt],
                [t.scenarios, String(results.totals.scenarios)],
                [t.steps, String(results.totals.steps)],
                [t.passed, String(results.totals.passed)],
                [t.failed, String(results.totals.failed)],
                [t.duration, results.durationMs ? fmtMs(results.durationMs) : "—"],
              ]
            : [
                [t.lastRun, t.pendingTitle],
                [t.scenarios, String(totalWritten)],
                [t.steps, String(written.reduce((n, f) => n + f.scenarios.reduce((m, s) => m + s.steps.length, 0), 0))],
                ["Framework", "Cypress"],
                ["BDD", "Cucumber"],
                [t.pattern, "Page Object"],
              ]
          ).map(([k, v]) => (
            <div key={k} className="py-4">
              <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 text-2xl leading-tight">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 flex flex-wrap gap-x-8 font-mono text-sm">
          {results?.runUrl ? (
            <a href={results.runUrl} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
              {t.viewRun} →
            </a>
          ) : null}
          {results?.commit ? <span className="py-3 text-muted">{t.commit} {results.commit.slice(0, 7)}</span> : null}
          <a href={`/${lang}/dev/#cypress/e2e/01-focus.feature`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
            {t.readCode} →
          </a>
        </p>

        <div className="mt-14">
          <SuitePlayer d={d} features={features} live={Boolean(results)} />
        </div>

        <p className="mt-20 font-mono text-sm">
          <a href={`/${lang}/`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
            ← {t.back}
          </a>
        </p>
      </main>
    </ModeProvider>
  );
}
