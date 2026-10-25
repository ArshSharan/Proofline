# Proofline

**Break it. Fix it. Prove it.**

Proofline is an empirical web security laboratory and telemetry dashboard. It takes three availability and logic flaws that most vulnerability labs skip, lets you exploit each one, switch the same code path to a hardened version, and prove the difference with quantitative measurements, CVSS v3.1 scores and automated regression tests.

> Local security engineering laboratory and defense testbed. Runs on your own machine only.

---

## What it shows

Most training apps (DVWA, Juice Shop, WebGoat) focus on stealing data. Proofline focuses on attacks that break a service or its business rules without stealing anything.

| Module | Flaw | Category | What you see |
| --- | --- | --- | --- |
| Slow regex | Regular expression denial of service (ReDoS) | Algorithmic Complexity / Availability | Response time against input length, and a live service probe that stalls during the attack |
| Double redemption | Race condition, a logical DoS | Concurrency / Business Logic Integrity | Ten parallel requests redeem a single-use coupon more than once |
| Outdated package | Vulnerable third-party dependency (prototype pollution) | Supply Chain / Object Injection | A crafted JSON body flips an admin check, flagged by the package audit |

Every module has the same four parts:

1. **Mode switch.** Vulnerable or Hardened, chosen per request, so both can run side by side.
2. **Attack runner.** One click runs a safe, capped exploit against your own local server.
3. **Live metrics.** Latency, event-loop delay, number of successful redemptions, and so on.
4. **Proof.** A CVSS v3.1 score before and after, plus a regression test that fails in Vulnerable mode and passes in Hardened mode.

Across the whole app:

- **CVSS ledger.** Every finding scored before and after the fix with complete vector breakdowns.
- **CI pipeline.** Static analysis (Semgrep), dependency audit, dual-mode regression tests and an OWASP ZAP baseline scan.
- **Evidence export.** One button produces the tables, execution metrics and JSON artifacts for security audits.

---

## Tech stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Lab server:** Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Shared package:** TypeScript types and the CVSS v3.1 calculator
- **Testing:** Vitest, Supertest, Playwright (smoke test only)
- **Tooling:** npm workspaces, Docker Compose, GitHub Actions, Semgrep, OWASP ZAP

---

## Repository layout

```
proofline/
├── apps/
│   ├── web/              Next.js dashboard
│   └── lab/              Express lab server (vulnerable and hardened code paths)
├── packages/
│   └── core/             Shared types, CVSS calculator, findings catalog
├── docs/
│   ├── TRD.md
│   ├── Architecture.md
│   ├── DesignBrief.md
│   └── evidence/         Exported run data and audit artifacts
├── scripts/
│   └── proof.mjs         Proof matrix runner
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

---

## Getting started

Requirements: Node.js 20 or newer, npm 9 or newer, Docker (optional, needed for the ZAP scan).

```bash
npm install
npm run dev            # starts web on :3000 and lab on 127.0.0.1:4000
```

Copy `.env.example` to `.env` before running:

```bash
cp .env.example .env
```

Open http://localhost:3000.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the dashboard and lab server together |
| `npm test` | Runs unit tests |
| `npm run test:hardened` | Regression tests in Hardened mode. They must pass |
| `npm run test:proof` | Same tests in Vulnerable mode. They must fail, which proves the flaws are real |
| `npm run audit:deps` | Runs the package audit and stores the result |
| `npm run lint` and `npm run typecheck` | Static checks |
| `docker compose up` | Runs the full stack in containers, used by the ZAP scan |

---

## Responsible use

- The lab server binds to `127.0.0.1` only and refuses requests from other hosts.
- Attack runners have built-in ceilings (input length, request count, run time) that stay on in both modes.
- Do not point any Proofline attack script at a system you do not own.
- The vulnerable code is intentional. Never deploy it to a public server.

---

## Git workflow

Work in small steps and commit after every feature or stage passes its checks.

- Branch: work on `main`, or short feature branches merged into `main`.
- Commit style: [Conventional Commits](https://www.conventionalcommits.org/), imperative, 72 characters or fewer, no trailing period.
- Format: `type(scope): short summary`
- Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`, `style`
- Scopes: `web`, `lab`, `core`, `redos`, `race`, `dep`, `cvss`, `ci`, `docs`

Examples:

```
feat(redos): add vulnerable validator endpoint
feat(race): add atomic redeem for hardened mode
test(dep): add prototype pollution regression
ci: add semgrep and audit jobs
docs: add architecture decision records
```

The staged build plan, with a commit checkpoint per stage, is in `docs/TRD.md`.

---

## Architecture and documentation index

| Section | Source Material |
| --- | --- |
| Overview and Threat Model | This README and `docs/Architecture.md` (motivation and scope) |
| Problem Definition | The three modules and their CVSS findings in `packages/core` |
| Objectives and Scope | `docs/TRD.md`, sections 1 to 3 |
| Standards and References | OWASP Top 10, OWASP ASVS, CVE and CVSS v3.1 references |
| Methodology and System Design | `docs/Architecture.md` diagrams and the CI pipeline |
| Proof of Concept | Each module page, plus the code in `apps/lab/src/modules/` |
| Results and Output | The Evidence page and `docs/evidence/` exports |
| Challenges and Limitations | Notes kept in `docs/Architecture.md`, section "Known limitations" |
| Conclusion and Future Work | `docs/TRD.md`, section "Future work" |

---

## Documentation

- [Technical requirements (TRD)](docs/TRD.md)
- [Architecture and technical decisions](docs/Architecture.md)
- [Design brief for the dashboard](docs/DesignBrief.md)

## License

MIT License. See LICENSE for details.
