import { handleApi } from "../lib/app.mjs";

// Vercel function: every /api/* request goes through the shared router.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const [status, json] = await handleApi(req.method, url.pathname, body, req.headers, url.searchParams);
  res.status(status).json(json);
}
