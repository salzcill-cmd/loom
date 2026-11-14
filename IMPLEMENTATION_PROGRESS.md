# Implementation Progress

## Project

Framework development based on `PRD.md`. Working name Loom, package scope `@loom/`, naming tracked as Q-01.

## Current Stage

Stage 1 — Project foundation and development tooling.

## Last Completed Stage

Stage 0.

## Execution Status

- COMPLETED (Stage 1)

## Stage History

| Stage | Status | Completion Date | Test Status |
|---|---|---|---|
| 0 | COMPLETED | 2026-11-14 | Documentation checks only; no application code exists |
| 1 | COMPLETED | 2026-11-14 | typecheck, lint, format check, 12 unit tests, build, frozen install, boundary violation probes all pass |
| 2 | NOT_STARTED | — | — |
| 3 | NOT_STARTED | — | — |
| 4 | NOT_STARTED | — | — |
| 5 | NOT_STARTED | — | — |
| 6 | NOT_STARTED | — | — |
| 7 | NOT_STARTED | — | — |
| 8 | NOT_STARTED | — | — |

## Implemented Features

Stage 0 produces no runtime code, by design.

### Stage 0 (documentation)

- `docs/ARCHITECTURE.md`: system shape, tier model, package boundaries with per-stage introduction, five boundary contracts, request lifecycle, boot sequence, error model, security skeleton, frontend architecture, runtime strategy, test architecture, deliberate absences, open questions.
- `docs/IMPLEMENTATION_PLAN.md`: nine-stage mapping to PRD phases, deviations, per-stage deliverables and exit criteria with verification commands, cold-start briefs, post-Stage-8 backlog, environment constraints, dependency schedule.
- `docs/DECISION_LOG.md`: fifteen engineering ADRs with alternatives and revisit triggers, PRD decision carry-over, decisions required before specific stages.
- `docs/DEVELOPMENT_STANDARDS.md`: TypeScript settings, package rules, naming, error handling, security rules, validation, logging, testing, documentation, git and review, definition of done, prohibited patterns.
- `AGENTS.md`: cold-start instructions for coding agents working in this repository.

### Stage 1 (toolchain, first implementation)

- Git repository initialized on `main`; stage 0 docs and stage 1 work committed separately; working tree clean.
- Bun workspace root (`packages/*`, `apps/*`), Bun 1.4.4 pinned in `packageManager`, exact versions, committed `bun.lock`.
- Strict TypeScript: one root `tsconfig.json` with `@loom/*` path mapping and per-package tsconfigs for declaration emit.
- `@loom/contracts` (tier 0, zero runtime dependencies): branded IDs, RFC 9457 problem details with Loom codes and an `isProblemDetails` guard, Model IR types with all six metadata groups, resource definition, form/table descriptors, HTTP handler contract. 12 unit tests including two `@ts-expect-error` type-rejection checks.
- ESLint 10 flat config: boundary rules generated from a package table, so a package created in a later stage inherits its restrictions automatically. Also forbids `process.env` reads outside `@loom/core` and restricts adapter libraries (Elysia, React, Drizzle, pg, Zod, TanStack Query, ECharts) to their owning packages.
- Prettier 3 with `format:check` in verify; documentation prose excluded by `.prettierignore` so tables are not reformatted.
- `scripts/build.ts`: `bun build` per package plus declaration emit, and a check that every package's `exports` map points at files that exist.
- CI workflow (GitHub Actions): frozen install, `bun run verify`, build, cached Bun install.
- Root scripts: `typecheck`, `lint`, `format`, `format:check`, `test`, `build`, `verify`.
- `README.md` documenting pre-alpha status and how to run checks.

## Test Results

### Stage 0

Commands executed during Stage 0, with actual output.

| Command | Result |
| --- | --- |
| `ls -la` in repository root | Only `PRD.md` present before documentation was written |
| `bun --version` | `1.4.4` |
| `node --version` | `v24.22.1` |
| `npm --version` | `11.19.1` |
| `git --version` | `2.56.1` |
| `psql --version` | not found |
| `docker --version` | not found |
| `sqlite3 --version` | `3.53.4` |
| `nproc`, `free -g` | 2 cores, 3 GB RAM |
| PRD structure check (Python) | 55 numbered H2 sections, 47,333 words |
| `npm view <package> version` for candidate dependencies | Versions recorded in the implementation plan section 13 |

### Stage 1

| Command | Result |
| --- | --- |
| `bun install` | `102 packages installed` in 26.27s |
| `bun run typecheck` (`tsc --noEmit`) | clean; three initial errors fixed (missing `LogicalType` import, branded-type comparison, misplaced `@ts-expect-error`) |
| `bun run lint` (`eslint .`) | clean |
| Boundary probe 1: `import { z } from "zod"` inside `packages/contracts` | `no-restricted-imports` error, eslint exit code 1; file removed after |
| Boundary probe 2: `import { createApp } from "@loom/core"` inside `packages/contracts` | boundary error naming both packages, eslint exit code 1; file removed after, `bun run lint` clean again |
| `bun run format:check` | `All matched files use Prettier code style!` |
| `bun run test` | `12 pass, 0 fail, 29 expect() calls, 4 files` |
| `bun run build` | `built @loom/contracts`, `build complete: 1 package(s)`; exports map verified against emitted files |
| `bun run verify` (full chain) | typecheck, lint, format check, tests all pass |
| `bun install --frozen-lockfile` | `Checked 104 packages (no changes)` |
| `git status --short` | empty working tree after two commits (`docs: stage 0 blueprint`, `feat(repo): stage 1 workspace foundation`) |

## Known Issues

1. **No PostgreSQL server and no Docker on this machine.** The PostgreSQL adapter cannot be integration-tested locally. Stage 3 will verify SQLite and label PostgreSQL experimental unless a server or DSN is provided. Recorded in ADR-0004.
2. **No MySQL server.** MySQL is out of scope for Stages 1 to 8, consistent with PRD Q-04 being open.
3. **Authentication has no dedicated stage in the execution pipeline.** Stage 5 absorbs authentication core to make deny-by-default testable. This is proposed as ADR-0009 and needs owner approval plus Q-02.
4. **Stage 5 is oversized.** It contains CRUD, authorization, authentication, and audit. Splitting it into 5a and 5b is recommended at approval time.
5. **Q-01 name and npm scope are unverified.** The repository uses `@loom/` as a working scope. Renaming later changes manifests and imports.
6. **Q-02 is unresolved.** Authentication implementation is gated; the PRD recommendation is used if the owner does not answer.
7. **Node.js compatibility is unverified.** Node paths compile by design but no support is claimed until a compatibility run in Stage 8.
8. **2-core, 3-GB machine.** CI must stay small; benchmark numbers are indicative and must be labeled as such.
9. **Dependency versions move.** Versions recorded in the plan were current at Stage 0 and are pinned exactly; TypeScript 7.0.2 exists but the repo pins 5.9.3 because tooling support is unsettled.
10. **The execution pipeline stops at MVP integration.** PRD phases 11 to 15 (hardening, frontend expansion, plugins, docs site, release) remain open after Stage 8.
11. **Development-only resolution gap.** Typecheck resolves `@loom/*` through tsconfig path mapping to source; the build script checks that `exports` maps resolve from emitted files, but runtime import of a second package will not be proven until Stage 2 creates one.
12. **No license decided.** Q-03 is open; manifests are marked `UNLICENSED` and the README states all rights reserved.

## Technical Decisions

Full records in `docs/DECISION_LOG.md`. Stage 0 fixed the architecture; Stage 1 added these:

| ID | Decision | Status |
| --- | --- | --- |
| ADR-0001 | Nine-stage pipeline overrides PRD phase order; gaps move to a backlog | Accepted |
| ADR-0002 | Twenty packages and two apps, created per stage, never empty | Accepted |
| ADR-0003 | Runtime detection lives in `@loom/core`, no runtime packages in MVP | Accepted |
| ADR-0004 | SQLite is the verified dialect; PostgreSQL experimental without a server | Accepted |
| ADR-0005 | Web `Request`/`Response` is the HTTP seam; Elysia first, isolated | Accepted |
| ADR-0006 | Drizzle behind the gateway, adopted only if the Stage 3 spike passes | Proposed |
| ADR-0007 | Bun workspaces, single tsconfig with paths, `bun test`, ESLint 10, Prettier 3 | Accepted, confirmed by Stage 1 |
| ADR-0008 | Model IR is the single metadata source | Accepted |
| ADR-0009 | Authentication core in Stage 5 | Proposed, needs owner |
| ADR-0010 | Charts render in `@loom/react` | Accepted |
| ADR-0011 | API Extractor, Changesets, docs site deferred past Stage 8 | Proposed, needs owner |
| ADR-0012 | Documentation is Markdown in `docs/` | Accepted |
| ADR-0013 | Zod first, behind Standard Schema | Proposed |
| ADR-0014 | No CLI parser dependency until the built-in parser crosses 150 lines | Proposed |
| ADR-0015 | Migrations and resources on disk, UI descriptors at runtime | Accepted |

Stage 1 implementation notes:

- Boundary rules are generated in `eslint.config.js` from a package table instead of a plugin, so the restriction set cannot drift from the package graph and no plugin dependency is needed.
- Packages declare exact versions; `bunfig.toml` sets `exact = true` so future `bun add` calls stay pinned.
- Prettier deliberately ignores Markdown documentation to avoid reformatting hand-written tables and prose.
- `@loom/contracts` carries a few small runtime utilities (`toId`, `isProblemDetails`, `LOOM_ERROR_CODES`) because every later package needs the error contract without importing `@loom/core`.
- Package `license` is `UNLICENSED` until Q-03 is answered.

## Decisions Required Before Later Stages

| Before | Decision | Default if unanswered |
| --- | --- | --- |
| Stage 3 | PostgreSQL server, DSN, or accept experimental label | SQLite verified, PostgreSQL experimental |
| Stage 5 | Q-02 authentication architecture | Session-first, marked provisional |
| Stage 5 | Split into 5a and 5b | Run as one stage |
| Stage 6 | Q-10 primitives | Native primitives plus widget registry |
| Stage 8 | Playwright browser download allowed | Scripted HTTP walkthrough |

## Next Authorized Stage

Stage 2 — Framework core, runtime, and CLI foundation: config and env validation, error hierarchy, structured logging, container, module system with lifecycle, runtime detection, request context, `@loom/testing`, the `loom` CLI (`create`, `doctor`, `module:list`), and a bootable playground app.

Stage 2 requires explicit user approval. This file is a record, not authorization.
