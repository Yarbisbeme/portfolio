# Portfolio — Yarbis Beltré Mercedes

Back-End (.NET / Python) & QA Automation. Next.js (App Router) + TypeScript + Tailwind CSS v4, exportado como sitio estático.

## Correr en local

```bash
cp .env.example .env.local   # completa tus datos y URLs públicas
npm install
npm run dev                  # http://localhost:3000/es/
npm run build                # genera ./out (sitio estático)
```

## Publicar en Vercel

1. Sube este proyecto a un repo de GitHub.
2. En Vercel: **Add New → Project**, importa el repo. No hay que cambiar nada: Vercel detecta Next.js.
3. En **Settings → Environment Variables**, agrega las variables `NEXT_PUBLIC_*` definidas en `.env.example` (incluida `NEXT_PUBLIC_SITE_URL` con tu dominio real, por ejemplo `https://tudominio.com`). Si además corres E2E en GitHub Actions, puedes definirlas en *Settings → Secrets and variables → Actions → Variables*.

## Dónde se edita cada cosa

| Qué | Dónde |
|---|---|
| Todos los textos (ES y EN), proyectos, stack, trayectoria | `src/content/site.ts` |
| Notas del gran pentagrama (Build / Verify) | `staves` en `src/content/site.ts` |
| Colores y tipografías | `src/app/globals.css` (`@theme`) |
| Hero, selector y vista previa de proyectos | `src/components/Hero.tsx` |
| Secciones (Trabajo, Cómo trabajo, Stack, Sobre mí, Contacto) | `src/components/Sections.tsx` |

## Pendientes para completar

- **Loops de video:** coloca el MP4 optimizado en `public/media/` (por ejemplo `ybank-loop.mp4`) y añade
  `loop: "/media/ybank-loop.mp4"` al proyecto en `src/content/site.ts`. El componente `Media` lo carga
  solo cuando entra en pantalla y nunca si el usuario pidió reducir el movimiento; la imagen fija queda como poster.
- **Textos de “Cómo trabajo” y “Sobre mí”:** son un borrador; reescríbelos con tus palabras.

## Pruebas: el portfolio se prueba a sí mismo

Suite **Cypress + Cucumber (BDD) + Page Object Model** en `cypress/`:

| Archivo | Qué es |
|---|---|
| `cypress/e2e/*.feature` | Escenarios en Gherkin (enfoque, gran pentagrama, idioma, accesibilidad, movimiento) |
| `cypress/support/pages/HomePage.ts` | Page Object: el único lugar que toca el DOM |
| `cypress/support/step_definitions/portfolio.steps.ts` | Pasos en lenguaje de negocio |
| `cypress/support/step_definitions/hooks.ts` | Una captura por paso (alimenta el reproductor de /automation) |

```bash
npm run build && npm run serve:out   # sitio en http://localhost:4173
npm run test:e2e                     # en otra terminal (o test:e2e:open para la UI de Cypress)
npm run report:automation            # genera public/automation/results.json + capturas
```

**En CI:** `.github/workflows/e2e.yml` corre en cada push a `main`: compila, sirve, ejecuta la suite en Chrome,
genera el reporte y hace commit de `public/automation/` (con `[skip ci]`). Vercel publica ese commit y
`/automation` muestra los resultados reales. Mientras no haya una ejecución, la página muestra los escenarios
como "pendientes" (nunca resultados inventados). Requisito: en GitHub, *Settings → Actions → General →
Workflow permissions* en **Read and write**.

**/dev** muestra el código del repo en un visor de solo lectura. Se genera en cada build
(`scripts/build-dev-viewer.mjs`, corre en `prebuild`).

## Accesibilidad y rendimiento

- Contraste AA verificado: tinta/papel 15:1, gris/papel 6.1:1, vino/papel 6.5:1.
- Cuerpo ≥ 16px, áreas táctiles ≥ 44px, enlace “saltar al contenido”, foco visible.
- Imágenes en AVIF/WebP responsivas (640/1024/1600), la más pesada pesa menos de 50 KB.
- Fuentes servidas desde el propio sitio (sin peticiones a Google Fonts).
- El enfoque elegido se guarda en la URL (`?enfoque=backend` o `?enfoque=qa`) para compartir el enlace ya filtrado.
