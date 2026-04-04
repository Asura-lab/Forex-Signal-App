---
title: "Mobile Accessibility Baseline Spike"
category: "User Experience"
status: "🔴 Not Started"
priority: "High"
timebox: "5 days"
created: 2026-04-04
updated: 2026-04-04
owner: "UX Audit Team"
tags: ["technical-spike", "user-experience", "accessibility", "mobile"]
---

# Mobile Accessibility Baseline Spike

## Summary

**Spike Objective:** Establish a measurable accessibility baseline for touch targets, labeling, dynamic type, and screen-reader support.

**Why This Matters:** Current accessibility coverage is partial and inconsistent across critical user journeys.

**Timebox:** 5 days

**Decision Deadline:** 2026-04-12

## Research Question(s)

**Primary Question:** What minimum accessibility standard (WCAG-aligned mobile baseline) can be reliably enforced in this codebase right now?

**Secondary Questions:**

- Which controls fail minimum 44x44 touch area and how to fix without visual regressions?
- Which screens lack accessibility labels/hints for actionable controls?
- What dynamic type constraints are safe for trading data-dense layouts?

## Investigation Plan

### Research Tasks

- [ ] Audit all actionable controls for touch target size.
- [ ] Audit all touchables and inputs for accessibility labels/hints.
- [ ] Run TalkBack/VoiceOver smoke tests on critical journeys.
- [ ] Test large-font scaling scenarios across auth, signal, news, profile.
- [ ] Define accessibility QA checklist and CI verification strategy.

### Success Criteria

**This spike is complete when:**

- [ ] Priority A11y defects are ranked by severity and effort.
- [ ] Minimum baseline checklist is approved.
- [ ] Fix templates/patterns are documented for reuse.
- [ ] Regression checklist is integrated into release QA.

## Technical Context

**Related Components:**

- mobile_app/src/screens/HomeScreen.tsx
- mobile_app/src/screens/SignalScreen.tsx
- mobile_app/src/screens/NewsScreen.tsx
- mobile_app/src/screens/SignUpScreen.tsx
- mobile_app/src/screens/NotificationsScreen.tsx

**Dependencies:**

- Copy system governance for consistent labels
- Component library standards for shared touchable/input patterns

**Constraints:**

- Dense financial data views must preserve readability
- Changes must be compatible with iOS and Android behavior

## Research Findings

### Investigation Results

Pending.

### Prototype/Testing Notes

Pending.

### External Resources

- WCAG 2.2 AA mobile-relevant criteria
- Apple Human Interface Guidelines (Accessibility)
- Material accessibility guidance for Android

## Decision

### Recommendation

Pending.

### Rationale

Pending.

### Implementation Notes

Pending.

### Follow-up Actions

- [ ] Land P0 touch target fixes.
- [ ] Land P0 labeling fixes.
- [ ] Add dynamic type acceptance criteria per screen category.
- [ ] Add accessibility section in PR template.

## Status History

| Date       | Status         | Notes                                |
| ---------- | -------------- | ------------------------------------ |
| 2026-04-04 | 🔴 Not Started | Spike created and scoped from UX audit |

---

_Last updated: 2026-04-04 by UX Audit Team_
