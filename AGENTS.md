# AGENTS.md — Loom repository

Instructions for coding agents working in this repository. Read this first, then the document that owns the task.

## What this repository is

A TypeScript fullstack framework for CRUD, admin, ERP, and SaaS applications. The product specification is `PRD.md` (55 sections). Implementation status is in `IMPLEMENTATION_PROGRESS.md`.

## Current state

Stage 0 is complete: specification, architecture, plan, standards, and decision log exist. No framework code exists. Do not describe planned behavior as implemented.

Check `IMPLEMENTATION_PROGRESS.md` before starting. If the current stage is not authorized for you, stop and report that.

## Reading order

1. `IMPLEMENTATION_PROGRESS.md` — current stage and known issues.
2. `docs/ARCHITECTURE.md` — package tiers, contracts, request lifecycle.
3. `docs/DEVELOPMENT_STANDARDS.md` — compiler, naming, error, security, and test rules.
4. The PRD section that owns the requirement.
5. `docs/DECISION_LOG.md` when a choice looks unresolved.
6. Existing code and tests before writing new ones.

Do not load all of `PRD.md` when one section answers the question. Do not infer an API from a PRD example and treat it as existing.

## Stage discipline

- One execution, one stage. Stop when the stage is complete.
- Never start the next stage without explicit approval.
- A stage is done only when its exit criteria were checked with real commands.
- Record actual command output in `IMPLEMENTATION_PROGRESS.md`. Never write a result you did not observe.

## Invariants

These hold in every stage. A change that weakens one is rejected.

- Generated routes deny access until a rule allows it.
- Authorization runs before data access; row scope is a SQL predicate, not a post-fetch filter.
- Field masks apply on read serialization and write validation.
- Only IR fields marked writable are accepted from request bodies.
- SQL values are parameterized; identifiers come from the IR registry.
- Database writes that span steps run in a transaction, including audit records.
- Secrets come from environment variables and never appear in logs, errors, or client bundles.
- Adapters stay behind their seam: no Elysia import outside `@loom/http-elysia`, no React import outside `@loom/react`.
- A known limitation gets `shortcut: <limit>, <when to upgrade>`.
- No fake stubs, no swallowed errors, no `@ts-ignore`, no weakened tests.

## Commands

Defined in Stage 1. Until then there is nothing to install or run.

```text
bun install --frozen-lockfile
bun run verify        # typecheck, lint, format check, tests
bun run build
```

## Where things go

| Change | Location |
| --- | --- |
| Framework package | `packages/<name>/src` |
| Cross-package tests | `tests/<layer>` |
| Reference app | `apps/stockroom` |
| Benchmarks | `benchmarks/` |
| Architecture decision | `docs/DECISION_LOG.md` |
| Stage status and evidence | `IMPLEMENTATION_PROGRESS.md` |

## Reporting

End every stage with the completion report format in the execution prompt: status, implemented, files, dependencies, tests with real output, build, acceptance table, known issues, decisions, next stage, strict stop confirmation.

State what was skipped and what risk remains. A green report with an unrun check is a defect.
