# Sprint 3 — Static Analysis

Static analysis of FoodtruckApp for Sprint 3, run on October 20, 2026 against
commit `5570aa3`.

> This static analysis was generated using automated tools during this sprint.

## The report

**[Static-Analysis-Report-Sprint-3.pdf](Static-Analysis-Report-Sprint-3.pdf)** — one
document covering everything:

| Section | What it covers |
|---|---|
| 1–5 | Tools used, required metrics, scope, trend, reflection |
| Appendix A | Full Trivy results — every finding, its dependency path, remediation plan |
| Appendix B | Full Sonar results — all 47 issues, hotspot reviews, quality gate |

## Headline numbers

| Trivy | Count |  | Sonar | Count |
|---|---|---|---|---|
| CRITICAL | 0 |  | Bugs | 0 |
| HIGH | 8 |  | Vulnerabilities | 0 |
| MEDIUM | 6 |  | Code Smells | 45 |
| LOW | 0 |  | Security Hotspots | 2 (both reviewed) |
| Secrets | 0 |  | Quality Gate | PASS (evaluated locally) |

All 14 Trivy findings are in transitive dependencies; none is in code written by
this team. The two Sonar hotspots are slow-regex warnings, both reviewed and
found not to be reachable — the reasoning is in Appendix B.

## A note on the Sonar tooling

These are SonarSource's own JS/TS rules — SonarJS 3.0.7, the analyser SonarQube
uses for this language — run locally through ESLint rather than through a hosted
SonarQube Server dashboard. The rule identifiers (RSPEC numbers) and issue
classifications are the genuine Sonar ones; the quality gate is evaluated
against SonarSource's published "Sonar way" conditions.

## Reproducing the scans

```bash
# Trivy — filesystem scan, dependencies + secrets + misconfiguration
trivy fs --scanners vuln,secret,misconfig \
  --skip-dirs node_modules --skip-dirs .next --skip-dirs .git \
  --skip-dirs lib/generated --skip-files .env.local \
  --format json -o trivy.json .

# Sonar — SonarSource's JS/TS rules via ESLint
npm install --no-save eslint-plugin-sonarjs@^3
npx eslint --config eslint.sonar.config.mjs --no-config-lookup -f json -o sonarjs.json .
# (run from the repo root, where eslint.sonar.config.mjs lives)

# Supporting measures
npx vitest run --coverage
npx jscpd . --min-lines 10 --min-tokens 70 --reporters json
```

`eslint.sonar.config.mjs` at the repository root is the config used for the
Sonar run. It is kept separate from the project's own `eslint.config.mjs` so
that `npm run lint` is unaffected.

## Raw tool output

`raw/` holds the unedited JSON each tool produced, as evidence behind the
numbers in the PDFs. Absolute paths were rewritten to repo-relative ones; no
other edits were made.

| File | Tool |
|---|---|
| `raw/trivy-fs-scan.json` | Trivy 0.76.0 |
| `raw/sonarjs-eslint.json` | SonarJS 3.0.7 via ESLint 9.39.5 |
| `raw/coverage-summary.json` | Vitest 4 (v8 coverage) |
| `raw/jscpd-duplication.json` | jscpd 4 |
