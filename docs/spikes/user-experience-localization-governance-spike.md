---
title: "Localization Governance and Copy Source Spike"
category: "User Experience"
status: "🔴 Not Started"
priority: "High"
timebox: "4 days"
created: 2026-04-04
updated: 2026-04-04
owner: "UX Audit Team"
tags: ["technical-spike", "user-experience", "localization", "copy-system"]
---

# Localization Governance and Copy Source Spike

## Summary

**Spike Objective:** Define a single-source localization architecture and governance workflow that prevents mixed-language UI states.

**Why This Matters:** Mixed Mongolian/English UI copy reduces trust and increases comprehension errors in financial decision contexts.

**Timebox:** 4 days

**Decision Deadline:** 2026-04-11

## Research Question(s)

**Primary Question:** What localization architecture and ownership model should enforce consistent Mongolian-first UX while supporting English fallback?

**Secondary Questions:**

- Should all user-facing text be moved to copy.ts or an i18n namespace structure?
- How to lint or test hard-coded strings in screen files?
- What review gate should block copy drift from being merged?

## Investigation Plan

### Research Tasks

- [ ] Inventory all user-facing strings by screen and classify by source.
- [ ] Prototype i18n key namespace for auth, signal, news, profile, errors.
- [ ] Evaluate lightweight localization tooling and lint strategy.
- [ ] Draft copy governance policy (ownership, review, change log).
- [ ] Document migration plan with phased rollout.

### Success Criteria

**This spike is complete when:**

- [ ] One source-of-truth approach is selected.
- [ ] String ownership and review process are documented.
- [ ] Automated detection strategy for hard-coded strings is defined.
- [ ] Migration backlog for existing screens is prioritized.

## Technical Context

**Related Components:**

- mobile_app/src/config/copy.ts
- mobile_app/src/screens/SignUpScreen.tsx
- mobile_app/src/screens/ProfileScreen.tsx
- mobile_app/src/screens/EmailVerificationScreen.tsx
- docs/MOBILE_COPY_GUIDE.md

**Dependencies:**

- IA decision for signal entry points (copy affects navigation cues)
- Legal/policy source-of-truth decision

**Constraints:**

- Must keep current release stable
- Must avoid introducing untranslated placeholders in production

## Research Findings

### Investigation Results

Pending.

### Prototype/Testing Notes

Pending.

### External Resources

- ICU message format best practices
- React Native i18n implementation patterns
- Internal style guide and legal copy requirements

## Decision

### Recommendation

Pending.

### Rationale

Pending.

### Implementation Notes

Pending.

### Follow-up Actions

- [ ] Create localization key map and migration spreadsheet.
- [ ] Add copy lint or CI check.
- [ ] Update contributor guide for copy changes.
- [ ] Train reviewers on language consistency checklist.

## Status History

| Date       | Status         | Notes                                |
| ---------- | -------------- | ------------------------------------ |
| 2026-04-04 | 🔴 Not Started | Spike created and scoped from UX audit |

---

_Last updated: 2026-04-04 by UX Audit Team_
