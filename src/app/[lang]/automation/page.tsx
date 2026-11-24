import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dictionaries, locales, siteConfig, type Locale } from "@/content/site";
import { Header } from "@/components/Header";
import { ModeProvider } from "@/components/mode";
import { SuitePlayer } from "@/components/SuitePlayer";
import { loadResults, loadWrittenFeatures } from "@/lib/automation";

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export async function generateMetadata({ params }: PageProps<"/[lang]/automation">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${dictionaries[lang].automation.title} — ${siteConfig.authorName}`, description: dictionaries[lang].automation.intro };
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
  const runAt = results ? new Intl.DateTimeFormat(lang === "es" ? "es-DO" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: siteConfig.timeZone }).format(new Date(results.runAt)) : null;

  return (
    <ModeProvider>
      <Header d={d} lang={lang} />
      <main id="contenido" className="mx-auto max-w-[90rem] px-5 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-10 lg:px-16 lg:pt-14">
        <p className="kicker">{t.kicker}</p>
        <h1 className="mt-3 max-w-[18ch] text-3xl font-normal leading-[1.04] tracking-[-0.015em] sm:mt-4 sm:text-5xl lg:text-[4.25rem]">{t.title}</h1>
        <p className="mt-4 max-w-[62ch] text-base leading-relaxed sm:mt-6 sm:text-xl">{results ? t.intro : t.introPending}</p>

        <dl className="rule-top rule-bottom mt-6 grid grid-cols-3 gap-x-4 sm:mt-10 sm:gap-x-8 lg:grid-cols-6">
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
            <div key={k} className="py-3 sm:py-4">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-muted sm:text-xs sm:tracking-[0.12em]">{k}</dt>
              <dd className="mt-1 text-lg leading-tight sm:text-2xl">{v}</dd>
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

        <div className="mt-8 sm:mt-14">
          <SuitePlayer d={d} features={features} live={Boolean(results)} />
        </div>

        <p className="mt-12 font-mono text-sm sm:mt-20">
          <a href={`/${lang}/`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
            ← {t.back}
          </a>
        </p>
      </main>
    </ModeProvider>
  );
}
