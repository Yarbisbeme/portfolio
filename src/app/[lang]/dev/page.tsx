import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contact, dictionaries, locales, siteConfig, type Locale } from "@/content/site";
import { CodeViewer } from "@/components/CodeViewer";
import { Header } from "@/components/Header";

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export async function generateMetadata({ params }: PageProps<"/[lang]/dev">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${dictionaries[lang].dev.title} — ${siteConfig.authorName}`, description: dictionaries[lang].dev.intro };
}

export default async function DevPage({ params }: PageProps<"/[lang]/dev">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  const t = d.dev;
  return (
    <>
      <Header d={d} lang={lang} />
      <main id="contenido" className="mx-auto max-w-[90rem] px-5 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-10 lg:px-16 lg:pt-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="kicker">{t.kicker}</p>
            <h1 className="mt-3 text-3xl font-normal leading-none sm:mt-4 sm:text-5xl lg:text-6xl">{t.title}</h1>
            <p className="mt-3 max-w-[60ch] text-base sm:mt-4 sm:text-lg">{t.intro}</p>
          </div>
          <p className="flex flex-wrap gap-x-8 font-mono text-sm">
            <a href={`/${lang}/automation/`} className="inline-block py-2 underline underline-offset-4 hover:text-wine sm:py-3">
              {d.nav.automation} →
            </a>
            {contact.github ? (
              <a href={contact.github} className="inline-block py-2 underline underline-offset-4 hover:text-wine sm:py-3">
                {t.github} →
              </a>
            ) : null}
          </p>
        </div>
        <div className="mt-6 sm:mt-10">
          <CodeViewer d={d} />
        </div>
        <p className="mt-10 font-mono text-sm sm:mt-12">
          <a href={`/${lang}/`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
            ← {t.back}
          </a>
        </p>
      </main>
    </>
  );
}
