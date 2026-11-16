import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi, handleTts, MODEL, BUDGET_USD } from "./lib/app.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const body = req.method === "POST" ? await readBody(req) : {};
  if (req.method === "POST" && url.pathname === "/api/tts") {
    const [status, type, buf] = await handleTts(body, req.headers);
    res.writeHead(status, { "content-type": type });
    return res.end(buf);
  }
  const api = await handleApi(req.method, url.pathname, body, req.headers);
  if (api) {
    res.writeHead(api[0], { "content-type": "application/json" });
    return res.end(JSON.stringify(api[1]));
  }
  const path = normalize(join(here, "public", url.pathname === "/" ? "index.html" : url.pathname));
  if (!path.startsWith(join(here, "public"))) { res.writeHead(403); return res.end(); }
  try {
    const file = await readFile(path);
    res.writeHead(200, { "content-type": MIME[extname(path)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404); res.end("not found");
  }
}).listen(PORT, () => {
  console.log(`outflow on http://localhost:${PORT}  (model ${MODEL}, budget $${BUDGET_USD})`);
});
