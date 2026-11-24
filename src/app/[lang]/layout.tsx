import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { dictionaries, locales, type Locale } from "@/content/site";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yarbis.work";

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionaries[lang];
  return {
    metadataBase: new URL(siteUrl),
    title: d.meta.title,
    description: d.meta.description,
    alternates: { languages: { es: "/es/", en: "/en/" } },
    openGraph: {
      title: d.meta.title,
      description: d.meta.description,
      locale: lang === "es" ? "es_DO" : "en_US",
      type: "website",
      images: [{ url: "/media/og.jpg", width: 1200, height: 630 }],
    },
    icons: { icon: "/favicon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#f3eee4" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
