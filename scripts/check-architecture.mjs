import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const sourceRoots = ["app", "build", "db", "scripts", "tests"];
const sourceExtensions = new Set([".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const failures = [];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

for (const sourceRoot of sourceRoots) {
  for (const path of await filesIn(join(root, sourceRoot))) {
    if (!sourceExtensions.has(extname(path))) continue;
    const name = relative(root, path);
    const content = await readFile(path, "utf8");
    const lines = content.split(/\r?\n/).length;
    if (lines >= 500) failures.push(`${name} has ${lines} lines; source files must stay below 500.`);
    if (/window\.alert\s*\(/.test(content)) failures.push(`${name} uses window.alert instead of the shared notification system.`);
    if (extname(path).includes("ts") && content.includes('className="modal-backdrop"') && name !== "app/components/ui/Modal.tsx") {
      failures.push(`${name} implements a modal backdrop instead of using the shared Modal component.`);
    }
    const clientModule = content.startsWith('"use client"') || content.startsWith("'use client'");
    if (clientModule && /\bfetch\s*\(/.test(content) && name !== "app/lib/api-client.ts") {
      failures.push(`${name} calls fetch directly instead of using the shared API client.`);
    }
  }
}

if (failures.length) {
  console.error(`Architecture checks failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("Architecture checks passed.");
