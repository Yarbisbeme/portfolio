"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/content/site";

type Entry = { id: string; path: string; lines: number };
type Tree = { name: string; dirs: Map<string, Tree>; files: Entry[] };

function buildTree(entries: Entry[]): Tree {
  const root: Tree = { name: "", dirs: new Map(), files: [] };
  for (const e of entries) {
    const parts = e.path.split("/");
    let node = root;
    for (const dir of parts.slice(0, -1)) {
      if (!node.dirs.has(dir)) node.dirs.set(dir, { name: dir, dirs: new Map(), files: [] });
      node = node.dirs.get(dir)!;
    }
    node.files.push(e);
  }
  return root;
}

function TreeView({ node, current, onPick, depth = 0 }: { node: Tree; current: string; onPick: (p: string) => void; depth?: number }) {
  return (
    <ul className={depth ? "ml-3 border-l border-rest pl-2" : ""}>
      {[...node.dirs.values()].map((dir) => (
        <li key={dir.name}>
          <details open={current.includes(`${dir.name}/`) || depth === 0}>
            <summary className="cursor-pointer py-1 text-muted hover:text-ink">{dir.name}/</summary>
            <TreeView node={dir} current={current} onPick={onPick} depth={depth + 1} />
          </details>
        </li>
      ))}
      {node.files.map((f) => {
        const on = f.path === current;
        const name = f.path.split("/").pop();
        return (
          <li key={f.id}>
            <button
              type="button"
              aria-current={on ? "true" : undefined}
              onClick={() => onPick(f.path)}
              className={`block w-full cursor-pointer truncate py-1 text-left ${on ? "bg-ink px-1 text-paper" : "hover:text-wine"}`}
            >
              {name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const DEFAULT = "cypress/e2e/01-focus.feature";

export function CodeViewer({ d }: { d: Dictionary }) {
  const t = d.dev;
  const [index, setIndex] = useState<Entry[]>([]);
  const [path, setPath] = useState(DEFAULT);
  const [html, setHtml] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  useEffect(() => {
    fetch("/dev-src/index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: Entry[]) => {
        setIndex(list);
        const fromHash = decodeURIComponent(window.location.hash.slice(1));
        if (list.some((e) => e.path === fromHash)) setPath(fromHash);
      })
      .catch(() => setState("error"));
    const onHash = () => setPath(decodeURIComponent(window.location.hash.slice(1)) || DEFAULT);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const entry = index.find((e) => e.path === path);
  useEffect(() => {
    if (!entry) return;
    setState("loading");
    fetch(`/dev-src/${entry.id}.txt`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((h) => {
        setHtml(h);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [entry]);

  const tree = useMemo(() => buildTree(index), [index]);
  const pick = (p: string) => {
    window.history.replaceState(null, "", `#${p}`);
    setPath(p);
  };

  return (
    <div className="grid min-h-[70vh] border border-ink lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="border-b border-ink lg:border-b-0 lg:border-r">
        <p className="rule-bottom hidden px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-muted lg:block">{t.files}</p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-expanded={pickerOpen}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left font-mono text-xs hover:bg-panel lg:hidden"
        >
          <span className="min-w-0">
            <span className="block text-[0.6875rem] uppercase tracking-[0.1em] text-muted">{t.pickFile}</span>
            <span className="mt-0.5 block truncate text-ink">{path}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-sm text-wine">
            ▾
          </span>
        </button>
        <nav aria-label={t.files} className="hidden max-h-[75vh] overflow-auto px-4 py-3 font-mono text-[0.8125rem] lg:block">
          <TreeView node={tree} current={path} onPick={pick} />
        </nav>
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="rule-bottom flex items-baseline justify-between gap-4 px-4 py-3 font-mono text-xs">
          <span className="truncate text-ink">{path}</span>
          <span className="shrink-0 text-muted">{entry ? `${entry.lines} ${d.automation.linesReadOnly}` : ""}</span>
        </div>
        <div className="code-pane relative min-h-0 flex-1 overflow-auto bg-panel" aria-busy={state === "loading"}>
          {state === "error" ? (
            <p className="p-6 font-mono text-sm text-wine">{t.error}</p>
          ) : state === "loading" && !html ? (
            <p className="p-6 font-mono text-sm text-muted">{t.loading}</p>
          ) : (
            // HTML generado en el build por scripts/build-dev-viewer.mjs a partir del propio repo.
            <div className={state === "loading" ? "opacity-60" : ""} dangerouslySetInnerHTML={{ __html: html ?? "" }} />
          )}
        </div>
      </div>

      {pickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.pickFile}
          onClick={() => setPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-end bg-ink/60 lg:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[82svh] w-full flex-col border-t-2 border-wine bg-paper text-ink"
          >
            <div className="rule-bottom flex items-center justify-between gap-4 px-5 py-3">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{t.files}</span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="min-h-11 cursor-pointer px-2 font-mono text-xs uppercase tracking-[0.1em] text-ink hover:text-wine"
              >
                {d.automation.close} <span aria-hidden="true">✕</span>
              </button>
            </div>
            <nav aria-label={t.files} className="flex-1 overflow-y-auto px-5 py-4 font-mono text-sm">
              <TreeView
                node={tree}
                current={path}
                onPick={(p) => {
                  pick(p);
                  setPickerOpen(false);
                }}
              />
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
