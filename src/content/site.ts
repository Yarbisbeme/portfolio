import { siteConfig } from "@/lib/env";

export { siteConfig };

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export type Mode = "general" | "backend" | "qa";

export const contact = siteConfig.contact;

/** Notas del gran pentagrama: `y` = posición en semitonos (0 = línea superior). */
export const staves = {
  build: [
    { t: "C#", y: 5 },
    { t: ".NET Core", short: ".NET", y: 2 },
    { t: "ASP.NET", y: 6, desktopOnly: true },
    { t: "FastAPI", y: 3 },
    { t: "SQL Server", short: "SQL", y: 7 },
    { t: "PostgreSQL", y: 4, desktopOnly: true },
  ],
  verify: [
    { t: "Playwright", y: 4 },
    { t: "WebdriverIO", short: "WDIO", y: 7 },
    { t: "Appium", y: 3 },
    { t: "Cucumber", short: "BDD", y: 6 },
    { t: "xUnit", y: 2, desktopOnly: true },
    { t: "SigNoz", y: 5, desktopOnly: true },
  ],
};

export type Project = {
  slug: "ybank" | "eikon" | "tmm" | "los-hidalgos";
  num: string;
  name: string;
  modes: Mode[];
  stack: string[];
  image: string;
  loop?: string;
  /** Notas del pentagrama que usa este proyecto (se encienden al enfocarlo). */
  notes: string[];
};

export const projects: Project[] = [
  {
    slug: "ybank",
    num: "I",
    name: "YBank",
    modes: ["backend", "qa"],
    stack: ["Next.js", "TypeScript", "PostgreSQL / Supabase (RLS)", "n8n", "Azure / GCP", "WebdriverIO", "Appium"],
    image: "ybank",
    notes: ["PostgreSQL", "WebdriverIO", "Appium"],
  },
  {
    slug: "eikon",
    num: "II",
    name: "Eikôn",
    modes: ["backend"],
    stack: ["C#", ".NET Core", "Python / FastAPI", "SQL Server", "xUnit", "Playwright"],
    image: "eikon",
    notes: ["C#", ".NET Core", "FastAPI", "SQL Server", "xUnit", "Playwright"],
  },
  {
    slug: "tmm",
    num: "III",
    name: "TMM",
    modes: ["qa"],
    stack: ["WebdriverIO", "Appium", "Cucumber (BDD)", "POM", "Azure DevOps", "Jira · Zephyr · AIO Tests", "SigNoz"],
    image: "tmm",
    notes: ["WebdriverIO", "Appium", "Cucumber", "SigNoz"],
    loop: "/media/tmm-loop.mp4",
  },
  {
    slug: "los-hidalgos",
    num: "IV",
    name: "Los Hidalgos",
    modes: ["backend", "qa"],
    stack: ["ASP.NET", "EF Core", "SQL Server", "Dynamics 365 Business Central", "Power Automate"],
    image: "los-hidalgos",
    notes: ["C#", "ASP.NET", "SQL Server"],
    loop: "/media/los-hidalgos-loop.mp4",
  },
];

export const stackGroups = [
  { id: "build", modes: ["backend"], items: ["C#", ".NET Core", "ASP.NET", "Python (FastAPI)", "TypeScript", "Next.js"] },
  { id: "data", modes: ["backend"], items: ["SQL Server (T-SQL)", "PostgreSQL", "REST / SOAP", "Swagger / OpenAPI", "Postman", "Dynamics 365"] },
  { id: "verify", modes: ["qa"], items: ["Playwright", "WebdriverIO", "Appium", "Cucumber (BDD)", "xUnit", "Cypress", "Selenium", "Jira · Zephyr · AIO Tests"] },
  { id: "observe", modes: ["qa", "backend"], items: ["Docker", "Azure DevOps", "Azure", "GCP", "SigNoz (APM)", "n8n", "Power Automate", "Claude · Gemini · OpenCode"] },
] as const;

const es = {
  meta: {
    title: `${siteConfig.authorName} — ${siteConfig.roleTitle}`,
    description:
      siteConfig.copy.es.metaDescription ||
      `Back-End Engineer (.NET / Python) y QA Automation (SDET) en ${siteConfig.location}. Construyo el sistema y demuestro que aguanta.`,
  },
  skip: "Saltar al contenido",
  nav: { work: "Trabajo", how: "Cómo trabajo", about: "Sobre mí", contact: "Contacto", automation: "Automation", code: "Código", menu: "Menú", close: "Cerrar" },
  langSwitch: { label: "English", short: "EN", aria: "Ver el sitio en inglés" },
  hero: {
    eyebrow: `${siteConfig.roleTagline} · ${siteConfig.location}`,
    eyebrowShort: `${siteConfig.roleShort} · ${siteConfig.location}`,
    line1: siteConfig.copy.es.heroLine1 || "Construyo el sistema.",
    line2: siteConfig.copy.es.heroLine2 || "Y demuestro que aguanta.",
    staffLabel: "Mi stack en dos pentagramas: lo que construyo y cómo lo verifico",
    listen: "Leer como",
    seeCase: "Ver en Trabajo",
    usedIn: "Se usa en",
    modes: { general: "General", backend: "Back-End", qa: "QA" } as Record<Mode, string>,
    preview: "Vista del proyecto",
  },
  work: {
    kicker: "Compás 01",
    title: "Trabajo",
    intro: "Un proyecto propio y tres equipos. En los de empresa cuento mi rol, el stack y las prácticas; el producto es de ellos.",
    relevant: "Relevante para este enfoque",
    more: "Ver más",
    less: "Ver menos",
    items: {
      ybank: {
        kind: "Proyecto personal",
        role: "Diseño, desarrollo y pruebas",
        period: "Proyecto personal",
        summary: "App de finanzas personales para web y móvil: cuentas, transacciones y capital multi-moneda con la tasa de cambio a la vista. La construí y la pruebo yo, de la base de datos a la automatización móvil.",
        alt: "Bodegón: tarjeta color vino sin marcas sobre un recibo doblado, un lápiz y tres monedas, con luz de ventana.",
      },
      eikon: {
        kind: "Eikôn",
        role: "Desarrollador Web / Back-End .NET",
        period: "Oct 2025 – presente",
        note: "Entré como Consultor en Soluciones Tecnológicas; promoción interna en abril de 2026.",
        summary: "Migración de sistemas legacy de Visual FoxPro a C# / .NET Core. Automatización de la generación de código y de pruebas (xUnit, Playwright), microservicios en Python/FastAPI y SQL Server.",
        alt: "Bodegón: pila de tarjetas perforadas antiguas junto a una tecla de teclado moderna color vino.",
      },
      tmm: {
        kind: "TMM",
        role: "QA Automation & Auditoría Back-End",
        period: "Dic 2025 – presente",
        summary: "Framework de automatización POM + Cucumber BDD con WebdriverIO y Appium, integrado en Azure DevOps. Gestión de pruebas en Jira con Zephyr y AIO Tests, y observabilidad APM con SigNoz.",
        alt: "Bodegón: hoja de verificación con tres casillas marcadas en vino y una lupa de latón.",
      },
      "los-hidalgos": {
        kind: "Los Hidalgos",
        role: "Analista QA | Desarrollador",
        period: "Mar – ago 2025",
        summary: "APIs REST en ASP.NET y EF Core sobre SQL Server. Validación funcional y UAT en Microsoft Dynamics 365 Business Central, con automatizaciones en Power Automate.",
        alt: "Bodegón: bloc de formularios con un clip de latón y un sello de goma con mango color vino.",
      },
    } as Record<Project["slug"], { kind: string; role: string; period: string; note?: string; summary: string; alt: string }>,
  },
  how: {
    kicker: "Compás 02",
    title: "Cómo trabajo",
    intro: "Lo que suelen decir los portfolios, corregido en rojo.",
    rows: [
      { cliche: "Apasionado por transformar ideas en soluciones escalables.", fix: "Construyo APIs y motores de automatización en .NET y Python." },
      { cliche: "Garantizo calidad de clase mundial.", fix: "Escribo las pruebas automatizadas que verifican lo que construyo." },
      { cliche: "Enfocado en resultados.", fix: "Miro lo que pasa en producción con observabilidad, no con suposiciones." },
    ],
    proofTitle: "Este sitio se prueba a sí mismo.",
    proofBody: "En cada publicación, una suite de Cypress + Cucumber (BDD) con Page Objects recorre este portfolio y deja el resultado a la vista. Es la única evidencia de código que puedo mostrarte completa.",
    proofSuite: "Ver la suite en acción",
    proofCode: "Leer el código",
  },
  stack: {
    kicker: "Compás 03",
    title: "Stack por función",
    other: "Ver el resto del stack",
    groups: { build: "Build", data: "Data & APIs", verify: "Verify", observe: "Automate & Observe" } as Record<string, string>,
  },
  about: {
    kicker: "Compás 04",
    title: "Sobre mí",
    body: [
      "Soy dominicano, de Santo Domingo. Fuera del código toco el piano, y soy cristiano: las dos cosas me ordenan tanto como cualquier metodología.",
      "Y cuando hay pelota, voy con los Leones del Escogido.",
    ],
    alt: "Teclado de piano con la cinta de fieltro color vino sobre las teclas, iluminado por una ventana.",
    timelineTitle: "Trayectoria",
    timeline: [
      { when: "Abr 2026 – hoy", what: "Desarrollador Web / Back-End .NET", where: "Eikôn" },
      { when: "Dic 2025 – hoy", what: "QA Automation & Auditoría Back-End", where: "TMM" },
      { when: "Oct 2025 – abr 2026", what: "Consultor en Soluciones Tecnológicas", where: "Eikôn" },
      { when: "Mar – ago 2025", what: "Analista QA | Desarrollador", where: "Los Hidalgos" },
    ],
    eduTitle: "Formación",
    edu: [
      "Tecnólogo en Desarrollo de Software — ITLA (Índice A)",
      "Diplomado en SQL — ITLA",
      "Técnico en Inteligencia Artificial — INFOTEP",
      "Desarrollo de Software — Talento Digital (en curso)",
      "Técnico en Telecomunicaciones — IPL",
    ],
  },
  automation: {
    title: "La suite que prueba este sitio",
    kicker: "Automation · Cypress + Cucumber + POM",
    intro: "Cada vez que publico, GitHub Actions compila el portfolio, lo sirve y corre estos escenarios en Chrome. Lo de abajo es el resultado real de la última ejecución, con una captura por paso.",
    introPending: "Cada vez que publico, GitHub Actions compila el portfolio, lo sirve y corre estos escenarios en Chrome con Cypress y Cucumber, sobre Page Objects.",
    pattern: "Patrón",
    linesReadOnly: "líneas · solo lectura",
    lastRun: "Última ejecución",
    scenarios: "escenarios",
    steps: "pasos",
    passed: "en verde",
    failed: "en rojo",
    duration: "duración",
    commit: "commit",
    viewRun: "Ver la ejecución en GitHub",
    pendingTitle: "Pendiente de la primera ejecución",
    pendingBody: "La suite ya está escrita y conectada al pipeline. En cuanto corra por primera vez en GitHub Actions, aquí aparecen los resultados reales y el reproductor. Mientras tanto, estos son los escenarios tal como están escritos.",
    play: "Reproducir",
    pause: "Pausar",
    prev: "Paso anterior",
    next: "Paso siguiente",
    restart: "Desde el inicio",
    step: "Paso",
    of: "de",
    noShot: "Sin captura para este paso",
    expand: "Pantalla completa",
    close: "Cerrar",
    pickScenario: "Elegir escenario",
    status: { passed: "pasó", failed: "falló", skipped: "omitido", pending: "pendiente", undefined: "sin definir", ambiguous: "ambiguo" } as Record<string, string>,
    readCode: "Leer el código de la suite",
    back: "Volver al portfolio",
  },
  dev: {
    title: "Código",
    kicker: "Solo lectura",
    intro: "El código de este portfolio, incluida la suite de pruebas. Elige un archivo.",
    files: "Archivos",
    pickFile: "Elegir archivo",
    loading: "Cargando…",
    error: "No se pudo cargar el archivo.",
    github: "Repositorio en GitHub",
    back: "Volver al portfolio",
  },
  contact: {
    kicker: "Coda",
    title: "Hablemos",
    body: siteConfig.copy.es.contactBody || "Si tu equipo necesita a alguien que construya el back-end y además lo pruebe, escríbeme.",
    emailShort: "Email",
    cv: "Descargar CV",
    cvBackend: "CV Back-End",
    cvQa: "CV QA Automation",
    footer: siteConfig.copy.es.footer || `Hecho en ${siteConfig.location} con Next.js. Imágenes editoriales generadas con IA.`,
  },
};

type Dict = typeof es;

const en: Dict = {
  meta: {
    title: `${siteConfig.authorName} — ${siteConfig.roleTitle}`,
    description:
      siteConfig.copy.en.metaDescription ||
      `Back-End Engineer (.NET / Python) and QA Automation (SDET) based in ${siteConfig.location}. I build the system and prove it holds.`,
  },
  skip: "Skip to content",
  nav: { work: "Work", how: "How I work", about: "About", contact: "Contact", automation: "Automation", code: "Code", menu: "Menu", close: "Close" },
  langSwitch: { label: "Español", short: "ES", aria: "View the site in Spanish" },
  hero: {
    eyebrow: `${siteConfig.roleTagline} · ${siteConfig.location}`,
    eyebrowShort: `${siteConfig.roleShort} · ${siteConfig.location}`,
    line1: siteConfig.copy.en.heroLine1 || "I build the system.",
    line2: siteConfig.copy.en.heroLine2 || "And prove it holds.",
    staffLabel: "My stack on two staves: what I build and how I verify it",
    listen: "Read as",
    seeCase: "See in Work",
    usedIn: "Used in",
    modes: { general: "General", backend: "Back-End", qa: "QA" },
    preview: "Project preview",
  },
  work: {
    kicker: "Bar 01",
    title: "Work",
    intro: "One project of my own and three teams. For company work I describe my role, stack and practices; the product is theirs.",
    relevant: "Relevant to this focus",
    more: "Read more",
    less: "Show less",
    items: {
      ybank: {
        kind: "Personal project",
        role: "Design, development and testing",
        period: "Personal project",
        summary: "A personal finance app for web and mobile: accounts, transactions and multi-currency balances with the exchange rate in plain sight. I built it and I test it, from the database to mobile automation.",
        alt: "Still life: an unbranded wine-red card on a folded receipt, a pencil and three coins in window light.",
      },
      eikon: {
        kind: "Eikôn",
        role: "Web / Back-End .NET Developer",
        period: "Oct 2025 – present",
        note: "Joined as Technology Solutions Consultant; promoted internally in April 2026.",
        summary: "Migrating legacy Visual FoxPro systems to C# / .NET Core. Automated code and test generation (xUnit, Playwright), Python/FastAPI microservices and SQL Server.",
        alt: "Still life: a stack of vintage punched cards next to a modern wine-red keyboard keycap.",
      },
      tmm: {
        kind: "TMM",
        role: "QA Automation & Back-End Auditing",
        period: "Dec 2025 – present",
        summary: "POM + Cucumber BDD automation framework with WebdriverIO and Appium, wired into Azure DevOps. Test management in Jira with Zephyr and AIO Tests, plus APM observability with SigNoz.",
        alt: "Still life: a checklist with three boxes ticked in wine red and a brass loupe.",
      },
      "los-hidalgos": {
        kind: "Los Hidalgos",
        role: "QA Analyst | Developer",
        period: "Mar – Aug 2025",
        summary: "REST APIs in ASP.NET and EF Core on SQL Server. Functional validation and UAT in Microsoft Dynamics 365 Business Central, with Power Automate flows.",
        alt: "Still life: a pad of forms with a brass clip and a rubber stamp with a wine-red handle.",
      },
    },
  },
  how: {
    kicker: "Bar 02",
    title: "How I work",
    intro: "What portfolios usually say, corrected in red.",
    rows: [
      { cliche: "Passionate about turning ideas into scalable solutions.", fix: "I build APIs and automation engines in .NET and Python." },
      { cliche: "I guarantee world-class quality.", fix: "I write the automated tests that verify what I build." },
      { cliche: "Results-driven.", fix: "I watch production through observability, not assumptions." },
    ],
    proofTitle: "This site tests itself.",
    proofBody: "On every deploy, a Cypress + Cucumber (BDD) suite built on Page Objects walks through this portfolio and leaves the result in plain sight. It is the one piece of code I can show you in full.",
    proofSuite: "See the suite run",
    proofCode: "Read the code",
  },
  stack: {
    kicker: "Bar 03",
    title: "Stack by function",
    other: "See rest of stack",
    groups: { build: "Build", data: "Data & APIs", verify: "Verify", observe: "Automate & Observe" },
  },
  about: {
    kicker: "Bar 04",
    title: "About",
    body: [
      "I'm Dominican, from Santo Domingo. Outside of code I play the piano, and I'm a Christian: both keep me as grounded as any methodology.",
      "And when there's baseball, I'm with the Leones del Escogido.",
    ],
    alt: "Piano keyboard with the wine-red felt strip across the keys, lit by a window.",
    timelineTitle: "Experience",
    timeline: [
      { when: "Apr 2026 – now", what: "Web / Back-End .NET Developer", where: "Eikôn" },
      { when: "Dec 2025 – now", what: "QA Automation & Back-End Auditing", where: "TMM" },
      { when: "Oct 2025 – Apr 2026", what: "Technology Solutions Consultant", where: "Eikôn" },
      { when: "Mar – Aug 2025", what: "QA Analyst | Developer", where: "Los Hidalgos" },
    ],
    eduTitle: "Education",
    edu: [
      "Software Development Technologist — ITLA (GPA: A)",
      "SQL Diploma — ITLA",
      "Artificial Intelligence Technician — INFOTEP",
      "Software Development — Talento Digital (in progress)",
      "Telecommunications Technician — IPL",
    ],
  },
  automation: {
    title: "The suite that tests this site",
    kicker: "Automation · Cypress + Cucumber + POM",
    intro: "Every time I deploy, GitHub Actions builds the portfolio, serves it and runs these scenarios in Chrome. What you see below is the real result of the latest run, with a screenshot per step.",
    introPending: "Every time I deploy, GitHub Actions builds the portfolio, serves it and runs these scenarios in Chrome with Cypress and Cucumber, on top of Page Objects.",
    pattern: "Pattern",
    linesReadOnly: "lines · read-only",
    lastRun: "Latest run",
    scenarios: "scenarios",
    steps: "steps",
    passed: "passing",
    failed: "failing",
    duration: "duration",
    commit: "commit",
    viewRun: "See the run on GitHub",
    pendingTitle: "Waiting for the first run",
    pendingBody: "The suite is written and wired into the pipeline. As soon as it runs for the first time on GitHub Actions, the real results and the player show up here. Meanwhile, these are the scenarios exactly as written.",
    play: "Play",
    pause: "Pause",
    prev: "Previous step",
    next: "Next step",
    restart: "From the start",
    step: "Step",
    of: "of",
    noShot: "No screenshot for this step",
    expand: "Fullscreen",
    close: "Close",
    pickScenario: "Choose scenario",
    status: { passed: "passed", failed: "failed", skipped: "skipped", pending: "pending", undefined: "undefined", ambiguous: "ambiguous" },
    readCode: "Read the suite's code",
    back: "Back to the portfolio",
  },
  dev: {
    title: "Code",
    kicker: "Read-only",
    intro: "The source of this portfolio, test suite included. Pick a file.",
    files: "Files",
    pickFile: "Choose file",
    loading: "Loading…",
    error: "The file could not be loaded.",
    github: "Repository on GitHub",
    back: "Back to the portfolio",
  },
  contact: {
    kicker: "Coda",
    title: "Let's talk",
    body: siteConfig.copy.en.contactBody || "If your team needs someone who builds the back end and also tests it, write to me.",
    emailShort: "Email",
    cv: "Download CV",
    cvBackend: "Back-End CV",
    cvQa: "QA Automation CV",
    footer: siteConfig.copy.en.footer || `Made in ${siteConfig.location} with Next.js. Editorial still-life imagery generated with AI.`,
  },
};

export const dictionaries: Record<Locale, Dict> = { es, en };
export type Dictionary = Dict;
