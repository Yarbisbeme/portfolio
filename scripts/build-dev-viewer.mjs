#!/usr/bin/env node
/**
 * Genera el visor de código de /dev: resalta cada archivo del repo con la paleta Partitura
 * y lo escribe como HTML estático (.txt para evitar reescrituras de trailingSlash en Vercel)
 * en public/dev-src/ (se carga a pedido, la página no pesa).
 * Corre antes de cada build (npm run prebuild).
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { createHighlighter } from "shiki";

const ROOT = process.cwd();
const OUT = join(ROOT, "public/dev-src");

const INCLUDE = ["src", "cypress", "scripts", ".github", "cypress.config.ts", "next.config.ts", "package.json", "README.md", ".cypress-cucumber-preprocessorrc.json"];
const SKIP_DIRS = new Set(["node_modules", "screenshots", "videos", "reports", ".next", "out"]);
const LANG = { ".ts": "ts", ".tsx": "tsx", ".mjs": "js", ".js": "js", ".json": "json", ".yml": "yaml", ".yaml": "yaml", ".feature": "gherkin", ".md": "markdown", ".css": "css" };

/** Tema "Partitura": tinta sobre papel, vino para la estructura. Contraste AA sobre #ebe5d9. */
const theme = {
  name: "partitura",
  type: "light",
  colors: { "editor.background": "#ebe5d9", "editor.foreground": "#1c1a17" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#5e5850", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.other"], settings: { foreground: "#9e2a22" } },
    { scope: ["string", "string.quoted", "string.template", "markup.inline.raw"], settings: { foreground: "#7a4b12" } },
    { scope: ["constant.numeric", "constant.language", "support.constant"], settings: { foreground: "#2f4a5c" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: "#1c1a17", fontStyle: "bold" } },
    { scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"], settings: { foreground: "#3b4f2e" } },
    { scope: ["entity.name.tag", "support.type.property-name", "meta.object-literal.key"], settings: { foreground: "#6a3a1a" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#2f4a5c", fontStyle: "italic" } },
    { scope: ["markup.heading", "entity.name.section"], settings: { foreground: "#9e2a22", fontStyle: "bold" } },
  ],
};

const files = [];
const walk = (p) => {
  const abs = join(ROOT, p);
  const st = statSync(abs, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isDirectory()) {
    for (const f of readdirSync(abs).sort()) if (!SKIP_DIRS.has(f)) walk(join(p, f));
  } else if (LANG[extname(p)]) files.push(p);
};
INCLUDE.forEach(walk);

const highlighter = await createHighlighter({ themes: [theme], langs: [...new Set(Object.values(LANG))] });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const index = files.map((path, i) => {
  const code = readFileSync(join(ROOT, path), "utf8");
  const html = highlighter.codeToHtml(code, { lang: LANG[extname(path)], theme: "partitura" });
  const id = `f${String(i).padStart(3, "0")}`;
  writeFileSync(join(OUT, `${id}.txt`), html);
  return { id, path: relative(ROOT, join(ROOT, path)).replaceAll("\\", "/"), lines: code.split("\n").length };
});

writeFileSync(join(OUT, "index.json"), JSON.stringify(index));
console.log(`Visor /dev: ${index.length} archivos.`);
