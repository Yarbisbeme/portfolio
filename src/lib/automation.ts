import "server-only";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateMessages } from "@cucumber/gherkin";
import { IdGenerator, SourceMediaType } from "@cucumber/messages";

export type Step = {
  keyword: string;
  text: string;
  table: string[][] | null;
  status: string;
  durationMs: number;
  error: string | null;
  shot: string | null;
};
export type Scenario = { name: string; status: string; durationMs: number; steps: Step[] };
export type Feature = { uri: string; name: string; description: string; scenarios: Scenario[] };
export type Results = {
  runAt: string;
  durationMs: number | null;
  commit: string | null;
  runUrl: string | null;
  browser: string;
  totals: { scenarios: number; passed: number; failed: number; other: number; steps: number };
  features: Feature[];
};

const ROOT = process.cwd();

/** Resultado real de la última ejecución en CI, o null si todavía no ha corrido. */
export function loadResults(): Results | null {
  const p = join(ROOT, "public/automation/results.json");
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as Results;
}

/** Los escenarios tal como están escritos (para el estado "pendiente"). Estado: "pending". */
export function loadWrittenFeatures(): Feature[] {
  const dir = join(ROOT, "cypress/e2e");
  const newId = IdGenerator.incrementing();
  return readdirSync(dir)
    .filter((f) => f.endsWith(".feature"))
    .sort()
    .map((file) => {
      const uri = `cypress/e2e/${file}`;
      const envelopes = generateMessages(readFileSync(join(dir, file), "utf8"), uri, SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
        includeGherkinDocument: true,
        includePickles: true,
        includeSource: false,
        newId,
      });
      const doc = envelopes.find((e) => e.gherkinDocument)?.gherkinDocument;
      const keyword = new Map<string, string>();
      for (const child of doc?.feature?.children ?? []) {
        for (const st of (child.background ?? child.scenario)?.steps ?? []) keyword.set(st.id, st.keyword.trim());
      }
      const scenarios: Scenario[] = envelopes
        .filter((e) => e.pickle)
        .map(({ pickle }) => ({
          name: pickle!.name,
          status: "pending",
          durationMs: 0,
          steps: pickle!.steps.map((s) => ({
            keyword: keyword.get(s.astNodeIds[0]) ?? "*",
            text: s.text,
            table: s.argument?.dataTable?.rows.map((r) => r.cells.map((c) => c.value)) ?? null,
            status: "pending",
            durationMs: 0,
            error: null,
            shot: null,
          })),
        }));
      return { uri, name: doc?.feature?.name ?? file, description: (doc?.feature?.description ?? "").trim(), scenarios };
    });
}

/** Archivos de la suite, para enlazar a /dev. */
export const suiteFiles = [
  "cypress/e2e/01-focus.feature",
  "cypress/support/pages/HomePage.ts",
  "cypress/support/step_definitions/portfolio.steps.ts",
  "cypress/support/step_definitions/hooks.ts",
  ".github/workflows/e2e.yml",
];
