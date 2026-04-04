---
title: "Platform DevOps Reliability Baseline Spike"
category: "Platform & Infrastructure"
status: "🔴 Not Started"
priority: "High"
timebox: "5 business days"
created: 2026-04-04
updated: 2026-04-04
owner: "DevOps"
tags: ["technical-spike", "platform", "reliability", "ci-cd", "observability"]
---

# Platform DevOps Reliability Baseline Spike

## Summary

**Spike Objective:** Decide and validate a production-ready baseline for CI/CD safety, observability, and rollback across Fly runtime + Azure release workflow.

**Why This Matters:** Current deployment and runtime controls are functional but rely on manual safeguards and minimal health checks, increasing release and incident risk.

**Timebox:** 5 business days

**Decision Deadline:** 2026-04-11

## Research Question(s)

**Primary Question:** What minimum platform baseline (quality gates, secrets policy, observability, rollback) should be enforced to keep deployment risk low for the next quarter?

**Secondary Questions:**

- Should Fly remain sole runtime authority or should Azure become active runtime with parity controls?
- Which health checks must become readiness-critical beyond a basic /health endpoint?
- What branch protection and required checks are mandatory before production deploy?
- Which dependency/version controls are required for reproducible builds?

## Investigation Plan

### Research Tasks

- [ ] Map current release paths: PR -> main, workflow_dispatch Azure, manual Fly script
- [ ] Validate hard fail scenarios: DB unavailable, Redis unavailable, background worker degraded
- [ ] Define required status checks + branch protection policy
- [ ] Evaluate rollback strategy for Fly and Azure (operationally tested)
- [ ] Propose baseline observability stack (logs, metrics, alerting, runbook)
- [ ] Produce implementation backlog with P0/P1/P2 priorities

### Success Criteria

**This spike is complete when:**

- [ ] Deployment authority model is documented and approved
- [ ] Health/readiness contract is defined and tested
- [ ] Branch protection + required checks list is approved
- [ ] Rollback runbook is documented and tested
- [ ] Observability baseline (signals, thresholds, alert channels) is approved

## Technical Context

**Related Components:**

- .github/workflows/azure-deploy.yml
- backend/deploy_fly.ps1
- backend/fly.toml
- backend/app.py
- backend/config/settings.py
- backend/requirements.txt
- mobile_app/package.json

**Dependencies:**

- Secret manager policy (Fly/Azure)
- GitHub branch protection settings
- Monitoring destination (APM/log platform)

**Constraints:**

- Single-region runtime and single-machine Fly profile currently in use
- Background workers and API process share one runtime role by default
- Existing pipeline must remain usable during migration to stronger controls

## Research Findings

### Investigation Results

Pending

### Prototype/Testing Notes

Pending

### External Resources

- https://docs.github.com/en/actions
- https://fly.io/docs/
- https://learn.microsoft.com/en-us/azure/app-service/

## Decision

### Recommendation

Pending

### Rationale

Pending

### Implementation Notes

Pending

### Follow-up Actions

- [ ] Create branch protection checklist
- [ ] Add readiness + smoke test expansion tasks
- [ ] Add rollback drill task
- [ ] Add observability implementation tasks

## Status History

| Date       | Status         | Notes                                |
| ---------- | -------------- | ------------------------------------ |
| 2026-04-04 | 🔴 Not Started | Spike created from DevOps/SRE audit |

---

_Last updated: 2026-04-04 by GitHub Copilot_
