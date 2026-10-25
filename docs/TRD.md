# Technical Requirements Document (TRD)

**Project:** Proofline, "Break it. Fix it. Prove it."
**Course:** BCSE320L Web Application Security, Fall Semester 2026-27
**Status:** Draft 1.0

---

## 1. Purpose and goals

Build a local lab and dashboard that demonstrates three availability and logic vulnerabilities, shows each one being exploited and then mitigated, and produces measurable evidence for a case study report.

Goals:

- G1. Demonstrate each flaw reproducibly on a local machine.
- G2. Let the user switch each flaw between Vulnerable and Hardened behaviour and compare the results.
- G3. Quantify the improvement with metrics and CVSS v3.1 scores.
- G4. Turn each exploit into an automated regression test and run it in CI.
- G5. Export evidence (tables, charts, JSON) that maps to the case study template.

## 2. Scope

**In scope**

- Three modules: slow regex (ReDoS), double redemption (race condition), outdated package (prototype pollution through a vulnerable dependency).
- Dashboard with per-module pages, a findings ledger, a pipeline page and an evidence export.
- CVSS v3.1 base score calculator.
- Regression tests, Semgrep, package audit and OWASP ZAP baseline scan in CI.

**Out of scope**

- Authentication of dashboard users, multi-user support, cloud deployment.
- Attacks against any system other than the local lab server.
- Additional vulnerability classes (SQL injection, XSS and so on). See "Future work".

## 3. Users and use cases

Primary users are the project team, the course faculty and evaluators.

- UC1. Run a module in Vulnerable mode and see the failure.
- UC2. Run the same attack in Hardened mode and see it fail.
- UC3. Run both modes side by side (paired run) and compare charts.
- UC4. Read the CVSS before and after for each finding.
- UC5. Export evidence for the report.
- UC6. See the CI results that prove each regression test.

## 4. Functional requirements

### 4.1 Platform

| ID | Requirement |
| --- | --- |
| FR-P1 | Every lab endpoint accepts a `mode` field with value `vulnerable` or `hardened`. Mode is per request and stored nowhere on the server. |
| FR-P2 | A run is one execution of an attack against a module in one mode. Every run is saved with its parameters, metrics and timestamps. |
| FR-P3 | The dashboard can start a paired run, which executes the same attack in both modes and shows both results together. |
| FR-P4 | A health endpoint exists and is probed by the dashboard during runs to show service availability. |
| FR-P5 | The lab server rejects any request whose remote address is not loopback. |
| FR-P6 | Run progress is streamed to the dashboard (Server-Sent Events) so charts update while the attack runs. |
| FR-P7 | A reset action restores seed data for every module. |

### 4.2 Module A: slow regex (ReDoS)

| ID | Requirement |
| --- | --- |
| FR-A1 | `POST /api/redos/validate` validates a text field against a pattern. |
| FR-A2 | Vulnerable mode uses a pattern with nested quantifiers (for example `^(\w+\s?)+$`) on the main thread. A crafted input blocks the event loop. |
| FR-A3 | Hardened mode applies all of: a maximum input length, a linear-time rewrite of the pattern, and execution inside a worker thread with a timeout. |
| FR-A4 | The attack runner sends inputs of increasing length (a ladder such as 16, 18, 20 up to a ceiling) and records response time for each. |
| FR-A5 | The ceiling is enforced on the server in both modes (`REDOS_MAX_LADDER`, default 28 repeats) so a run cannot freeze the machine. |
| FR-A6 | While the attack runs, the dashboard probes `/api/health` every 250 ms and plots probe latency. |
| FR-A7 | Metrics recorded: per-input response time, event-loop delay (p50, p99, max), probe latency, number of timed-out probes. |

### 4.3 Module B: double redemption (race condition)

| ID | Requirement |
| --- | --- |
| FR-B1 | `POST /api/race/redeem` redeems a single-use coupon and credits a wallet. |
| FR-B2 | Vulnerable mode performs check, then a short asynchronous step (simulating a call to a payment or ledger service), then write. Parallel requests all pass the check. |
| FR-B3 | Hardened mode performs the check and write as one atomic statement (`UPDATE ... WHERE uses < max_uses`), checks the number of changed rows, and enforces a unique constraint on `(coupon, user)`. An optional `Idempotency-Key` header makes retries safe. |
| FR-B4 | The attack runner sends N parallel requests (default 12, ceiling 50) using a barrier so they start together. |
| FR-B5 | Metrics recorded: accepted redemptions, rejected redemptions, expected redemptions (1), final wallet balance, expected balance, total duration. |
| FR-B6 | `POST /api/race/reset` restores the coupon and wallet. |

### 4.4 Module C: outdated package (prototype pollution)

| ID | Requirement |
| --- | --- |
| FR-C1 | The lab server installs two copies of the same library through npm aliases: a pinned vulnerable version and the current patched version. |
| FR-C2 | `POST /api/dep/settings` merges a user-supplied JSON object into a settings object. Vulnerable mode uses the vulnerable copy and a deep merge. Hardened mode uses the patched copy, rejects `__proto__`, `constructor` and `prototype` keys, and validates the body against a schema. |
| FR-C3 | `GET /api/dep/profile` returns a profile and performs an `isAdmin` check on a plain object. After successful pollution in Vulnerable mode, the check passes for a user who is not an admin. |
| FR-C4 | Every attack executes in an isolated child process so pollution never leaks into the main server process. |
| FR-C5 | `GET /api/dep/audit` returns the package audit (`npm audit --json`) summarised as: package, installed version, advisory, severity, fixed version. If the audit cannot reach the network, a stored fixture from a real earlier run is returned and clearly labelled as such. |
| FR-C6 | Metrics recorded: payload used, whether `Object.prototype` was modified, whether the admin check flipped, audit findings count by severity. |

### 4.5 Findings and CVSS

| ID | Requirement |
| --- | --- |
| FR-F1 | The `core` package implements the CVSS v3.1 base score formula and parses and prints vector strings. |
| FR-F2 | Each finding stores a title, module, weakness (CWE), OWASP category, a vulnerable vector and a hardened vector. |
| FR-F3 | The dashboard shows scores and severity ratings before and after, with the vector broken into its metrics in plain language. |
| FR-F4 | Unit tests check the calculator against published reference scores. |

Proposed starting vectors (the calculator confirms the scores):

| Finding | Vulnerable vector | Hardened vector |
| --- | --- | --- |
| ReDoS | `AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H` (expected 7.5) | `AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L` (expected 3.7) |
| Race condition | `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N` (expected 6.5) | Residual risk vector chosen by the team and justified in the report |
| Prototype pollution | Chosen by the team and justified in the report | Residual risk vector chosen by the team and justified in the report |

### 4.6 Regression tests

| ID | Requirement |
| --- | --- |
| FR-T1 | Each module has regression tests written as security assertions ("a single-use coupon is redeemed once"). |
| FR-T2 | Tests read `LAB_MODE` from the environment. With `LAB_MODE=hardened` the suite must pass. With `LAB_MODE=vulnerable` the targeted assertions must fail. |
| FR-T3 | A script (`test:proof`) runs the vulnerable suite and succeeds only when the expected tests fail. |

### 4.7 Evidence export

| ID | Requirement |
| --- | --- |
| FR-E1 | The Evidence page lists saved runs with filters by module and mode. |
| FR-E2 | Export produces a JSON file of all runs and a CSV per module. |
| FR-E3 | A print-friendly page renders the main charts and the CVSS table at A4 size, so the user can save as PDF and paste into the report. |
| FR-E4 | Each chart has a "Copy as image" action (PNG). |

### 4.8 CI pipeline

| ID | Requirement |
| --- | --- |
| FR-CI1 | On every push and pull request: install, lint, typecheck, unit tests. |
| FR-CI2 | `test:hardened` must pass. `test:proof` must report that the vulnerable suite fails as expected. |
| FR-CI3 | Semgrep runs with the Node, TypeScript and OWASP rule packs. Intentional findings in the vulnerable code are marked with an allow-list comment that states the reason. |
| FR-CI4 | The package audit runs and its output is uploaded as an artifact. The intentionally vulnerable alias is documented as an accepted exception. |
| FR-CI5 | OWASP ZAP baseline scan runs against the Docker Compose stack in Hardened mode and uploads the report. |
| FR-CI6 | The Pipeline page in the dashboard shows the latest results from a committed `docs/evidence/ci-summary.json`. |

## 5. Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | Setup from a fresh clone takes three commands or fewer (`pnpm install`, `pnpm dev`, open browser). |
| NFR-2 | No attack can run for more than 30 seconds. Every runner has a server-side time limit. |
| NFR-3 | The lab server binds to `127.0.0.1` and ignores `0.0.0.0` unless `LAB_ALLOW_CONTAINER=1` is set inside Docker. |
| NFR-4 | Dashboard meets WCAG 2.2 AA for contrast, focus visibility and keyboard use. |
| NFR-5 | Dashboard works from 360 px wide screens up to 1920 px. |
| NFR-6 | Largest Contentful Paint under 2.5 s on a laptop, using production build. |
| NFR-7 | TypeScript `strict` mode on in all packages. |
| NFR-8 | No secrets in the repository. Configuration through `.env` with a committed `.env.example`. |
| NFR-9 | Respect `prefers-reduced-motion`. |

## 6. API summary

All bodies are JSON. All endpoints are under `/api` on the lab server.

| Method and path | Purpose |
| --- | --- |
| `GET /health` | Liveness and event-loop delay snapshot |
| `POST /runs` | Start a run: `{ module, mode, params }`, returns `{ runId }` |
| `GET /runs/:id/stream` | Server-Sent Events for run progress and final result |
| `GET /runs` | List saved runs |
| `GET /runs/:id` | One run |
| `POST /redos/validate` | Module A: single validation call |
| `POST /race/redeem` | Module B: single redeem call |
| `POST /race/reset` | Module B: reset seed data |
| `POST /dep/settings` | Module C: merge settings |
| `GET /dep/profile` | Module C: profile with admin check |
| `GET /dep/audit` | Module C: dependency audit summary |
| `GET /findings` | Findings catalogue with CVSS vectors and scores |
| `GET /evidence/export` | JSON export of all runs |
| `POST /reset` | Reset every module to seed state |

Error format: `{ "error": { "code": "string", "message": "string" } }` with an appropriate HTTP status.

## 7. Data model (SQLite)

```
runs(
  id TEXT PRIMARY KEY,
  module TEXT,            -- 'redos' | 'race' | 'dep'
  mode TEXT,              -- 'vulnerable' | 'hardened'
  params TEXT,            -- JSON
  metrics TEXT,           -- JSON, shape depends on module
  status TEXT,            -- 'running' | 'done' | 'failed' | 'capped'
  started_at INTEGER,
  finished_at INTEGER
)

coupons(code TEXT PRIMARY KEY, max_uses INTEGER, uses INTEGER, value_cents INTEGER)
wallets(user_id TEXT PRIMARY KEY, balance_cents INTEGER)
redemptions(id INTEGER PRIMARY KEY, code TEXT, user_id TEXT, key TEXT, at INTEGER,
            UNIQUE(code, user_id))
findings(id TEXT PRIMARY KEY, module TEXT, title TEXT, cwe TEXT, owasp TEXT,
         vector_vulnerable TEXT, vector_hardened TEXT)
```

The `UNIQUE(code, user_id)` constraint is only enforced in Hardened mode. Vulnerable mode writes to a separate table `redemptions_naive` without the constraint so both behaviours can coexist.

## 8. Testing strategy

| Level | Tool | What |
| --- | --- | --- |
| Unit | Vitest | CVSS calculator, regex rewrite equivalence on valid inputs, merge guard |
| Integration | Vitest and Supertest | Every endpoint in both modes |
| Security regression | Vitest and Supertest | One assertion per flaw, run in both modes (see FR-T2) |
| Smoke | Playwright | Dashboard loads, a paired run completes, evidence export downloads |
| Static analysis | Semgrep | Rule packs plus custom rules for the three flaw patterns |
| Dynamic analysis | OWASP ZAP baseline | Hardened stack, passive scan |

## 9. Delivery plan and commit checkpoints

Commit after each stage passes its checks. Messages are short, imperative and follow the format in the README. The "Done when" column is the gate for that stage.

| Stage | Work | Done when | Example commit messages |
| --- | --- | --- | --- |
| 0 | Repo, pnpm workspaces, TypeScript config, lint, `.env.example`, empty apps | `pnpm install`, `pnpm lint` and `pnpm typecheck` run clean | `chore: scaffold pnpm workspace`, `chore: add lint and typecheck` |
| 1 | `core` package: types, CVSS calculator, findings catalogue | Calculator tests pass against reference scores | `feat(cvss): add v3.1 base score calculator`, `test(cvss): add reference vectors` |
| 2 | Lab server skeleton: Express, loopback guard, health, SQLite, runs table, SSE | `GET /health` works, a dummy run streams events | `feat(lab): add server and loopback guard`, `feat(lab): add run store and sse` |
| 3 | Module A in Vulnerable mode and attack runner | Ladder run shows response time growth, probe stalls | `feat(redos): add vulnerable validator`, `feat(redos): add ladder attack runner` |
| 4 | Module A Hardened mode | Same ladder stays flat, regression test passes | `feat(redos): add hardened validator`, `test(redos): add regression pair` |
| 5 | Module B Vulnerable and Hardened, attack runner | Vulnerable accepts more than one redemption, Hardened exactly one | `feat(race): add vulnerable redeem`, `feat(race): add atomic redeem`, `test(race): add regression pair` |
| 6 | Module C Vulnerable and Hardened, child-process runner, audit endpoint | Admin check flips in Vulnerable only, audit lists the advisory | `feat(dep): add aliased vulnerable package`, `feat(dep): add hardened merge`, `feat(dep): add audit summary` |
| 7 | Proof scripts: `test:hardened`, `test:proof` | Hardened passes, vulnerable fails as expected | `test: add proof matrix scripts` |
| 8 | Web app foundation: tokens, fonts, layout shell, API client | Shell renders on all breakpoints | `feat(web): add design tokens and shell` |
| 9 | Web: Overview page and the paired-run component | A paired run streams to two traces | `feat(web): add paired run view` |
| 10 | Web: three module pages with charts and metrics | Each module runs end to end from the UI | `feat(web): add redos page`, `feat(web): add race page`, `feat(web): add dependency page` |
| 11 | Web: Findings ledger, Pipeline page, Evidence page and export | Export downloads, print layout looks correct | `feat(web): add findings ledger`, `feat(web): add evidence export` |
| 12 | CI workflow, Semgrep, audit, ZAP, Docker Compose | Pipeline is green on `main` | `ci: add test and proof jobs`, `ci: add semgrep and zap` |
| 13 | Polish: accessibility pass, empty and error states, README screenshots | Checklist in section 10 satisfied | `style(web): refine spacing and focus states`, `docs: add screenshots` |
| 14 | Evidence capture for the report | `docs/evidence/` holds JSON, CSV and screenshots | `docs: add exported evidence` |

Rules for every stage:

- Run `pnpm lint`, `pnpm typecheck` and the relevant tests before committing.
- One logical change per commit. Do not mix features, fixes and formatting.
- Never commit a failing build to `main`.
- If a stage reveals a design problem, record it in `docs/Architecture.md` under "Decision log" and commit the note with the fix.

## 10. Acceptance criteria

The project is complete when all of these are true:

1. A fresh clone runs with `pnpm install` and `pnpm dev`.
2. Each of the three modules shows a clear, repeatable difference between Vulnerable and Hardened mode, in a single paired run.
3. ReDoS: Vulnerable response time grows steeply across the ladder and the probe stalls. Hardened stays flat and under 50 ms.
4. Race: Vulnerable accepts more than one redemption of the single-use coupon in at least 9 of 10 runs with 12 parallel requests. Hardened accepts exactly one in 10 of 10 runs.
5. Dependency: Vulnerable flips the admin check with the pollution payload. Hardened rejects the payload with a clear error. The audit lists the vulnerable package.
6. `test:hardened` passes and `test:proof` confirms the vulnerable suite fails as expected.
7. CVSS ledger shows a score before and after for every finding and the scores match the calculator tests.
8. CI is green and uploads the Semgrep, audit and ZAP outputs.
9. Evidence export produces JSON, CSV and a printable page.
10. Dashboard meets the design brief and passes keyboard and contrast checks.

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| A ReDoS run freezes the machine | Server-side ladder ceiling, per-run time limit, documented safe defaults |
| Race condition does not reproduce reliably | Use a start barrier and a fixed async gap (`RACE_GAP_MS`, default 15 ms) in the vulnerable path |
| npm audit does not flag the aliased package | Verify at build time. Pick a vulnerable version the advisory database lists. Fall back to the stored audit fixture |
| Prototype pollution leaks into other tests | Run attacks in a child process and reset between runs |
| ZAP scan is slow in CI | Baseline (passive) scan only, time-limited |
| Scope grows | Three modules only. Extras go in "Future work" |

## 12. Future work

- Add SQL injection, XSS and CSRF modules using the same mode switch and proof pattern.
- Add a rate-limiting and WAF comparison for the ReDoS module.
- Add distributed load testing for the DoS comparison.
- Add AI-assisted triage of findings.
