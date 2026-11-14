/**
 * Build every package under packages/ that has a public entry point.
 *
 * Output is ESM plus declaration files. The script verifies that each
 * package's `exports` map points at files that actually exist, which closes
 * the gap between the root tsconfig path mapping used during development and
 * real package resolution.
 */
import { $ } from "bun";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const packagesDir = join(root, "packages");

interface Manifest {
  name?: string;
  exports?: Record<string, Record<string, string>>;
}

let built = 0;
for (const name of readdirSync(packagesDir).sort()) {
  const dir = join(packagesDir, name);
  if (!existsSync(join(dir, "src", "index.ts"))) continue;

  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as Manifest;

  await $`bun build ./src/index.ts --outdir dist --format esm --target bun --sourcemap=external`
    .cwd(dir)
    .quiet();
  await $`bunx tsc -p tsconfig.json`.cwd(dir).quiet();

  const entry = manifest.exports?.["."];
  if (!entry) {
    throw new Error(`${name}: package.json is missing exports["."]`);
  }
  for (const target of Object.values(entry)) {
    if (!existsSync(join(dir, target))) {
      throw new Error(`${name}: exports["."] points at missing file ${target}`);
    }
  }
  built += 1;
  console.log(`built ${manifest.name ?? name}`);
}

if (built === 0) {
  throw new Error("no package with src/index.ts found under packages/");
}
console.log(`build complete: ${built} package(s)`);
