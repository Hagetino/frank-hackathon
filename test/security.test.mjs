import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

// Each process imports the app with fresh server configuration. Never contact a provider.
for (const configured of [false, true]) {
  test(`API authentication with passcode ${configured ? "configured" : "missing"}`, () => {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import assert from "node:assert/strict";
      import { handleApi, handleTts } from "./lib/app.mjs";
      let providerCalls = 0;
      globalThis.fetch = async () => { providerCalls++; throw new Error("Unexpected provider call"); };
      const configured = ${configured};
      const expected = configured ? 401 : 503;
      const routes = [
        ["GET", "/api/state"], ["GET", "/api/spend"],
        ["GET", "/api/outreach/state"], ["GET", "/api/outreach/contract"],
        ["POST", "/api/draft"], ["POST", "/api/reply"], ["POST", "/api/voice"],
        ...["send", "reply", "approve", "sign", "reset"].map(p => ["POST", "/api/outreach/" + p]),
      ];
      for (const [method, path] of routes) {
        for (const headers of [{}, { "x-demo-key": "incorrect" }]) {
          const [status, data] = await handleApi(method, path, {}, headers);
          assert.equal(status, expected, method + " " + path);
          assert.deepEqual(Object.keys(data), ["error"]);
        }
      }
      assert.equal((await handleTts({ text: "test" }))[0], expected);
      assert.equal(providerCalls, 0);
      if (configured) {
        const headers = { "x-demo-key": process.env.DEMO_PASSCODE };
        const [status, data] = await handleApi("GET", "/api/state", {}, headers);
        assert.equal(status, 200);
        assert.equal(data.locked, true);
        assert.ok(Array.isArray(data.leads));
        assert.equal((await handleApi("GET", "/api/outreach/state", {}, headers))[0], 200);
        assert.equal((await handleApi("GET", "/api/outreach/contract", {}, headers, new URLSearchParams("p=missing")))[0], 404);
        // Provider errors must not return raw upstream response bodies to the browser.
        globalThis.fetch = async () => ({ ok: false, status: 401, text: async () => "private provider diagnostic" });
        const [ttsStatus, , body] = await handleTts({ text: "test" }, headers);
        assert.equal(ttsStatus, 502);
        assert.equal(body.includes("private provider diagnostic"), false);
      }
    `], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, DEMO_PASSCODE: configured ? randomBytes(32).toString("hex") : "",
        ANTHROPIC_API_KEY: "unused-test-placeholder", ELEVENLABS_API_KEY: "unused-test-placeholder" },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
}
