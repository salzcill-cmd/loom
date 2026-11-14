# Loom

A TypeScript fullstack framework for CRUD, admin, ERP, and SaaS business applications. Bun first, React first, SQL over PostgreSQL, MySQL, and SQLite.

## Status

Pre-alpha. The specification and engineering blueprint exist; the framework does not. Nothing in this repository is implemented or published.

- Product specification: [`PRD.md`](./PRD.md)
- Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Construction plan: [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md)
- Decision log: [`docs/DECISION_LOG.md`](./docs/DECISION_LOG.md)
- Standards: [`docs/DEVELOPMENT_STANDARDS.md`](./docs/DEVELOPMENT_STANDARDS.md)
- Current stage and known issues: [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md)

Development follows a nine-stage pipeline with a strict stop after each stage. Stage 0 (audit and blueprint) is complete; Stage 1 (foundation and tooling) is in progress.

## Working with the repository

Requires [Bun](https://bun.sh) 1.4 or newer.

```sh
bun install --frozen-lockfile
bun run verify   # typecheck, lint, format check, tests
bun run build    # build packages to dist/
bun test         # tests only
```

## Layout

| Path        | Contents                                                        |
| ----------- | --------------------------------------------------------------- |
| `packages/` | Framework packages, tier-ordered; see the architecture document |
| `apps/`     | Reference application and playground (added in later stages)    |
| `tests/`    | Cross-package integration, security, and contract suites        |
| `scripts/`  | Build and repository tooling                                    |
| `docs/`     | Architecture, plan, decisions, standards                        |

## License

Not decided yet. Tracked as Q-03 in the PRD open questions; the package manifests are marked `UNLICENSED` until then. All rights reserved by default.
