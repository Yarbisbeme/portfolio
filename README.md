# Portfolio — Yarbis Beltré Mercedes

> **«Construyo el sistema. Y demuestro que aguanta.»**

Portfolio bilingüe (`ES` / `EN`) de **Yarbis Beltré Mercedes** — Back-End Engineer (`.NET / Python`) y QA Automation (SDET) en Santo Domingo, República Dominicana.

- **Sitio en producción:** [yarbis.work](https://www.yarbis.work)
- **Suite E2E en vivo:** [`/es/automation/`](https://www.yarbis.work/es/automation/)
- **Visor de código:** [`/es/dev/`](https://www.yarbis.work/es/dev/)

---

## Quién soy

Soy desarrollador Back-End y QA Automation Engineer. Construyo APIs, microservicios y herramientas de automatización en **C# / .NET Core**, **Python / FastAPI** y **TypeScript / Next.js**, y escribo las pruebas automatizadas (**Playwright**, **WebdriverIO**, **Appium**, **Cypress + Cucumber BDD**, **xUnit**) y la observabilidad (**SigNoz**) que verifican lo que sale a producción.

Fuera del código toco el piano. Esa doble disciplina —tocar a dos manos al mismo tiempo y diseñar sistemas que se construyen y se verifican en paralelo— es la base conceptual de este portfolio.

---

## El concepto: «Partitura · Programa de concierto»

La música en este proyecto **no es decoración**: no hay claves de sol ni corcheas sueltas. Toda la interfaz obedece una misma **gramática de partitura** donde cada signo visual representa un concepto real de ingeniería de software.

El sistema se organiza en **dos voces simultáneas**:

- **Build** (`#9e2a22`, vino): lo que construyo (APIs, servicios, datos, arquitectura).
- **Verify** (`#086645`, esmeralda): cómo lo demuestro (automatización E2E, BDD, pruebas unitarias, observabilidad).

| Elemento de partitura | Qué significa en el portfolio | Implementación |
|---|---|---|
| **Gran pentagrama (`Hero`)** | Dos voces unidas por llave `{` (`Build` en clave de Sol, `Verify` en clave de Fa). Cada nota es una tecnología que se cruza con los proyectos que la usan. | `src/components/Hero.tsx` |
| **Enfoque de lectura** | Selector `General / Back-End / QA` en el Hero y en el Header (`VoiceSwitch`), persistido en `?enfoque=`. Permite escuchar ambas voces o aislar una mano. | `src/components/mode.tsx`, `src/components/VoiceSwitch.tsx` |
| **Regla única de silencio** | Lo que queda fuera del enfoque activo pasa a tono apagado (`--color-muted` / `--color-rest`), **sin usar transparencia (`opacity`)**, para preservar el contraste WCAG AA. | `src/app/globals.css`, `src/components/Score.tsx` |
| **Estructura de obra** | Las secciones usan **letras de ensayo enmarcadas** (`A`, `B`, `C`, `D`) y abren con doble barra fina (`.bar-double`); el contacto cierra con la **barra final gruesa** (`.bar-final`) y el botón `D.C.` (*Da Capo*) regresa al inicio. | `src/components/Score.tsx`, `src/components/ScoreMotion.tsx` |
| **Firma de voces (`A · Trabajo`)** | Cada proyecto indica con `VoiceSign` si es `Solo` (una voz) o `Ensamble` (ambas voces unidas por llave) y qué parte cubro dentro del equipo. | `src/components/Score.tsx`, `src/components/Sections.tsx` |
| **Corrección y Afinación (`B · Cómo trabajo`)** | Tacha clichés típicos de portfolios con trazo a lápiz rojo al hacer scroll (sin secuestrar el scroll nativo) y muestra `TuningStaff`: cada escenario real de CI dibujado como nota (llena en esmeralda = pasó; hueca con cruz = falló). | `src/components/HowIWork.tsx`, `src/components/Tuning.tsx` |
| **Ciclo (`C · Stack`)** | Las 4 áreas (`Build \| Data & APIs \| Verify \| Observe`) enmarcadas con barras de repetición (`‖: … :‖`) para representar el bucle continuo de desarrollo y verificación. | `src/components/Sections.tsx` |
| **Polifonía (`D · Sobre mí`)** | Línea de tiempo a dos voces simultáneas: *Los Hidalgos* uniendo ambas manos, seguido de *Eikôn* (`Build`) y *TMM* (`Verify`) sonando en paralelo desde diciembre de 2025. | `src/components/Polyphony.tsx` |
| **Sonido opt-in** | Motor Web Audio API apagado por defecto (`AudioContext` diferido hasta interacción explícita). Reemplazable con grabaciones reales de piano en `/audio/piano/<midi>.mp3` o síntesis de respaldo; en `TuningStaff`, los fallos suenan disonantes (semitono adjunto). | `src/lib/sound.ts` |

---

## Arquitectura técnica

### Stack principal

- **Framework:** Next.js `16.4.6` (App Router + Turbopack) configurado con `output: "export"`, `trailingSlash: true` e `images: { unoptimized: true }` para generar un sitio estático puro en `./out`.
- **UI y estilos:** React `19.3.0`, TypeScript `5`, Tailwind CSS `v4` (`@tailwindcss/turbopack`).
- **Tipografías autoalojadas:** `@fontsource/gloock` (display), `@fontsource-variable/newsreader` (editorial serif) y `@fontsource-variable/martian-mono` (mono), servidas localmente sin peticiones externas.
- **Animación:** GSAP `3.15.1` + `@gsap/react` (`ScrollTrigger`, `SplitText`, `DrawSVGPlugin`, `Flip`), condicionado a `(prefers-reduced-motion: no-preference)`.
- **Visor de código (`/dev`):** `shiki` `4.6.0` con tema personalizado *Partitura* ejecutado en `prebuild`.
- **QA y Accesibilidad:** Cypress `15.21.2`, `@badeball/cypress-cucumber-preprocessor`, `cypress-axe` + `axe-core`, `sharp` para optimización de capturas.

### Estructura del repositorio

```text
├── .github/workflows/e2e.yml       # Pipeline CI: build, serve, Cypress + reporte y commit de resultados
├── cypress/
│   ├── e2e/                        # 9 features Gherkin (01-focus .. 09-sound)
│   └── support/
│       ├── pages/HomePage.ts       # Page Object Model (único punto que consulta el DOM)
│       └── step_definitions/       # Steps BDD y hooks (captura por paso)
├── public/
│   ├── index.html                  # Redirección inicial por idioma del navegador (/es/ o /en/)
│   ├── automation/                 # results.json y capturas .webp generadas en CI
│   ├── dev-src/                    # Índice y fragmentos resaltados generados en prebuild (.txt)
│   ├── cv/                         # CVs descargables (Back-End y QA Automation)
│   └── media/                      # Imágenes responsivas (AVIF/WebP 640/1024/1600) y loops MP4
├── scripts/
│   ├── build-dev-viewer.mjs        # Genera public/dev-src/ con Shiki antes de cada build (prebuild)
│   ├── automation-report.mjs       # Convierte Cucumber messages.ndjson + PNGs en results.json + WebP
│   ├── serve-out.mjs               # Servidor estático local/CI con soporte de trailingSlash y Range (MP4)
│   └── vercel-ignore-build.sh      # Evita doble deploy en main esperando al commit chore(automation)
├── src/
│   ├── app/[lang]/
│   │   ├── layout.tsx              # Metadatos SEO/OpenGraph y rutas estáticas (es, en)
│   │   ├── page.tsx                # Portada principal (Hero, Trabajo, Cómo trabajo, Stack, Sobre mí, Coda)
│   │   ├── automation/page.tsx     # Reproductor paso a paso de la última corrida E2E
│   │   └── dev/page.tsx            # Visor de código fuente de solo lectura
│   ├── components/                 # Componentes de interfaz, partitura, animación y reproductor
│   ├── content/site.ts             # Diccionarios ES/EN, proyectos, stack y pentagramas
│   └── lib/
│       ├── env.ts                  # Lectura centralizada y estática de variables NEXT_PUBLIC_*
│       ├── automation.ts           # Lectura de results.json y parseo de .feature en build time
│       ├── motion.ts               # Configuración central de GSAP y MatchMedia
│       └── sound.ts                # Motor de audio Web Audio API y teoría diatónica mínima
├── next.config.ts
└── vercel.json
```

### Rutas especiales generadas en build

- **`/[lang]/automation/` (`SuitePlayer`):** lee `public/automation/results.json` en tiempo de compilación. Si aún no existe ejecución previa en CI, parsea los archivos `.feature` directamente con `@cucumber/gherkin` y los muestra en estado *pendiente* (nunca inventa resultados).
- **`/[lang]/dev/` (`CodeViewer`):** en `prebuild`, `scripts/build-dev-viewer.mjs` resalta los archivos del repositorio con Shiki y guarda los fragmentos como `.txt` en `public/dev-src/` (en vez de `.html`, para evitar que la regla `trailingSlash: true` de Vercel reescriba o devuelva `404` sobre archivos estáticos).

---

## El portfolio se prueba a sí mismo (QA & CI/CD)

La sección de pruebas vive dentro del propio producto usando **Cypress + Cucumber (BDD) + Page Object Model** en `cypress/`:

| Feature | Qué verifica |
|---|---|
| `01-focus.feature` | Cambio de enfoque (`Back-End`, `QA`, `General`), persistencia en `?enfoque=` y selección de CVs |
| `02-grand-staff.feature` | Interacción bidireccional entre proyectos y notas del gran pentagrama |
| `03-language.feature` | Cambio de idioma `ES ↔ EN` conservando el enfoque seleccionado |
| `04-accessibility.feature` | Auditoría `axe-core` (sin violaciones `serious`/`critical`), enlace de salto por teclado y `alt` en imágenes |
| `05-motion.feature` | Respeto estricto a `prefers-reduced-motion` en previews de video |
| `06-score-grammar.feature` | Presencia de letras de ensayo (`A`–`D`), `VoiceSign`, regla de silencio, `TuningStaff`, `D.C.` y `VoiceSwitch` |
| `07-how-i-work.feature` | Validación de que *Cómo trabajo* no secuestra el scroll nativo |
| `08-suite-and-code.feature` | Funcionamiento de `/automation/` y carga de archivos en `/dev/` |
| `09-sound.feature` | Verificación de que el sonido arranca apagado y solo responde a acciones explícitas |

### Flujo de despliegue único en CI/CD

1. Cada push a `main` dispara `.github/workflows/e2e.yml`: instala dependencias, compila `./out`, sirve el sitio con `scripts/serve-out.mjs` en `:4173` y ejecuta la suite en Chrome.
2. `scripts/automation-report.mjs` procesa `cypress/reports/messages.ndjson` y las capturas por paso (comprimidas a `.webp` con `sharp`), escribiendo `public/automation/results.json`.
3. El workflow hace commit de `public/automation/` con el mensaje `chore(automation): resultados e2e de <sha>` (requiere *Workflow permissions: Read and write* en GitHub).
4. En Vercel, `vercel.json` ejecuta `scripts/vercel-ignore-build.sh`: en `main` **solo construye los commits `chore(automation)`** para publicar una sola vez por cambio ya con las pruebas frescas adjuntas (mientras que las ramas de PR siempre generan preview).

---

## Sistema visual, accesibilidad y rendimiento

- **Paleta *Partitura* con contraste WCAG AA verificado:**
  - Papel `#f3eee4` · Panel `#e6decf`
  - Tinta `#1c1a17` sobre papel (`15.0:1`)
  - Texto apagado `#5e5850` sobre papel (`6.1:1`)
  - Vino / `Build` `#9e2a22` sobre papel (`6.5:1`)
  - Esmeralda / `Verify` `#086645` sobre papel (`6.1:1`) y panel (`5.2:1`)
- **Accesibilidad:** áreas táctiles mínimas de `44px`, enlace «saltar al contenido», `:focus-visible` de alto contraste en vino, `aria-hidden` en notación puramente visual acompañada de texto equivalente, y soporte completo de `prefers-reduced-motion`.
- **Rendimiento:** imágenes en `AVIF` y `WebP` responsivos (`640` / `1024` / `1600`), videos `<video>` en `Media.tsx` cargados bajo demanda con `IntersectionObserver`, fuentes locales y cero scripts bloqueantes de terceros.

---

## Correr en local y publicar

### Requisitos previos

- **Node.js `22.x`** y `npm`.

### Comandos principales

```bash
cp .env.example .env.local   # configura tus datos y URLs públicas
npm install

npm run dev                  # servidor de desarrollo (http://localhost:3000/es/)
npm run build                # ejecuta prebuild (visor /dev) + exporta ./out
npm run serve:out            # sirve ./out en http://localhost:4173
npm run lint                 # ejecuta ESLint

# Pruebas E2E (con serve:out corriendo en otra terminal)
npm run test:e2e             # corre Cypress + Cucumber en Chrome
npm run test:e2e:open        # abre la interfaz interactiva de Cypress
npm run report:automation    # genera public/automation/results.json + capturas WebP
```

### Variables de entorno y Vercel

1. Importa el repositorio en Vercel (**Add New → Project**); Vercel detecta Next.js automáticamente y respeta `vercel.json`.
2. En **Settings → Environment Variables**, define las variables `NEXT_PUBLIC_*` listadas en `.env.example` (`NEXT_PUBLIC_SITE_URL`, datos de contacto, enlaces de CV y textos opcionales).
3. *(Opcional)* Si deseas que GitHub Actions use los mismos valores durante `npm run build` en CI, agrégalas también en GitHub en **Settings → Secrets and variables → Actions → Variables**.
