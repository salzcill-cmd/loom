// Import boundary enforcement for the Loom monorepo.
//
// The package table below is the executable version of the tier model in
// docs/ARCHITECTURE.md. When a stage creates a package, its rules activate
// automatically because rules are generated for packages that exist on disk.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import tseslint from "typescript-eslint";

/**
 * Which first-party packages and external libraries each package may import.
 * `imports: "*"` marks top-of-stack packages (CLI, testing) that consume the
 * public API of everything below them.
 */
const FIRST_PARTY = {
  contracts: { imports: [] },
  core: { imports: ["contracts"], externals: ["zod"] },
  model: { imports: ["contracts"] },
  validation: { imports: ["contracts", "model"], externals: ["zod"] },
  db: { imports: ["contracts", "core", "model"] },
  "db-sqlite": {
    imports: ["contracts", "core", "db", "model"],
    externals: ["drizzle-orm", "drizzle-kit"],
  },
  "db-postgres": {
    imports: ["contracts", "core", "db", "model"],
    externals: ["drizzle-orm", "drizzle-kit", "pg"],
  },
  http: { imports: ["contracts", "core", "validation", "authz"] },
  "http-elysia": { imports: ["contracts", "core", "http"], externals: ["elysia"] },
  crud: { imports: ["contracts", "core", "model", "validation", "db", "authz", "audit"] },
  auth: { imports: ["contracts", "core", "model", "db"] },
  authz: { imports: ["contracts", "core", "model", "db"] },
  audit: { imports: ["contracts", "core", "model", "db"] },
  ui: { imports: ["contracts", "model"] },
  react: {
    imports: ["contracts", "ui"],
    externals: ["react", "react-dom", "@tanstack/react-query", "echarts"],
  },
  dashboard: { imports: ["contracts", "core", "model", "db", "authz"] },
  report: { imports: ["contracts", "core", "model", "db", "authz"] },
  storage: { imports: ["contracts", "core"] },
  testing: { imports: "*" },
  cli: { imports: "*" },
};

/** External libraries only the package that adapts them may import. */
const RESTRICTED_EXTERNALS = [
  "elysia",
  "react",
  "react-dom",
  "@tanstack/react-query",
  "echarts",
  "drizzle-orm",
  "drizzle-kit",
  "pg",
  "zod",
];

function patternsFor(name) {
  const allowed = FIRST_PARTY[name];
  const patterns = [];
  for (const other of Object.keys(FIRST_PARTY)) {
    if (other === name) continue;
    if (allowed.imports === "*" || allowed.imports.includes(other)) continue;
    patterns.push({
      group: [`@loom/${other}`, `@loom/${other}/*`],
      message: `@loom/${name} must not import @loom/${other}; see docs/ARCHITECTURE.md section 3`,
    });
  }
  for (const external of RESTRICTED_EXTERNALS) {
    if ((allowed.externals ?? []).includes(external)) continue;
    patterns.push({
      group: [external, `${external}/*`],
      message: `${external} may only be imported by the package that adapts it`,
    });
  }
  return patterns;
}

const existingPackages = existsSync("packages")
  ? readdirSync("packages").filter((name) => existsSync(join("packages", name, "package.json")))
  : [];

const packageConfigs = existingPackages.map((name) => ({
  files: [`packages/${name}/src/**/*.ts`, `packages/${name}/src/**/*.tsx`],
  rules: {
    "no-restricted-imports": ["error", { patterns: patternsFor(name) }],
  },
}));

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "coverage/**", "bun.lock"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // Direct environment reads are only allowed where config is assembled.
  {
    files: ["packages/**", "apps/**", "tests/**"],
    ignores: ["packages/core/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Read environment values through the config module in @loom/core.",
        },
      ],
    },
  },
  ...packageConfigs,
);
