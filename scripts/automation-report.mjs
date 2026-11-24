#!/usr/bin/env node
/**
 * Convierte el resultado real de Cypress + Cucumber en datos para /automation.
 *
 * Entrada:  cypress/reports/messages.ndjson   (mensajes Cucumber del preprocesador)
 *           cypress/screenshots/**            (una captura por paso, ver cypress/support/step_definitions/hooks.ts)
 * Salida:   public/automation/results.json
 *           public/automation/shots/*.webp
 *
 * No inventa nada: si falta el archivo de mensajes, termina con error y no toca los resultados publicados.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const MESSAGES = join(ROOT, "cypress/reports/messages.ndjson");
const SHOTS_IN = join(ROOT, "cypress/screenshots");
const OUT_DIR = join(ROOT, "public/automation");
const SHOTS_OUT = join(OUT_DIR, "shots");

if (!existsSync(MESSAGES)) {
  console.error(`No existe ${relative(ROOT, MESSAGES)}. Corre primero la suite (npm run test:e2e).`);
  process.exit(1);
}

const envelopes = readFileSync(MESSAGES, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const docs = new Map(); // uri -> gherkinDocument
const pickles = new Map(); // id -> pickle
const testCases = new Map(); // id -> testCase
const started = new Map(); // testCaseStartedId -> { testCaseId, attempt }
const stepResults = new Map(); // `${tcsId}|${stepId}` -> result
const finished = new Map(); // tcsId -> willBeRetried
let runStart = null;
let runEnd = null;

for (const e of envelopes) {
  if (e.gherkinDocument) docs.set(e.gherkinDocument.uri, e.gherkinDocument);
  else if (e.pickle) pickles.set(e.pickle.id, e.pickle);
  else if (e.testCase) testCases.set(e.testCase.id, e.testCase);
  else if (e.testCaseStarted) started.set(e.testCaseStarted.id, e.testCaseStarted);
  else if (e.testStepFinished) stepResults.set(`${e.testStepFinished.testCaseStartedId}|${e.testStepFinished.testStepId}`, e.testStepFinished.testStepResult);
  else if (e.testCaseFinished) finished.set(e.testCaseFinished.testCaseStartedId, Boolean(e.testCaseFinished.willBeRetried));
  else if (e.testRunStarted) runStart = e.testRunStarted.timestamp;
  else if (e.testRunFinished) runEnd = e.testRunFinished.timestamp;
}

const ms = (d) => (d ? Math.round(Number(d.seconds) * 1000 + d.nanos / 1e6) : 0);
const ts = (t) => (t ? Number(t.seconds) * 1000 + t.nanos / 1e6 : null);

/** Palabra clave (Given/When/Then/And) de cada paso, desde el documento Gherkin. */
const keywordByAstId = new Map();
for (const doc of docs.values()) {
  for (const child of doc.feature?.children ?? []) {
    const blocks = child.rule
      ? child.rule.children.map((c) => c.background ?? c.scenario).filter(Boolean)
      : [child.background ?? child.scenario];
    for (const b of blocks) for (const s of b?.steps ?? []) keywordByAstId.set(s.id, s.keyword.trim());
  }
}

/** Índice de capturas por nombre de archivo. */
const shotsByName = new Map();
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".png")) shotsByName.set(f.replace(/ \(attempt \d+\)/, "").replace(/\.png$/, ""), p);
  }
};
walk(SHOTS_IN);

rmSync(SHOTS_OUT, { recursive: true, force: true });
mkdirSync(SHOTS_OUT, { recursive: true });

const ORDER = ["failed", "undefined", "ambiguous", "pending", "skipped", "passed"];
const worst = (a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b);

const features = new Map(); // uri -> feature
let shotCount = 0;

for (const [tcsId, tcs] of started) {
  if (finished.get(tcsId)) continue; // intento que se reintentó: se usa el último
  const tc = testCases.get(tcs.testCaseId);
  const pickle = pickles.get(tc.pickleId);
  const doc = docs.get(pickle.uri);
  const normUri = pickle.uri.replaceAll("\\", "/");
  if (!features.has(normUri)) {
    features.set(normUri, {
      uri: normUri,
      name: doc.feature.name,
      description: (doc.feature.description ?? "").trim(),
      scenarios: [],
    });
  }

  let status = "passed";
  let duration = 0;
  const steps = [];
  for (const step of tc.testSteps) {
    const r = stepResults.get(`${tcsId}|${step.id}`);
    const st = (r?.status ?? "UNKNOWN").toLowerCase();
    duration += ms(r?.duration);
    status = worst(status, st === "unknown" ? "skipped" : st);
    if (!step.pickleStepId) continue; // hooks: cuentan para el estado, no se muestran
    const ps = pickle.steps.find((s) => s.id === step.pickleStepId);
    let shot = null;
    const src = shotsByName.get(`${tcsId}__${step.id}`);
    if (src) {
      const name = `${String(++shotCount).padStart(3, "0")}.webp`;
      await sharp(src).resize({ width: 960 }).webp({ quality: 70 }).toFile(join(SHOTS_OUT, name));
      shot = `/automation/shots/${name}`;
    }
    steps.push({
      keyword: keywordByAstId.get(ps.astNodeIds[0]) ?? "*",
      text: ps.text,
      table: ps.argument?.dataTable?.rows?.map((row) => row.cells.map((c) => c.value)) ?? null,
      status: st,
      durationMs: ms(r?.duration),
      error: st === "failed" ? (r?.message ?? "").split("\n").slice(0, 6).join("\n") : null,
      shot,
    });
  }
  features.get(normUri).scenarios.push({ name: pickle.name, status, durationMs: duration, attempt: tcs.attempt ?? 0, steps });
}

const all = [...features.values()].sort((a, b) => a.uri.localeCompare(b.uri));
const scenarios = all.flatMap((f) => f.scenarios);
const totals = {
  scenarios: scenarios.length,
  passed: scenarios.filter((s) => s.status === "passed").length,
  failed: scenarios.filter((s) => s.status === "failed").length,
  other: scenarios.filter((s) => !["passed", "failed"].includes(s.status)).length,
  steps: scenarios.reduce((n, s) => n + s.steps.length, 0),
};

const result = {
  runAt: new Date(ts(runEnd) ?? Date.now()).toISOString(),
  durationMs: runStart && runEnd ? Math.round(ts(runEnd) - ts(runStart)) : null,
  commit: process.env.GITHUB_SHA ?? null,
  runUrl:
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  browser: process.env.E2E_BROWSER ?? "chrome",
  totals,
  features: all,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(`Reporte: ${totals.passed}/${totals.scenarios} escenarios en verde, ${totals.steps} pasos, ${shotCount} capturas.`);
