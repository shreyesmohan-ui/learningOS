import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
await build({ entryPoints: ["tests/core.test.ts"], outfile: "artifacts/core.test.mjs", bundle: true, platform: "node", format: "esm", packages: "external" });
await import("../artifacts/core.test.mjs");
