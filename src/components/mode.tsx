"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Mode } from "@/content/site";

const MODES: Mode[] = ["general", "backend", "qa"];
const Ctx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({ mode: "general", setMode: () => {} });

/** El enfoque vive en la URL (?enfoque=backend) para poder compartir el enlace ya filtrado. */
export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("general");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("enfoque");
    if (q && (MODES as string[]).includes(q)) setModeState(q as Mode);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    const url = new URL(window.location.href);
    if (m === "general") url.searchParams.delete("enfoque");
    else url.searchParams.set("enfoque", m);
    window.history.replaceState(null, "", url);
  }, []);

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useMode = () => useContext(Ctx);
export const modes = MODES;
