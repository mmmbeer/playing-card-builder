import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps development preview metadata in the root layout", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /"codex-preview"\s*:\s*"development"/);
});

test("builds an ESM worker entrypoint", async () => {
  const worker = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(worker, /export\s*\{[^}]*default/);
  assert.match(worker, /cloudflare:workers/);
});
