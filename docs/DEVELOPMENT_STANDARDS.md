# Development Standards

Rules for everything committed to this repository. They exist so nine stages of work stay coherent when written by different sessions.

Where a rule conflicts with `PRD.md`, the PRD wins and this file gets fixed. Security rules are never relaxed to make a test or a deadline easier.

---

## 1. Language and compiler

- TypeScript everywhere. No JavaScript source files except generated output.
- One root `tsconfig.json` with `paths` mapping `@loom/*` to package sources. `tsc --noEmit` is the typecheck.
- Required compiler options: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: "bundler"`, `target: "ES2023"`, `module: "ESNext"`.
- `any` is not allowed in public signatures. An `unknown` plus a narrowing function is the default replacement. A justified `any` needs a one-line comment naming the external boundary.
- `@ts-ignore` and `@ts-expect-error` are not allowed in source. `@ts-expect-error` is allowed in tests that assert a type is rejected, with a comment.
- Type assertions (`as`) are allowed at trust boundaries after validation, and when narrowing a discriminated union. Not as a way to silence the compiler.
- Prefer `type` for object shapes and unions, `interface` for extendable public contracts. Be consistent inside a file.

### 1.1 Public types

- Every exported symbol has TSDoc with a summary line. Parameters and return values get docs when the name does not explain them.
- Branded IDs for entity identifiers: `type UserId = Brand<string, "UserId">`. Prevents mixing IDs of different models.
- Public APIs take named options objects once they exceed three positional parameters.
- No overload sets unless the call sites genuinely read better. Prefer a union input and a discriminated result.
- Never widen a public type to make an internal change compile. Fix the internal type.

---

## 2. Package and module rules

- ESM only. No CommonJS output from framework packages.
- Named exports only. No default exports from library packages.
- Every package has an `exports` map with an explicit `types` condition first and no wildcard subpaths.
- Entry points: `.` for public API, `./internal` only when another first-party package needs non-public access, `./testing` only when tests outside the package need fixtures.
- Tier rules from `docs/ARCHITECTURE.md` section 3 are enforced by the import boundary linter. A violation fails CI; do not add an eslint-disable.
- No circular imports between packages, and none inside a package without a written reason in the PR description.
- No global mutable state. A module-level cache is allowed only when it is keyed, bounded, and documented.
- Import-time side effects are prohibited. `sideEffects: false` must be true for every package.

---

## 3. Naming and file layout

| Kind | Convention | Example |
| --- | --- | --- |
| Package directory | kebab case | `packages/db-postgres` |
| Source file | kebab case | `row-scope.ts` |
| Type or class | PascalCase | `ValidationError` |
| Function or variable | camelCase | `buildRowScope` |
| Constant | SCREAMING_SNAKE only for true constants | `MAX_PAGE_SIZE` |
| Test file | `*.test.ts` next to source, or under `tests/` for cross-package suites | `config.test.ts` |
| Fixture | `*.fixture.ts` | `product.fixture.ts` |
| Database table | snake case plural | `stock_movements` |
| Permission | `resource:action` | `product:update` |
| Error code | `LOOM_` prefix, screaming snake | `LOOM_VALIDATION_FAILED` |

Package layout inside a package:

```text
src/
├── index.ts        public exports only
├── internal/       not exported
├── <domain>/       feature modules
└── *.test.ts
```

A file over roughly 300 lines is a signal to split by responsibility, not a rule. A file under 20 lines that exists only to re-export is noise unless it forms a public entry point.

---

## 4. Error handling

- Throw `Error` subclasses. Never throw strings, objects, or `Response` from business logic.
- Reuse the hierarchy in `docs/ARCHITECTURE.md` section 7. A new error class needs a distinct code and a reason it cannot reuse an existing one.
- Catch only what you can handle. An empty `catch` is a defect. If cleanup is the only goal, rethrow after cleanup.
- Never convert an unexpected error into a success result.
- Driver, network, and parser errors are translated at the adapter boundary. Raw messages stay in logs.
- Error messages state what failed and what the caller can do. No "Something went wrong".
- Error messages never include secrets, tokens, connection strings, SQL text, or full file paths from the server.
- Client-facing error identity is `code`. Tests assert codes, not message strings.

---

## 5. Security rules

These are review-blocking. A change that weakens one is rejected regardless of schedule.

### 5.1 Access

- Generated resources start with no access rules. An empty policy set denies.
- Authorization runs server-side on every generated route. Client checks are convenience only.
- Policy evaluation happens before data access. A denied request must not execute a query.
- Row scope is compiled into SQL as a predicate with bound parameters. Filtering after fetch fails review.
- Field masks apply at serialization. Write masks apply at input validation, before the gateway call.
- Only IR fields marked writable are read from a request body. Never spread a request body into a write.
- Record-level operations verify the record is in scope, then act. A 404 and a 403 must not leak existence differently than the documented contract allows.

### 5.2 Data

- All SQL values are parameterized. Identifiers come from the IR registry or an explicit allowlist.
- No string concatenation into SQL, ever, including `ORDER BY` and table names.
- Transactions wrap multi-step writes, including audit records.
- Soft-deleted rows are excluded by default filters and cannot be resurrected through update unless the operation says so.
- Bulk operations are bounded, authorized per record, and atomic.

### 5.3 Secrets and output

- Secrets come from environment variables. Config files reference names, not values.
- No secret or token in logs, error responses, client bundles, or test fixtures committed to the repository.
- Cookies: `HttpOnly`, `Secure` outside development, `SameSite=Lax`, opaque session IDs, rotation on privilege change.
- CSRF protection on unsafe methods for cookie-authenticated routes.
- Password hashing uses Argon2id through the `PasswordHasher` interface. No MD5, SHA-1, or unsalted hashes anywhere.
- Uploaded files get random storage keys, MIME and size checks, no execution path, and `Content-Disposition: attachment` for non-image types.
- Security-sensitive comparisons use constant-time helpers where the platform offers them.

### 5.4 Dependencies

- A new dependency needs a reason in the PR description: what it replaces, maintenance status, license, install scripts, transitive count.
- No dependency for something the platform already provides.
- Lockfile committed. CI installs with a frozen lockfile.
- A high-severity advisory blocks a release.

---

## 6. Validation

- Validate at every trust boundary: HTTP input, config, environment, database results from external systems, plugin or template input.
- Validation produces typed output. Downstream code does not re-check the same shape.
- One schema per concept, shared between server validation and descriptor hints. Do not maintain a second client-only rule set that disagrees.
- Error paths use the field path the client can map back to a form field.
- Coercion is explicit. `"1"` becoming `1` is a decision per field, not a global setting.

---

## 7. Logging and observability

- Structured logs only. JSON in production, readable key-value lines in development.
- Every log line carries `requestId` when inside a request, plus `module` and `level`.
- Log at boundaries: request start and end, external call failure, migration apply, startup and shutdown. Not every function.
- Never log request bodies, passwords, tokens, cookies, or full records. Field names and IDs are enough.
- Errors log the cause chain once, at the boundary that handles them. Inner layers add context, not duplicate lines.
- Metrics and traces are interfaces in the MVP, not an OpenTelemetry dependency.

---

## 8. Testing

- Runner: `bun test`. No second runner.
- Test name includes the acceptance criterion when one exists: `it('AC-CRUD-04 denies list without an access rule', ...)`.
- A bug fix ships with a regression test that fails before the fix.
- Tests never touch the network, a shared database, or real time. Use a temp directory per suite, a fake clock, and in-memory adapters.
- Database tests create and destroy their own schema. No truncation of a shared database.
- Assertions target behavior: status, error code, returned shape, rows affected. Avoid snapshot-only tests for anything with logic.
- A skipped test names the reason and the capability that is missing, for example `skip: PostgreSQL server not available`.
- Do not change an assertion to match buggy output. Fix the code or record the defect.
- Do not delete a failing test without a written justification in the completion report.

Test layers and where they live:

| Layer | Location | Runs in |
| --- | --- | --- |
| Unit | next to source | every verify |
| Contract | `tests/contract/` | every verify on available dialects |
| Integration | `tests/integration/` | every verify |
| Security | `tests/security/` | every verify |
| Component | `packages/react/src/**/*.test.tsx` | every verify |
| End-to-end | `tests/e2e/` | Stage 8, optional |
| Benchmark | `benchmarks/` | manual and Stage 7 onward |

---

## 9. Comments and documentation

- Comment the reason, not the mechanics. If a line needs a comment to explain what it does, rename things first.
- A known limitation gets one line: `shortcut: <limit>, <when to upgrade>`.
- No commented-out code. Git remembers.
- No `TODO` markers as requirements. An open item goes to the progress file or an ADR.
- TSDoc on every public export. Internal code documents invariants and non-obvious ordering.
- A user-facing feature updates `docs/` in the same stage. Documentation at the end is a phase, not a habit.
- Docs describe what exists. Anything unbuilt is labeled proposed or deferred.

---

## 10. Git and review

- Trunk-based. Short-lived branches, one logical change per commit.
- Commit subject: imperative, under 72 characters, no trailing period. Body explains why when the subject cannot.
- Never commit generated build output, secrets, local databases, or editor state.
- A commit that changes behavior includes its tests.
- Review checklist: tier boundaries respected, errors typed, input validated, authorization present, SQL parameterized, no secret exposure, tests named after ACs, docs updated, no unrelated files.
- Security-sensitive packages (`auth`, `authz`, `db`, `http`, `storage`) need two reviewers once a second maintainer exists. Until then, the completion report lists what a second reviewer should check.

---

## 11. Definition of done

A change is done when all of these hold:

1. It compiles under the strict settings.
2. `bun run verify` passes locally.
3. New behavior has a test, and security behavior has a matrix case.
4. Errors are typed and safe to expose.
5. Public API additions have TSDoc and a stated stability level.
6. Documentation is updated where behavior is user-visible.
7. The diff contains no unrelated edits.
8. The completion report states what was not verified.

---

## 12. Prohibited patterns

| Pattern | Why |
| --- | --- |
| Empty function or fake return presented as implemented | Breaks trust and hides missing work |
| `catch {}` or logging and continuing as if success | Turns failure into silent data loss |
| `as any` at a boundary instead of validation | Removes the only check the boundary had |
| Disabling a lint rule to pass CI | Hides a boundary or type defect |
| Client-side permission checks as the only control | Trivially bypassed |
| String-built SQL | Injection |
| `process.env` reads outside the config module | Unvalidated configuration |
| Default-exporting framework APIs | Unstable refactors and tree-shaking |
| Adding a dependency for a few lines | Maintenance cost with no benefit |
| Deleting or weakening a test to go green | Hides a regression |
| Claiming a runtime, dialect, or check passed without running it | False evidence |

---

## 13. Commit message examples

```text
feat(db): add SQLite dialect adapter behind the gateway contract

Wires bun:sqlite through the dialect interface and runs the shared
contract suite. Transactions roll back on throw; driver errors map to
Loom conflict and not-found errors.
```

```text
fix(authz): compile row scope into the list query

The previous path filtered after fetch, which loaded out-of-scope rows
into memory. AC-AUTHZ-03 now asserts the predicate appears in SQL.
```
