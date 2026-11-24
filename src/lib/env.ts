const read = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

/**
 * Configuración pública inyectada en build-time desde variables NEXT_PUBLIC_*.
 * Nota: Next.js solo inlinea variables públicas en cliente con acceso estático (process.env.NEXT_PUBLIC_*).
 */
export const siteConfig = {
  siteUrl: read(process.env.NEXT_PUBLIC_SITE_URL, "https://example.com"),
  authorName: read(process.env.NEXT_PUBLIC_AUTHOR_NAME, "Portfolio"),
  location: read(process.env.NEXT_PUBLIC_LOCATION, "Santo Domingo"),
  roleTitle: read(process.env.NEXT_PUBLIC_ROLE_TITLE, "Back-End & QA Automation"),
  roleTagline: read(process.env.NEXT_PUBLIC_ROLE_TAGLINE, "Back-End (.NET / Python) · QA Automation"),
  roleShort: read(process.env.NEXT_PUBLIC_ROLE_SHORT, "Back-End & QA"),
  timeZone: read(process.env.NEXT_PUBLIC_TIMEZONE, "America/Santo_Domingo"),
  contact: {
    email: read(process.env.NEXT_PUBLIC_CONTACT_EMAIL, ""),
    github: read(process.env.NEXT_PUBLIC_GITHUB_URL, ""),
    linkedin: read(process.env.NEXT_PUBLIC_LINKEDIN_URL, ""),
    cv: {
      backend: read(process.env.NEXT_PUBLIC_CV_BACKEND_URL, "/cv/yarbis-beltre-backend.pdf"),
      qa: read(process.env.NEXT_PUBLIC_CV_QA_URL, "/cv/yarbis-beltre-qa-automation.pdf"),
    },
  },
  copy: {
    es: {
      metaDescription: read(process.env.NEXT_PUBLIC_META_DESC_ES, ""),
      heroLine1: read(process.env.NEXT_PUBLIC_HERO_LINE1_ES, ""),
      heroLine2: read(process.env.NEXT_PUBLIC_HERO_LINE2_ES, ""),
      contactBody: read(process.env.NEXT_PUBLIC_CONTACT_BODY_ES, ""),
      footer: read(process.env.NEXT_PUBLIC_FOOTER_ES, ""),
    },
    en: {
      metaDescription: read(process.env.NEXT_PUBLIC_META_DESC_EN, ""),
      heroLine1: read(process.env.NEXT_PUBLIC_HERO_LINE1_EN, ""),
      heroLine2: read(process.env.NEXT_PUBLIC_HERO_LINE2_EN, ""),
      contactBody: read(process.env.NEXT_PUBLIC_CONTACT_BODY_EN, ""),
      footer: read(process.env.NEXT_PUBLIC_FOOTER_EN, ""),
    },
  },
} as const;
