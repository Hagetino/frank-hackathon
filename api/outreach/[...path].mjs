// Vercel's api/[...path] catch-all does not match nested paths; route /api/outreach/* through the same handler.
export { default, config } from "../[...path].mjs";
