# Implementation Plan

Status: Stage 0 output, approved for execution one stage at a time. This plan is the construction order for `PRD.md`. It does not claim any of it is built.

Audience: the engineer or coding agent picking up the next stage with no memory of the previous session. Each stage section is written to be read alone.

---

## 1. How the nine stages relate to the PRD roadmap

The PRD sequences sixteen phases. This pipeline compresses them into nine execution stages. The compression is deliberate and has costs, listed here so nobody discovers them at Stage 8.

| Stage | PRD phases covered | What the stage produces |
| --- | --- | --- |
| 0 | P0 Product definition | Audit, blueprint, standards, decision log |
| 1 | P2 Architecture foundation (tooling half) | Monorepo, TypeScript, lint, format, tests, build, CI |
| 2 | P2 (kernel half), P3 Runtime and CLI | Core kernel, config, modules, errors, logger, CLI, playground |
| 3 | P4 Database and model | Model IR, gateway, SQLite and PostgreSQL adapters, migrations, introspection |
| 4 | P5 Backend and API | HTTP contract, Elysia adapter, routing, middleware, validation wiring |
| 5 | P6 CRUD, P9 security subset | CRUD engine, authn core, authz, audit, security matrix |
| 6 | P7 Form engine | UI descriptors, React adapter, form generation, local storage |
| 7 | P8 DataTable engine | Server-driven table, filters, bulk actions, export |
| 8 | P10 Dashboard and reporting, integration | Dashboard, reports, Stockroom app, documentation, final validation |

### 1.1 Deviations from the PRD sequence

| ID | Deviation | Reason | Cost |
| --- | --- | --- | --- |
| DV-01 | P1 technical validation is not a separate stage | Spikes need the toolchain that Stage 1 builds, and a spike report nobody runs is worth little | Each dependency is validated at the moment of first use, with evidence in the decision log. Drizzle is not adopted in Stage 3 until its spike passes |
| DV-02 | P9 is split across Stages 5 and 6 | CRUD cannot be secured or tested without a real principal, so authentication core moves into Stage 5 | Stage 5 grows; it is gated on Q-02 |
| DV-03 | P11 to P15 have no stage | The pipeline ends at MVP integration, not at 1.0 | Frontend expansion, plugins, hardening audit, docs site, and release work remain after Stage 8. See section 11 |
| DV-04 | MySQL is not built | No MySQL server is available to test, and PRD Q-04 is unresolved | `db-mysql` waits. PostgreSQL ships as experimental if no server is available; SQLite is the tested dialect |
| DV-05 | No API Extractor, Changesets, or docs site | They protect a public API that does not exist yet | Deferred to the release phase; recorded as ADR-0011 |

### 1.2 What "done" means for a stage

A stage is complete only when all of these are true:

1. Every task assigned to the stage is implemented or explicitly deferred with a reason.
2. `bun run verify` passes: typecheck, lint, format check, tests.
3. The stage's acceptance table is filled with PASS, FAIL, or NOT APPLICABLE, each backed by a command run in this repository.
4. New public behavior has a test named after its acceptance criterion.
5. `IMPLEMENTATION_PROGRESS.md` records the commands and their actual output.
6. `docs/` describes what now exists, including limitations.
7. The completion report ends with the strict stop confirmation.

No stage may claim a check it did not run. A missing database, browser, or platform is reported as NOT VERIFIED, not as passing.

---

## 2. Stage 0 — Audit and blueprint

Status: complete when this document set is written.

Deliverables: `IMPLEMENTATION_PROGRESS.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISION_LOG.md`, `docs/DEVELOPMENT_STANDARDS.md`, root `AGENTS.md`.

Acceptance:

| Criterion | Evidence |
| --- | --- |
| PRD read end to end, all 55 sections | Section inventory in the progress file |
| Confirmed, proposed, pending, unvalidated decisions separated | `docs/DECISION_LOG.md` status column |
| Package boundaries defined | `docs/ARCHITECTURE.md` section 3 |
| Dependencies identified with versions | Section 9 of this document |
| Implementation sequence and gates defined | Sections 3 to 10 |
| Environment constraints recorded | Section 12 and the progress file |
| Stage 1 executable cold | Stage 1 brief below |

No source code is written in Stage 0. That is the point of the stage, not an omission.

---

## 3. Stage 1 — Foundation and tooling

Relative size: S to M. Risk: low.

### Objective

One installable, checkable, buildable workspace. No framework behavior beyond the shared type package.

### Inputs

- `docs/ARCHITECTURE.md` section 3 (package table) and section 11 (test layers)
- `docs/DEVELOPMENT_STANDARDS.md`
- `PRD.md` sections 51 and 44

### Deliverables

```text
package.json              workspace root, scripts, engines
bun.lock                  committed
tsconfig.json             single project, paths to package sources
tsconfig.base.json        strict compiler options
eslint.config.js          flat config with import boundary rules
.prettierrc.json
.prettierignore
.editorconfig
.gitignore
bunfig.toml
.github/workflows/ci.yml
scripts/build.ts          bun build per package, declaration emit later
packages/contracts/       real types and tests, not a placeholder
README.md
AGENTS.md                 already created in Stage 0
```

### Tasks

1. Initialize git in the repository root. First commit contains `PRD.md`, `docs/`, and Stage 1 output. No history rewriting later.
2. Create the workspace root. `workspaces` covers `packages/*` and `apps/*`. Package manager is Bun; `packageManager` pins the version.
3. Write strict TypeScript settings: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: "bundler"`, `target: "ES2023"`. One root project with `paths`; no composite project references in the MVP.
4. Implement `@loom/contracts` with the types that Stages 2 to 8 share: branded IDs, `ProblemDetails`, `ModelIR` skeleton types, descriptor base types, `Handler` contract. Tests cover type-level behavior with `expectTypeOf`-style assertions or compile fixtures.
5. Configure ESLint flat config with TypeScript rules and `import/no-restricted-paths` or `eslint-plugin-boundaries` for the tier rules. Violations must fail CI.
6. Configure Prettier with a checked-in config. Format check is part of verify.
7. Configure `bun test`. One sample test proves the runner works and that `bun test` discovers files per package.
8. Write `scripts/build.ts` that builds every package with `bun build` to `dist/`, ESM only, with external workspace dependencies. Build must be idempotent.
9. Add CI: install with frozen lockfile, typecheck, lint, format check, test, build. Cache Bun's install directory.
10. Add root scripts: `typecheck`, `lint`, `format`, `format:check`, `test`, `build`, `verify`.
11. Write `README.md`: what this repository is, current status (pre-alpha, no working framework yet), how to run checks.

### Exit criteria

| Criterion | Check |
| --- | --- |
| Clean install works | `bun install --frozen-lockfile` |
| Typecheck works | `bun run typecheck` |
| Lint works and catches a tier violation | `bun run lint`, plus a temporary violation observed and reverted |
| Format check works | `bun run format:check` |
| Tests run | `bun test` |
| Build works | `bun run build`, `dist/` produced for contracts |
| Tier boundary enforced | CI fails on an intentional cross-tier import, recorded in the report |
| No empty packages | Only `@loom/contracts` exists |

### Cold-start brief

Read `docs/ARCHITECTURE.md` sections 3 and 11 and `docs/DEVELOPMENT_STANDARDS.md`. Nothing exists except `PRD.md` and `docs/`. Build the workspace described above. Do not create packages for later stages. The only package with code is `@loom/contracts`, and every export in it is used by a later stage or by its own tests.

---

## 4. Stage 2 — Core, runtime, and CLI

Relative size: L. Risk: medium. Largest unknown: the module kernel is easy to over-build.

### Objective

A real boot process: config in, modules registered, errors shaped, logs emitted, CLI creates and inspects a project.

### Inputs

- Stage 1 toolchain
- `docs/ARCHITECTURE.md` sections 2, 6, 7, 10
- `PRD.md` sections 12.3 to 12.6, 13, 25, 27, 50

### Deliverables

- `@loom/core`: config loader, env validation, error hierarchy, logger, container, module registry, lifecycle, runtime detection, request context and ID propagation
- `@loom/testing`: `createTestApp` with a minimal app builder
- `@loom/cli`: binary, help, version, `create`, `doctor`, `module:list`
- `apps/playground`: a bootable app with two modules and one lifecycle hook
- `docs/` update: core concepts, config reference, module guide

### Tasks

1. Config: layered merge, Standard Schema validation, env references, aggregated error output. Test defaults, overrides, missing secrets, and malformed values.
2. Env: declare required and optional variables in config, validate at boot, never read `process.env` outside this module.
3. Errors: base class plus the subclasses from architecture section 7. Serializer produces problem details with a request ID.
4. Logger: structured JSON in production, readable lines in development, child loggers with bound context, redaction list for known secret keys.
5. Container: typed registration and resolution, no global singleton, resolution errors name the missing token and the requester.
6. Module system: module definition shape (name, version, dependencies, services, setup, hooks), topological sort, cycle detection with the full chain, enable and disable by config.
7. Lifecycle: `setup`, `ready`, `shutdown`, ordered correctly, idempotent shutdown, timeout on shutdown.
8. Runtime detection: Bun or Node, version, capability flags for SQLite driver and password hashing. Node paths compile but are not claimed as tested.
9. Request context: request ID generation, principal placeholder, logger child, service accessor, transaction slot left for Stage 3.
10. CLI: argument parsing without a dependency if a small parser stays under roughly 150 lines; otherwise use a maintained parser and record the reason. `create` renders a template directory, refuses a non-empty target, supports `--no-install` and `--no-git`, prints next steps.
11. Templates: `blank` and `api` only in this stage. `admin` arrives when there is an admin UI.
12. `doctor`: Bun version, Node version, config validity, writable directories, port availability.
13. Playground boots, logs, registers two modules, and shuts down cleanly on SIGINT.
14. Tests: unit coverage for config merge, module ordering, error serialization, logger redaction; an integration test for boot and shutdown.

### Exit criteria

| Criterion | Check |
| --- | --- |
| App boots | `bun run --cwd apps/playground start` prints a ready line |
| Config validation | Test with missing env var lists every problem |
| Module order | Test with A depends on B starts B first; a cycle fails with both names |
| Errors serialize | Test asserts RFC 9457 fields and no stack trace |
| CLI creates a project | `bun run loom create /tmp/smoke --no-install --no-git` then boot it |
| CLI refuses unsafe target | Non-empty directory exits non-zero with a clear message |
| Shutdown clean | SIGINT test drains and exits 0 |
| Node path compiles | `bun run typecheck` includes Node branches |

### Cold-start brief

Read architecture sections 6, 7, 10. Stage 1 exists: workspace, contracts, lint, tests, build. Build `@loom/core` first, then `@loom/testing`, then the CLI, then the playground. Every config value used by the playground must be validated, not read directly. There is no HTTP server yet, so `dev`, `build`, and `start` are not implemented in this stage; they arrive in Stage 4.

---

## 5. Stage 3 — Database and model

Relative size: XL. Risk: high. This is the stage most likely to overrun.

### Objective

Model definitions become a real schema, typed access, and reversible migrations on at least one dialect that can be tested on this machine.

### Inputs

- Stage 2 core
- `docs/ARCHITECTURE.md` sections 4.1, 4.2
- `PRD.md` sections 16, 17, 18.1, 32

### Deliverables

- `@loom/model`: builders, IR normalization, naming, relation resolution, metadata merge
- `@loom/validation`: IR to Standard Schema, field errors
- `@loom/db`: gateway interface, dialect capabilities, migration engine, schema diff, drift detection
- `@loom/db-sqlite`: tested adapter
- `@loom/db-postgres`: adapter, marked experimental until a server is reachable
- CLI: `db:generate`, `db:migrate`, `db:rollback`, `db:seed`, `db:inspect`, `make:model`
- Migrations and seed fixtures for a three-model sample
- `docs/`: model guide, migration guide, dialect support matrix

### Tasks

1. Model builders: `model()`, field helpers per logical type, relations (`belongsTo`, `hasMany`), indexes, timestamps, soft delete flag, table and column overrides.
2. IR normalization: stable ordering, default names, validation metadata, UI metadata, authz metadata, resource metadata. Round-trip test through JSON.
3. Logical type to dialect type map. Write it as data, not branches scattered through the code.
4. Validation projection: required, length, range, pattern, enum, format, custom refinements. Zod behind an adapter.
5. Gateway: selection with projection, filters, ordering, limit and cursor; inserts returning rows; updates and deletes with affected counts; transactions with rollback on throw; raw SQL with parameters.
6. Identifier safety: table and column names resolve through the IR registry; anything else is rejected before SQL construction.
7. SQLite adapter: `bun:sqlite`, Drizzle wiring, pragmas for foreign keys and journal mode, transaction behavior, error translation.
8. PostgreSQL adapter: `pg` pool, Drizzle wiring, transaction isolation default, error code translation, connection retry policy. Spike first: introspection, relations, transactions, raw SQL. Record the conclusion before adopting.
9. Migration engine: snapshot from IR, diff against previous snapshot, SQL generation per dialect, checksums, applied-migrations table, locking, transaction per migration where the dialect allows it.
10. Destructive change classification: drop table, drop column, type narrowing, and data loss require `--allow-data-loss` plus a printed plan.
11. Rollback: reverse of the last applied migration, refused when the snapshot is missing.
12. Seeds: idempotent seed runner with explicit upsert keys.
13. Introspection: read tables, columns, foreign keys, indexes, and enums into IR, with a review file that a human can edit before generating models. Keep it honest about what it cannot infer.
14. Drift: compare live schema against snapshot and report differences without writing.
15. Contract suite: one test file executed against every dialect adapter that is available. Skips must name the missing capability.
16. CLI commands with non-interactive flags and stable exit codes.
17. Tests: unit for IR and diff, integration on SQLite for migrations up and down, uniqueness and foreign-key failures translated to `ConflictError`.

### Exit criteria

| Criterion | Check |
| --- | --- |
| SQLite round trip | `bun run loom db:migrate` then `db:rollback` on a temp database |
| Model metadata | Test asserts every metadata group is present after normalization |
| Validation | Invalid payload returns field errors mapped from IR |
| Transactions | Throwing inside a transaction leaves no rows |
| Raw SQL | Parameterized query works; identifier injection is rejected |
| Drift detection | Manual `ALTER TABLE` is reported |
| Destructive guard | Dropping a column without the flag exits non-zero |
| PostgreSQL | PASS only with a reachable server; otherwise NOT VERIFIED and adapter labeled experimental |
| Type safety | No `any` in public signatures; typecheck passes |

### Cold-start brief

Read architecture section 4.1 and 4.2 and PRD section 17. Stage 2 provides config, errors, modules, and logging. Build the IR first with tests, because validation, CRUD, and UI all read it. Drizzle is a candidate, so run the spike before committing: introspection, relations, transactions, raw SQL, and error mapping. This machine has no PostgreSQL server and no Docker; SQLite is the tested dialect, PostgreSQL is implemented behind the same contract suite but reported as unverified until a DSN is provided.

---

## 6. Stage 4 — Backend and API

Relative size: L. Risk: medium. Adapter leakage and middleware ordering are the usual defects.

### Objective

An HTTP server serving validated, authorized-shaped requests through a Loom handler contract, with the same handlers callable without a socket.

### Inputs

- Stage 3 gateway and validation
- `docs/ARCHITECTURE.md` sections 4.3, 5
- `PRD.md` sections 15, 12.4, 30.1, 50

### Deliverables

- `@loom/http`: route manifest, handler contract, middleware pipeline, body limits, problem-details mapping, direct invocation helper
- `@loom/http-elysia`: Elysia adapter, the only Elysia import
- CLI: `dev`, `build`, `start`, `routes`
- `apps/playground`: two custom routes, one validated, one streaming a file
- `docs/`: routing guide, middleware guide, error reference

### Tasks

1. Handler contract: `{ request, ctx, input }` in, `Response` out. Compile-time input types from the schema.
2. Route manifest: method, path, schema, handler, access descriptor, OpenAPI metadata placeholder. Deterministic ordering for `routes` output.
3. Middleware: fixed order, typed context extension, early termination, error propagation, no middleware that silently swallows.
4. Body parsing: JSON only in this stage, size limit, content-type check, malformed body returns 400 with a safe message.
5. Validation wiring: query, path params, body, headers. Coercion rules explicit. 422 with field paths.
6. Error mapping: Loom errors to problem details; unknown errors become 500 with a request ID and a logged cause.
7. Request ID: accept a valid inbound ID, otherwise generate; always echo in the response header.
8. Elysia adapter: mount manifest, translate Elysia context to Web `Request`, mount static assets in production, map errors, expose graceful shutdown.
9. Direct invocation: `app.handle(request)` used by tests and by serverless-style deployments.
10. CORS helper: explicit allowlist, credentials rules, preflight. No wildcard with credentials.
11. Rate limit hook: interface plus in-memory implementation, keyed by IP or principal. Distributed backend deferred.
12. Route-level access descriptor: a hook that Stage 5 fills with authz. Until then, a route can declare `public` explicitly and everything else is denied when a principal resolver is installed.
13. CLI `dev`: watch server modules, restart on change, restart on config change, clear error output.
14. CLI `build`: server bundle plus client assets placeholder; `start` runs the built server.
15. `routes` command prints the manifest as a table and as JSON.
16. Tests: handler suite that runs through Elysia and through direct invocation, asserting identical status, headers, and bodies.

### Exit criteria

| Criterion | Check |
| --- | --- |
| Server starts | `bun run loom dev` in the playground |
| Routes work | curl against two routes, one with input |
| Validation | 422 body matches problem details with field paths |
| Error safety | 500 response has no stack or SQL text |
| Direct invocation parity | Same suite passes both paths |
| Middleware order | Test asserts request ID exists before logging and before validation |
| Body limit | Oversized body returns 413 |
| No adapter leakage | `grep` shows no Elysia import outside `http-elysia` |
| Build and start | `loom build` then `loom start` serves the playground |

### Cold-start brief

Read architecture sections 4.3 and 5. Stage 3 provides the gateway and validation. Implement `@loom/http` with zero Elysia imports, then a thin Elysia adapter. The acceptance test for the seam is the same handler suite running twice: once through Elysia, once by calling `app.handle(new Request(...))`. If a feature only works through Elysia, the seam is wrong.

---

## 7. Stage 5 — CRUD and security foundation

Relative size: XL. Risk: high. This stage carries the product promise and most of the security surface.

Gate: Q-02 must be answered or the PRD default accepted in writing before authentication code starts. Stage 5 may be split into 5a (CRUD with a test identity provider) and 5b (session authentication) with owner approval.

### Objective

Every model registered as a resource gets working list, read, create, update, and delete endpoints that deny access by default and enforce authorization in SQL.

### Inputs

- Stage 4 HTTP seam and validation
- Stage 3 IR and gateway
- `PRD.md` sections 18, 23, 24, 30, 42 (CRUD and security ACs)

### Deliverables

- `@loom/authz`: permission grammar, policy evaluation, field masks, row-scope predicates
- `@loom/auth`: principal interface, session store, password hashing, login, logout, session rotation, rate limit hooks
- `@loom/audit`: event contract, writer, persistence table
- `@loom/crud`: resource registry, query parser, handlers, hooks, bulk operations, soft delete
- CLI: `make:resource`
- Integration app in `apps/playground` with three resources and four roles
- `docs/`: CRUD guide, authorization guide, security notes

### Tasks

1. Resource definition: model reference, route base, allowed operations, list of writable fields, default sort, page size cap, hooks. Registration without rules starts fully denied.
2. Query parser: `filter`, `sort`, `page`, `cursor`, `pageSize`, `search`, `fields`, `include`. Operator allowlist per field type. Reject unknown fields.
3. List handler: authorization decision, row predicate, projection, stable ordering with a tiebreaker, cursor encoding, count strategy, page size cap.
4. Read handler: authorize by record scope, apply read masks, 404 for out-of-scope records.
5. Create: validate, strip non-writable fields, apply defaults, insert, return masked row, emit audit.
6. Update: authorize record, validate patch, reject fields outside the write mask, optimistic concurrency via `updatedAt` or version, emit audit with changed field names only.
7. Delete: authorize, soft delete when enabled, hard delete otherwise, return 204, emit audit.
8. Relations: include allowlist per resource, batched loading to avoid N+1, nested masks.
9. Pagination: offset by default, cursor where the sort is stable. Cap page size and total count cost.
10. Search: per-resource searchable fields, case-insensitive contains with dialect-appropriate operators, index warning when configured.
11. Bulk operations: bounded batch size, per-record authorization, all-or-nothing transaction, denied IDs listed when safe.
12. Hooks: before and after per operation, typed context, ability to veto with an error, no silent mutation of the input object.
13. Authz: permission strings (`resource:action`), role definitions, policy functions with a narrow context, deny wins, field masks, row predicate builder that returns SQL fragments and parameters.
14. Row scope: compiled into the query, tested with a user who must see zero rows, one row, and many rows. A post-fetch filter fails the test.
15. Authn core: `IdentityProvider`, `SessionStore` (database-backed), `PasswordHasher` (Bun Argon2id on Bun), opaque session cookie with `HttpOnly`, `Secure` in production, `SameSite=Lax`, rotation on login, absolute and idle expiry, CSRF token for unsafe methods, rate limit on login and reset.
16. Audit: authentication events and CRUD writes, actor, action, resource, record ID, timestamp, request ID. No payload values by default.
17. Testing utilities: factory per resource, authenticated request helper per role, database reset between tests.
18. Security matrix: every generated route against anonymous, each role, out-of-scope records, masked fields, mass assignment attempts, and bulk mixed authorization. This is the stage's main deliverable in test form.
19. `make:resource` writes an editable resource file; it refuses to overwrite without `--force`.

### Exit criteria

| Criterion | Check |
| --- | --- |
| CRUD works | Integration test: create, list, read, update, delete |
| Deny by default | New resource returns 403 for every role until a rule is added |
| Anonymous denied | No session returns 401, not 200 with empty data |
| Row scope in SQL | Query log test asserts the predicate appears in SQL |
| Field masks | Response omits masked field; write of masked field returns 403 or 422 per contract |
| Mass assignment | Extra fields in the body are ignored, not written |
| Bulk safety | Mixed authorized and unauthorized IDs fail atomically |
| Audit | Create and update produce audit rows without payload values |
| Session security | Cookie flags, rotation, expiry, CSRF, rate limit all tested |
| No frontend trust | Removing client checks changes nothing in test outcomes |

### Cold-start brief

Read PRD sections 18, 23, 24, and the CRUD security criteria in section 42, then architecture section 8. Stage 4 gives you the handler contract and middleware. Build authz before CRUD, because the CRUD handlers must have nothing to bypass. If Q-02 is unresolved, implement the interfaces and the PRD's recommended session-first design, label it PROVISIONAL in the report, and keep the implementations behind the interfaces. Never ship a generated route without an access rule.

---

## 8. Stage 6 — Forms and UI foundation

Relative size: XL. Risk: medium-high. Scope creep lives here.

### Objective

A React admin that renders create, edit, and read-only forms from model metadata, with server-enforced field permissions.

### Inputs

- Stage 5 CRUD endpoints and masks
- `docs/ARCHITECTURE.md` section 9
- `PRD.md` sections 14, 19, 33, 34

### Deliverables

- `@loom/ui`: descriptor types, tokens, widget contracts, default theme
- `@loom/react`: provider, API client, form renderer, field widgets, layout primitives, login page
- `@loom/storage`: local filesystem adapter and upload endpoint
- `apps/playground` or a new `apps/admin-demo`: three working screens
- `docs/`: UI guide, form customization guide, theming guide

### Tasks

1. Descriptor generation on the server: form schema from IR plus principal masks, field order, groups, help text, validation rules mirrored for client hints.
2. Tokens: color, spacing, radius, typography, focus ring, dark mode variables. One default stylesheet.
3. React provider: config, API base, fetch wrapper with credentials, error normalization, query cache (TanStack Query if adopted in Stage 1 spike; otherwise a small internal hook).
4. Widget registry: text, textarea, number, email, password, date, datetime, boolean, select, multi-select, relation, file, image, hidden.
5. Field rendering: label, help text, error, required marker, disabled and read-only states, `aria-describedby` wiring, `aria-invalid`.
6. Layout: single column by default, two-column above a breakpoint, field groups, custom render slots.
7. Validation: client-side from descriptor, server errors mapped back to fields, form-level errors, no loss of user input on failure.
8. Relations: async selector with search, pagination, preselected label, permission-aware options.
9. Conditional fields: show and hide rules from descriptor; hidden fields are not submitted and not validated.
10. Dependent fields: clear or refetch when a parent changes; explicit dependency declaration.
11. Modes: create, edit, read-only. Read-only uses the same descriptor with all fields disabled and no submit.
12. Submit: optimistic disabled state, duplicate-submit prevention, success navigation, conflict handling for 409.
13. File upload: direct endpoint with size and type limits, storage key generated randomly, MIME sniffing, no execution path, local adapter only.
14. Permission-aware UI: masked fields absent from the descriptor; the client never receives them.
15. Login page and session bootstrap: redirect unauthenticated users, preserve return path, no token in local storage.
16. Error and loading states: skeletons for data, inline errors for mutations, retry where safe.
17. Accessibility: labels, focus order, error announcement, keyboard operation for every widget.
18. Component tests with happy-dom and Testing Library for validation, conditional fields, modes, and permission masks.

### Exit criteria

| Criterion | Check |
| --- | --- |
| Forms generate | A model with ten field types renders without hand-written field code |
| Create and edit | Both modes submit and persist through CRUD |
| Validation | Client hints plus server rejection mapped to the right field |
| Conditional fields | Hidden field is absent from the payload |
| Permissions | Masked field never appears in the network response |
| Custom widget | Registering a widget replaces the default for one field |
| Read-only | No submit control, no editable input |
| Upload | File stored with a random key, type and size enforced |
| Theme | Token override changes the rendered styles |
| Tests | Component tests pass; no snapshot-only assertions for behavior |

### Cold-start brief

Read architecture section 9 and PRD section 19. Stage 5 gives you CRUD endpoints and field masks. Descriptors come from the server; the client never infers permissions. Build the widget registry before the form renderer so field types are data, not a switch statement that grows forever. Keep wizards, repeating fields, and rich text out; they are explicitly deferred.

---

## 9. Stage 7 — DataTable

Relative size: L. Risk: medium. Performance claims need measurement, not intuition.

### Objective

Server-driven tables that stay correct and fast at 100k rows, with filters, sorting, search, bulk actions, and permission-aware columns.

### Inputs

- Stage 5 list endpoints and query grammar
- Stage 6 UI foundation
- `PRD.md` section 20 and AC-TABLE criteria

### Deliverables

- Table descriptor generation on the server
- `@loom/react` table components: header, rows, pagination, filter bar, column menu, bulk bar, empty and error states
- CSV export endpoint and client trigger
- `benchmarks/table.ts` with recorded output
- `docs/`: table guide, query grammar reference, performance notes

### Tasks

1. Table descriptor: column order, type, sortable, filterable, width hints, relation display field, mask state.
2. URL state: filters, sort, page or cursor, search, visible columns. Shareable and restorable.
3. Server state: no client-side dataset; every change refetches; stale response protection.
4. Filtering: per-type operators, multi-column filters, filter chips, clear all.
5. Sorting: single column in MVP, stable tiebreaker, relation fields sort by display column or are disabled explicitly.
6. Search: debounce, server-side, searchable fields from resource config.
7. Columns: visibility menu persisted per user in local storage, sensible defaults, no masked columns.
8. Relations: display label from included relation, batched fetch, link to the related record when permitted.
9. Bulk selection: current page and all-matching modes, explicit count, bounded batch size, confirmation for destructive actions.
10. Row actions: edit, delete, custom actions from resource config, permission-filtered.
11. Inline editing foundation: single-cell edit contract and endpoint, feature-flagged and off by default.
12. Responsive: card layout below the breakpoint with the same data and actions.
13. Export: CSV streaming from the same query, bounded by a row cap, permission-aware columns, audit event.
14. Performance: count query strategy, index use for common filters, query-count assertions in tests, 100k-row benchmark with p50 and p95 recorded.
15. Accessibility: table caption, `aria-sort`, focus management after actions, announced result counts.

### Exit criteria

| Criterion | Check |
| --- | --- |
| Table generates | Model with relations renders without hand-written columns |
| Pagination | Server-side; changing page fetches new rows only |
| Filters | Two filters combine correctly |
| Search | Search narrows results server-side |
| Sorting | Sort persists in URL and applies server-side |
| Permissions | Masked column absent from descriptor and response |
| Bulk | Selection count matches, action applies atomically |
| Large data | Benchmark runs on 100k rows, recorded in the report |
| N+1 | Query count per page is constant as row count grows |
| Mobile | Card layout at narrow width, actions reachable |

### Cold-start brief

Read PRD section 20 and architecture section 11. Stage 5 already parses filters and sorts; do not write a second query implementation in the table. The table renders descriptors and sends state to the existing list endpoint. Measure before claiming performance; the benchmark script and its output are part of the deliverable.

---

## 10. Stage 8 — Dashboard, reporting, and integration

Relative size: XL. Risk: high. Integration defects surface here.

### Objective

A working reference application that proves the engines cooperate, plus honest documentation of what remains.

### Inputs

- Stages 1 to 7
- `PRD.md` sections 21, 22, 39.4, 42, 48, 49

### Deliverables

- `@loom/dashboard`: widget registry, metric and chart queries, layout, role filtering
- `@loom/report`: report definitions, grouped queries, filters, CSV export
- `apps/stockroom`: the PRD reference application with six models
- `packages/react` additions: metric card, chart widget, dashboard grid, report page
- `docs/GETTING_STARTED.md`, `docs/API_REFERENCE.md`, `docs/SECURITY.md`, `docs/CONTRIBUTING.md`, updated architecture
- Full verification run with recorded output

### Tasks

1. Dashboard registration: layout definition, role filter, widget placement.
2. Metric widget: aggregate query with filters, cache header policy, permission check.
3. Chart widget: line and bar from a query descriptor, rendered with ECharts, accessible summary text, no client-side data processing beyond formatting.
4. Table widget: reuse the Stage 7 table with a compact mode and a fixed filter.
5. Custom widget contract: a component receives descriptor and data, not app internals.
6. Responsive dashboard: grid collapses to one column; no horizontal scroll.
7. Reports: definition with dataset query, allowed filters, grouping, aggregations, date range, column list, permission check.
8. Report execution: on demand, row cap, timeout, CSV streaming, audit record.
9. Background jobs: not implemented. The interface and the documented limitation replace a fake queue.
10. Stockroom: six models, migrations, seeds, four roles, product list, product form, warehouse-scoped movements, dashboard, sales-by-category report, audit view, custom stock adjustment endpoint inside a transaction.
11. Seed data: 100k products generated deterministically for the benchmark, smaller fixture set for tests.
12. End-to-end: Playwright if installable; otherwise a scripted HTTP walkthrough that covers the same paths and is reported as the substitute.
13. Documentation pass: quickstart from a clean clone, model guide, CRUD guide, auth guide, security guide, troubleshooting, known limitations.
14. Final verification: typecheck, lint, format, unit, integration, security, component, benchmark, build, CLI smoke, Node attempt.
15. Write `docs/` limitations section: no MySQL, no Hono, Node unverified, no plugins, no multi-tenancy, no jobs, no i18n catalogs, no docs site.

### Exit criteria

| Criterion | Check |
| --- | --- |
| Engines cooperate | Stockroom runs from a clean checkout with three commands |
| Dashboard | Four metrics and one chart render from real queries |
| Reports | CSV export matches the filtered dataset |
| Permissions | Role-filtered dashboard and warehouse-scoped movements tested |
| Security matrix | Full matrix passes on Stockroom resources |
| Benchmark | 100k-row list and report timings recorded |
| Docs | A person outside the team can follow the quickstart (or the gap is recorded) |
| Build | Production build starts and serves the app |
| Honesty | Known limitations documented; no production-readiness claim |

### Cold-start brief

Read PRD section 39.4 for the reference app and section 21 and 22 for dashboard and reporting. Stages 1 to 7 provide everything except aggregation and presentation. Do not build a second query path; reports and metrics go through the gateway with an explicit, permission-checked query descriptor. Stockroom is the integration test, not a demo with hardcoded data.

---

## 11. After Stage 8

The pipeline ends at MVP integration. These PRD items remain and are not hidden:

| Area | PRD reference | Why it is not in Stages 1 to 8 |
| --- | --- | --- |
| MySQL adapter | 16, Q-04 | No server to test, decision open |
| Node.js support guarantee | 13, Q-08 | Needs a compatibility run and a supported floor |
| Hono adapter | 15 | One adapter first |
| Preact, Vue, Svelte | 14 | React conformance first |
| Multi-tenancy | 24.7, Q-15 | Schema, cache, and security work of its own |
| Plugin system, marketplace | 26, Q-06 | Trust and isolation unresolved |
| Background jobs, scheduled reports | 22.10 | No queue in MVP |
| OAuth, OIDC, MFA, SSO | 23.6 | Session-first MVP |
| i18n catalogs and RTL | 34 | English first |
| OpenAPI and API reports | 50 | Protects an API that is still moving |
| Docs site | 49 | Markdown until the API stabilizes |
| Security hardening audit | 30, 40.14 | Needs a completed surface to audit |
| Performance and bundle budgets | 32 | Needs the full build |
| Release engineering | 40.15 | Tags, changelog, support window |

Ordering after Stage 8, by dependency: Node compatibility run, MySQL spike, security audit, i18n, OpenAPI, plugin design, multi-tenancy, frontend adapters.

---

## 12. Environment constraints

Recorded from the machine used for development. These are facts, not guesses.

| Item | Value | Consequence |
| --- | --- | --- |
| Bun | 1.4.4 | Primary runtime; pin in `packageManager` |
| Node | 24.22.1 | Available for compatibility checks, not supported yet |
| PostgreSQL | not installed | Stage 3 PostgreSQL adapter cannot be verified here |
| Docker | not installed | No containerized database without installing Docker |
| MySQL | not installed | MySQL adapter deferred |
| SQLite | 3.53.4 CLI, `bun:sqlite` in runtime | Tested dialect |
| CPU | 2 cores | CI fast lane must stay small; benchmarks are indicative, not capacity planning |
| Memory | 3 GB | Avoid parallel test workers that exceed memory; no heavy browser matrix |
| Disk | 88 GB free | Enough for dependencies and browser binaries if needed |
| Git | 2.56.1, repository not initialized | Stage 1 initializes it |

If a PostgreSQL server becomes available before Stage 3, the adapter is verified and the label changes. If not, the stage still completes with SQLite as the verified dialect and PostgreSQL labeled experimental. That outcome must be stated in the Stage 3 report.

---

## 13. Dependency introduction schedule

Versions below are current as of Stage 0 and are pinned at install time. A version bump is a normal change, not a decision.

| Dependency | Stage | Purpose | Gate |
| --- | --- | --- | --- |
| `typescript` 5.9.x | 1 | Types and checking | None; TS 7 exists but tooling support is unsettled |
| `eslint` 10 + typescript-eslint | 1 | Linting and import boundaries | None |
| `prettier` 3 | 1 | Formatting | None |
| `@types/bun` | 1 | Bun types | Matches runtime version |
| `zod` 4 | 2 | Config and env validation, later IR validation | Standard Schema compatibility checked |
| `drizzle-orm` 0.45, `drizzle-kit` 0.31 | 3 | SQL building, introspection reference | Spike: relations, transactions, raw SQL, dialect gaps |
| `pg` | 3 | PostgreSQL driver | Server availability |
| `elysia` 1.4 | 4 | HTTP adapter | Spike: Web `Request` translation, error mapping, shutdown |
| `react` 19, `react-dom` 19 | 6 | Admin UI | Confirmed |
| `@tanstack/react-query` 5 | 6 | Server state | Only if the Stage 1 size check accepts it |
| `echarts` 6 | 8 | Charts | Bundle size measured; accessible fallback provided |
| `happy-dom`, `@testing-library/react` | 6 | Component tests | None |
| `@node-rs/argon2` | 5 | Node password hashing | Bun uses `Bun.password`; Node path optional |
| `playwright` | 8 | End-to-end | Optional; browser download may be skipped |

Not added: a CLI argument parser until the built-in parser is clearly insufficient, a logger dependency while a small structured logger is enough, a date library while `Temporal` or `Intl` covers the need, an ORM on top of Drizzle, a state manager beyond the query cache, a component library while the widget registry is small.

---

## 14. Verification commands by stage

These are the commands the completion reports must show. Scripts are defined in Stage 1 and extended as stages add suites.

| Stage | Commands |
| --- | --- |
| 1 | `bun install --frozen-lockfile`, `bun run verify`, `bun run build` |
| 2 | `bun test packages/core`, `bun run loom create /tmp/smoke --no-install`, `bun run loom doctor` |
| 3 | `bun test packages/db packages/model packages/validation`, `bun run loom db:migrate`, `bun run loom db:rollback`, `bun run loom db:inspect` |
| 4 | `bun test packages/http tests/integration/http`, `bun run loom routes`, `bun run loom build`, `bun run loom start` |
| 5 | `bun test tests/security`, `bun test tests/integration/crud` |
| 6 | `bun test packages/react`, `bun run build`, manual check of three screens |
| 7 | `bun test tests/integration/table`, `bun run bench:table` |
| 8 | `bun run verify`, `bun run bench:table`, Stockroom quickstart, `bun run test:e2e` if configured |

A command that cannot run on this machine is reported with the reason and is not replaced by a claim.
