# Decision Log

Architecture decisions for the Loom implementation. The PRD's own register (section 46) stays authoritative for product decisions. This log records engineering decisions made while turning the PRD into code, plus the status of the PRD decisions that block work.

Status values: **Accepted** (decided, in force), **Proposed** (recommended, needs owner or evidence), **Pending owner** (cannot be decided by engineering), **Superseded**.

---

## Index

| ID | Decision | Status | Stage |
| --- | --- | --- | --- |
| ADR-0001 | The nine-stage pipeline replaces PRD phase order for execution | Accepted | 0 |
| ADR-0002 | MVP package set and creation order | Accepted | 0 |
| ADR-0003 | No runtime packages; runtime lives in core | Accepted | 0 |
| ADR-0004 | SQLite is the verified dialect; PostgreSQL is experimental until a server exists | Accepted | 0 |
| ADR-0005 | Web `Request`/`Response` is the HTTP seam; Elysia is the first adapter | Accepted | 0 |
| ADR-0006 | Drizzle sits behind a gateway and is adopted only after a spike | Proposed | 3 |
| ADR-0007 | Toolchain: Bun workspaces, single tsconfig, bun test, ESLint, Prettier | Accepted | 1 |
| ADR-0008 | The Model IR is the only metadata source for validation, UI, and authz | Accepted | 3 |
| ADR-0009 | Authentication core ships in Stage 5, not a later stage | Proposed | 5 |
| ADR-0010 | Charts render inside `@loom/react`; no charts package yet | Accepted | 8 |
| ADR-0011 | API Extractor, Changesets, and the docs site are deferred past Stage 8 | Proposed | 8 |
| ADR-0012 | Documentation is Markdown in `docs/` | Accepted | 0 |
| ADR-0013 | Zod is the first validator behind a Standard Schema adapter | Proposed | 2 |
| ADR-0014 | No CLI argument parser dependency until the built-in parser is insufficient | Proposed | 2 |
| ADR-0015 | Generated artifacts: migrations and resources on disk, UI descriptors at runtime | Accepted | 3 |

---

## ADR-0001: Nine-stage execution pipeline

**Status:** Accepted (imposed by the execution prompt).

**Context.** The PRD sequences sixteen phases ordered by dependency. The execution contract defines nine stages with strict stops. The two orders are not identical.

**Decision.** Execute the nine stages. Map them to the PRD phases as recorded in `docs/IMPLEMENTATION_PLAN.md` section 1. Where a PRD phase has no stage, it moves to the post-Stage-8 backlog instead of being compressed into a stage that cannot hold it.

**Alternatives rejected.**

- Follow the PRD phases literally: violates the execution contract.
- Compress everything into nine stages: forces half-built features and hides gaps.

**Consequences.** The MVP arrives at Stage 8. PRD phases 11 to 15 remain open, including the security hardening audit and release engineering. The completion report must say so rather than implying 1.0.

**Revisit trigger.** Never, unless the owner changes the execution contract.

---

## ADR-0002: MVP package set

**Status:** Accepted.

**Context.** PRD 51.1 lists about thirty packages for 1.0 and 2.0. Creating them empty would contradict R-REPO-005.

**Decision.** Create twenty packages and two apps across Stages 1 to 8, each when first needed. The tier table in `docs/ARCHITECTURE.md` section 3 is the authoritative list. No package exists without code, tests, README, and a consumer.

**Alternatives rejected.**

- Create the full skeleton in Stage 1: produces empty promises and slows every later build.
- One package: loses the tier boundary that keeps adapters replaceable.

**Consequences.** Package count grows per stage. Import boundaries must be enforced from Stage 1 so growth does not blur tiers. A later split of `@loom/react` is possible but not planned.

**Revisit trigger.** A package gains a second unrelated responsibility, or two packages always change together.

---

## ADR-0003: Runtime detection in core

**Status:** Accepted.

**Context.** The PRD proposes `runtime-bun` and `runtime-node`. The MVP supports Bun only, with Node tracked.

**Decision.** No runtime package. `@loom/core` exposes `detectRuntime()` and a capability object: runtime name, version, SQLite driver, password hashing backend, signal support. Node branches compile and are exercised by unit tests where they do not need a Node server.

**Alternatives rejected.**

- Two packages with one consumer each: a boundary with no benefit.
- Ignore Node entirely: closes a confirmed product direction and makes later work harder.

**Consequences.** Node compatibility is a code path, not a supported target, until Stage 8 attempts a run. The PRD's package layout differs from the repository; this ADR is the explanation.

**Revisit trigger.** Node support is promised, or a third runtime appears.

---

## ADR-0004: SQLite is the verified dialect

**Status:** Accepted. Revisit at Stage 3.

**Context.** This machine has no PostgreSQL server, no Docker, and no MySQL. Stage 3 acceptance requires tested adapters and forbids claiming support from an interface alone.

**Decision.** SQLite through `bun:sqlite` is the reference dialect and the one used by integration tests. The PostgreSQL adapter is written against the same contract suite and run only when a reachable server or DSN exists. Until then it is labeled **experimental** in code, docs, and reports. MySQL is not built.

**Alternatives rejected.**

- Claim PostgreSQL support without running it: prohibited by the execution contract.
- Block Stage 3 until a server appears: stalls the pipeline for an environment issue.
- Use an embedded PostgreSQL build: unverified behavior and a large dependency.

**Consequences.** CRUD and UI tests run on SQLite, whose behavior differs from PostgreSQL in types, locking, and case sensitivity. Dialect-specific tests are written but skipped with a named reason. The Stage 3 report must state the skip.

**Revisit trigger.** A PostgreSQL server is installed locally or a DSN is provided.

---

## ADR-0005: Web Request/Response seam

**Status:** Accepted.

**Context.** Elysia is the first HTTP adapter candidate. Business logic tied to Elysia types would make Hono or a plain server expensive later.

**Decision.** The `@loom/http` handler contract uses platform `Request` and `Response` plus a Loom context. Elysia exists only in `@loom/http-elysia`. Every handler suite runs twice: through Elysia and through `app.handle(request)`.

**Alternatives rejected.**

- Handlers take Elysia context: fast to write, impossible to port.
- Own request/response wrappers: reimplements the platform for little gain.

**Consequences.** Some Elysia features (validation hooks, plugins) are not used directly; validation runs in Loom code. Streaming works through standard bodies. Multipart parsing needs care because `Request.formData()` loads the body into memory; upload endpoints use a bounded streaming path.

**Revisit trigger.** A second adapter exposes a capability the Web contract cannot express.

---

## ADR-0006: Drizzle behind a gateway

**Status:** Proposed. Decided by a Stage 3 spike.

**Context.** Drizzle is a candidate for query building and introspection. Upstream API churn and dialect gaps are known risks (PRD 43, 44.2).

**Decision.** The gateway interface is Loom-owned. Drizzle is used inside dialect adapters. Applications can reach the Drizzle instance through an explicit escape hatch. Adoption requires the spike to pass on introspection, relations, transactions, raw SQL, and error mapping.

**Alternatives rejected.**

- Drizzle as the public API: couples every application to its release cadence.
- Hand-written SQL builder: weeks of work with no product differentiation.

**Consequences.** Some Drizzle features are not exposed until the gateway grows. The gateway must not become a second ORM; it stays a narrow query surface.

**Revisit trigger.** The spike fails. Fallback is Kysely plus a migration tool, or direct driver calls with a small builder.

---

## ADR-0007: Toolchain

**Status:** Accepted.

**Context.** The repository is empty except the PRD. A fast, boring toolchain matters more than a clever one.

**Decision.**

| Concern | Choice | Reason |
| --- | --- | --- |
| Workspaces | Bun workspaces | Same runtime as development and tests |
| Type checking | One root `tsconfig.json` with `paths` to package sources, `tsc --noEmit` | No composite build graph before there is a build graph |
| Tests | `bun test` | Built in, fast, no extra runner |
| Lint | ESLint 10 flat config plus import boundary rules | Boundary enforcement is required by PRD 12.2 |
| Format | Prettier 3 | One config, check in CI |
| Build | `bun build` per package, ESM only | Matches runtime, produces declarations via `tsc --emitDeclarationOnly` where needed |
| CI | GitHub Actions, one job | 2-core machine, keep the fast lane under three minutes |
| Versioning | None yet | Changesets deferred, ADR-0011 |

**Alternatives rejected.**

- Turborepo or Nx: build orchestration for a repository that has no packages yet.
- Vitest: works, but adds a runner and a transform layer Bun already provides.
- Project references from day one: slows iteration while package boundaries are still moving.

**Consequences.** `paths` mapping hides missing `exports` fields during development. The build script must verify that every package's public entry resolves from its manifest, not only from `paths`. That check is a Stage 1 test.

**Revisit trigger.** Build time exceeds three minutes, or published output diverges from source resolution.

---

## ADR-0008: One metadata source

**Status:** Accepted.

**Context.** Validation, forms, tables, authz, and migrations all need model metadata. Duplicating it produces drift.

**Decision.** The Model IR is produced once and consumed by projection. Each consumer reads its own metadata group and never writes back. Validation rules, widget hints, field sensitivity, and permission defaults live in their groups, not in consumer code.

**Alternatives rejected.**

- Decorators on classes: reflection, bundler complexity, and weaker serialization.
- Separate schemas per engine: drift and duplicate definitions.

**Consequences.** IR changes are contract changes and need a version bump. Metadata groups that grow beyond a few fields get their own typed sub-objects.

**Revisit trigger.** A consumer needs metadata that cannot be expressed without executing code.

---

## ADR-0009: Authentication in Stage 5

**Status:** Proposed. Requires owner approval and Q-02.

**Context.** The execution pipeline has no dedicated authentication stage. Stage 5 requires denying unauthenticated access and testing it, which needs a real principal. The PRD puts authentication in P9 and keeps Q-02 open.

**Decision.** Stage 5 implements the authentication core behind interfaces: principal resolution, session store, password hashing, login, logout, cookie flags, CSRF, and rate limits. Stage 6 adds the login page. If Q-02 resolves against session-first, the interfaces stay and the implementations change.

**Alternatives rejected.**

- Test-only identity provider in Stage 5: leaves "unauthenticated is denied" untested against real sessions and pushes security work past the last stage.
- Add a tenth stage: violates the execution contract.

**Consequences.** Stage 5 is larger than its title suggests. The owner should approve splitting it into 5a (CRUD with a test principal) and 5b (sessions) rather than letting it run long.

**Revisit trigger.** Q-02 is answered differently, or the owner rejects auth in Stage 5.

---

## ADR-0010: Charts inside the React package

**Status:** Accepted.

**Context.** PRD 51.1 lists `packages/charts`. Only one frontend adapter exists in the MVP.

**Decision.** Chart descriptors live in `@loom/ui`. Rendering lives in `@loom/react` using Apache ECharts. A separate package appears when a second adapter needs the same chart logic.

**Alternatives rejected.**

- Charts package now: one consumer, extra build boundary.
- Recharts: simpler API, weaker large-series behavior.

**Consequences.** ECharts is a dependency of the React adapter, affecting its bundle. Lazy loading the chart module keeps the initial admin bundle smaller.

**Revisit trigger.** Preact or Vue adapter work starts, or ECharts bundle cost exceeds the budget.

---

## ADR-0011: Deferred release tooling

**Status:** Proposed. Needs owner acknowledgement.

**Context.** PRD R-REPO-002 requires public API diffs, and PRD 51.3 proposes API Extractor and Changesets. Neither protects anything before the API stabilizes.

**Decision.** Defer API Extractor, Changesets, dist-tags, and the docs site past Stage 8. Keep the public surface small and reviewed by hand. Record the gap in the Stage 8 report.

**Alternatives rejected.**

- Set up API Extractor now: configuration cost, noisy diffs while the API moves weekly.
- Ignore the requirement silently: unacceptable.

**Consequences.** No automated guard against accidental breaking changes during Stages 1 to 8. Mitigation: few public exports, TSDoc, and a manual export review in each stage's completion report.

**Revisit trigger.** The first external consumer, or Stage 8 completion, whichever comes first.

---

## ADR-0012: Markdown documentation

**Status:** Accepted.

**Context.** PRD 49 requires documentation as a deliverable. A docs site is also on the list.

**Decision.** Documentation lives in `docs/` as Markdown, linked from `README.md`. It is written in the stage that ships the feature, not at the end. A static site generator comes after Stage 8.

**Consequences.** No search, no versioned docs, no generated API reference yet. Links are checked by a small script in Stage 1 so they do not rot.

**Revisit trigger.** External users arrive, or the page count passes roughly thirty.

---

## ADR-0013: Zod as the first validator

**Status:** Proposed. Confirmed or replaced in Stage 2.

**Context.** The PRD requires Standard Schema compatibility. Zod, Valibot, ArkType, and TypeBox are candidates.

**Decision.** Zod 4 is the first implementation, behind `@loom/validation`. Resource definitions accept any Standard Schema validator. Zod-specific features are not part of the public API.

**Consequences.** Bundle cost on the client, mitigated by importing only what the descriptor needs. A swap stays possible because consumers depend on Standard Schema.

**Revisit trigger.** Bundle budget fails, or Standard Schema coverage proves incomplete for coercion.

---

## ADR-0014: No CLI parser dependency initially

**Status:** Proposed. Reviewed in Stage 2.

**Context.** The CLI needs `create`, `doctor`, `module:list`, later `db:*`, `make:*`, `dev`, `build`, `start`, `routes`. A parser dependency is small and mature; a hand-written one is a known source of edge-case bugs.

**Decision.** Start with a small typed parser covering flags, values, and `--`. If it passes 150 lines or needs subcommand aliases, nested options, and shell completion, adopt a maintained parser and record the choice.

**Consequences.** Early CLI behavior is simple and dependency-free. The threshold is explicit so this does not become an excuse to reinvent a parser.

**Revisit trigger.** The 150-line threshold is crossed.

---

## ADR-0015: Generated artifacts

**Status:** Accepted. Aligns with PRD Q-20's recommended default.

**Context.** Generated code on disk is debuggable but drifts. Runtime descriptors are consistent but opaque.

**Decision.** Migrations and resource scaffolding are written to disk because humans edit them. Forms, tables, and dashboard descriptors are generated at runtime because they depend on the current principal. `make:resource` never overwrites without an explicit flag.

**Consequences.** Resource files are the customization point. Descriptor generation must be fast enough to run per request; caching is allowed but keyed by principal and model version.

**Revisit trigger.** Descriptor generation shows up in request latency.

---

## PRD decisions carried into the build

| ID | Decision | Status | Effect on implementation |
| --- | --- | --- | --- |
| D-01 to D-15 | Product direction (fullstack, Bun first, React first, hybrid core, engines) | CONFIRMED | Constraints, not choices |
| D-16 | Intelligent Security Engine | PENDING (recommended) | Interfaces first, session-first implementation, labeled provisional |
| D-17 to D-41 | See PRD section 46 | Mixed | Follow the recommended defaults where a stage needs them |
| Q-02 | Session-first authentication | Pending owner | Blocks authentication code in Stage 5 |
| Q-04 | MySQL at 1.0 | Pending owner | MySQL stays out of Stages 1 to 8 |
| Q-08 | Node floor | Pending owner | Node paths compile, no support claim |
| Q-09 | SQLite driver per runtime | Pending owner | Bun driver tested; Node driver chosen at Stage 8 attempt |
| Q-10 | Ark UI or own primitives | Pending owner | Stage 6 starts with native primitives and a registry; Ark adoption is reversible |
| Q-15 | Multi-tenancy in 1.0 | Pending owner | Tenant-ready scope interface, no tenant storage |
| Q-20 | Generated files or runtime descriptors | Pending owner | ADR-0015 uses the recommended default |

---

## Decisions required before specific stages

| Before | Decision | Owner | If unanswered |
| --- | --- | --- | --- |
| Stage 3 | A PostgreSQL server or DSN, or accept experimental status | Owner or engineering | Proceed with SQLite verified, PostgreSQL experimental |
| Stage 5 | Q-02 authentication architecture | Product owner | Implement the recommended session-first design, mark provisional |
| Stage 5 | Split Stage 5 into 5a and 5b | Owner | Run it as one long stage if the owner prefers |
| Stage 6 | Q-10 component primitives | Design and engineering | Start with native primitives and the registry |
| Stage 8 | Playwright browsers allowed | Owner | Use the scripted HTTP walkthrough and report it as the substitute |
