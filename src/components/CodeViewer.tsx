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

  useEffect(() => {
    fetch("/dev-src/index.json")
      .then((r) => r.json())
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
    fetch(`/dev-src/${entry.id}.html`)
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
        <p className="rule-bottom px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-muted">{t.files}</p>
        <label className="block p-3 lg:hidden">
          <span className="sr-only">{t.files}</span>
          <select value={path} onChange={(e) => pick(e.target.value)} className="min-h-11 w-full border border-ink bg-paper px-2 font-mono text-sm">
            {index.map((e) => (
              <option key={e.id} value={e.path}>
                {e.path}
              </option>
            ))}
          </select>
        </label>
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
    </div>
  );
}
