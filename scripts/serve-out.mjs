#!/usr/bin/env node
/**
 * Servidor estático ligero para ./out con soporte de trailingSlash y Range (MP4).
 * Reemplaza a `python3 -m http.server` para funcionar igual en Windows y Linux.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const OUT = resolve("out");
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function resolveFile(rawUrl) {
  const [rawPath] = (rawUrl || "/").split("?");
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return { status: 400 };
  }

  const rel = pathname.replace(/^\/+/, "");
  const target = resolve(OUT, rel);
  if (target !== OUT && !target.startsWith(OUT + sep)) {
    return { status: 403 };
  }

  if (existsSync(target)) {
    const st = statSync(target);
    if (st.isDirectory()) {
      if (!pathname.endsWith("/")) {
        return { status: 301, location: `${pathname}/` };
      }
      const index = join(target, "index.html");
      if (existsSync(index) && statSync(index).isFile()) {
        return { status: 200, file: index, stat: statSync(index) };
      }
      return { status: 404 };
    }
    if (st.isFile()) {
      return { status: 200, file: target, stat: st };
    }
  }

  return { status: 404 };
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  const resolved = resolveFile(req.url);
  if (resolved.status === 301) {
    res.writeHead(301, { Location: resolved.location });
    res.end();
    return;
  }
  if (resolved.status !== 200) {
    res.writeHead(resolved.status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(resolved.status === 404 ? "Not Found" : "Error");
    return;
  }

  const { file, stat } = resolved;
  const contentType = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.range;

  if (range && range.startsWith("bytes=")) {
    const [startStr, endStr] = range.slice(6).split("-");
    const start = startStr ? Number.parseInt(startStr, 10) : 0;
    const end = endStr ? Math.min(Number.parseInt(endStr, 10), stat.size - 1) : stat.size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      res.end();
      return;
    }

    res.writeHead(206, {
      "Content-Type": contentType,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Content-Length": stat.size,
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Serving ${OUT} on http://localhost:${PORT}`);
});
