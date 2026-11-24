import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { contact, dictionaries, locales, type Locale } from "@/content/site";
import { CodeViewer } from "@/components/CodeViewer";
import { Header } from "@/components/Header";

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export async function generateMetadata({ params }: PageProps<"/[lang]/dev">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${dictionaries[lang].dev.title} — Yarbis Beltré Mercedes`, description: dictionaries[lang].dev.intro };
}

export default async function DevPage({ params }: PageProps<"/[lang]/dev">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = dictionaries[lang];
  const t = d.dev;
  return (
    <>
      <Header d={d} lang={lang} />
      <main id="contenido" className="mx-auto max-w-[90rem] px-5 pb-20 pt-10 sm:px-8 lg:px-16 lg:pt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="kicker">{t.kicker}</p>
            <h1 className="mt-4 text-5xl font-normal leading-none lg:text-6xl">{t.title}</h1>
            <p className="mt-4 max-w-[60ch] text-lg">{t.intro}</p>
          </div>
          <p className="flex flex-wrap gap-x-8 font-mono text-sm">
            <a href={`/${lang}/automation/`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
              {d.nav.automation} →
            </a>
            <a href={contact.github} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
              {t.github} →
            </a>
          </p>
        </div>
        <div className="mt-10">
          <CodeViewer d={d} />
        </div>
        <p className="mt-12 font-mono text-sm">
          <a href={`/${lang}/`} className="inline-block py-3 underline underline-offset-4 hover:text-wine">
            ← {t.back}
          </a>
        </p>
      </main>
    </>
  );
}
