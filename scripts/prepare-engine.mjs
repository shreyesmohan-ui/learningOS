import { build } from "esbuild";
import { createRequire } from "node:module";
import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("@electric-sql/pglite"));
const output = resolve("public/sql-engine");
await mkdir(output, { recursive: true });
await build({ entryPoints: ["engine/worker.ts"], outfile: resolve(output, "worker.js"), bundle: true, format: "esm", platform: "browser", target: "es2022", external: ["node:*"] });
for (const name of await readdir(packageDir)) {
  if (/\.(wasm|data)$/.test(name)) await cp(resolve(packageDir, name), resolve(output, name));
}
console.log("PostgreSQL worker and runtime assets prepared.");
