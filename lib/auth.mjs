import { createHash, timingSafeEqual } from "node:crypto";

const passcode = process.env.DEMO_PASSCODE || "";
const digest = (value) => createHash("sha256").update(value).digest();

// Missing configuration disables access, including on local and serverless deployments.
export function requireDemoKey(headers = {}) {
  if (!passcode) return [503, { error: "API disabled: configure DEMO_PASSCODE on the server" }];
  const supplied = headers["x-demo-key"];
  if (typeof supplied !== "string" || !timingSafeEqual(digest(supplied), digest(passcode))) {
    return [401, { error: "passcode required" }];
  }
  return null;
}
