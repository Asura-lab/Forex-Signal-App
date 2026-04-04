---
title: "Signal Entry Point Mental Model Spike"
category: "User Experience"
status: "🔴 Not Started"
priority: "High"
timebox: "3 days"
created: 2026-04-04
updated: 2026-04-04
owner: "UX Audit Team"
tags: ["technical-spike", "user-experience", "navigation", "information-architecture"]
---

# Signal Entry Point Mental Model Spike

## Summary

**Spike Objective:** Resolve whether all signal entry points should route to one canonical destination and interaction pattern.

**Why This Matters:** Current split destination behavior can create inconsistent back navigation and user orientation.

**Timebox:** 3 days

**Decision Deadline:** 2026-04-10

## Research Question(s)

**Primary Question:** Should the app keep a dedicated stack-level Signal route, or consolidate to Main -> SignalTab only?

**Secondary Questions:**

- Which option yields lower navigation confusion for first-time users?
- How should Home pair tap and notification tap behave after consolidation?
- What migration path avoids breaking deep links and notification routing?

## Investigation Plan

### Research Tasks

- [ ] Map current user paths into Signal from Home, Tabs, Notifications.
- [ ] Prototype two IA variants: consolidated tab-only vs dual-route with explicit context shell.
- [ ] Run quick hallway usability tests (5-7 users) on back-navigation predictability.
- [ ] Measure completion time and error rate for "find current EUR/USD signal" task.
- [ ] Document findings and recommendation.

### Success Criteria

**This spike is complete when:**

- [ ] Canonical signal destination decision is made.
- [ ] Entry/exit behavior is defined for all signal entry points.
- [ ] Recommendation includes migration steps and risk controls.
- [ ] QA acceptance checklist for navigation regressions is prepared.

## Technical Context

**Related Components:**

- mobile_app/App.tsx
- mobile_app/src/navigation/MainTabs.tsx
- mobile_app/src/screens/HomeScreen.tsx
- mobile_app/src/screens/NotificationsScreen.tsx
- docs/MOBILE_COPY_GUIDE.md

**Dependencies:**

- Localization governance decision (copy on navigation prompts)
- Push notification payload contract stability

**Constraints:**

- EUR/USD-only model scope must remain unchanged
- Existing notification routing should not regress

## Research Findings

### Investigation Results

Pending.

### Prototype/Testing Notes

Pending.

### External Resources

- React Navigation guidance on nested navigators
- NN/g guidance on navigation consistency
- Material and iOS HIG back behavior conventions

## Decision

### Recommendation

Pending.

### Rationale

Pending.

### Implementation Notes

Pending.

### Follow-up Actions

- [ ] Update IA docs and route map.
- [ ] Implement selected routing pattern.
- [ ] Add navigation regression tests.
- [ ] Update mobile copy guide examples.

## Status History

| Date       | Status         | Notes                                |
| ---------- | -------------- | ------------------------------------ |
| 2026-04-04 | 🔴 Not Started | Spike created and scoped from UX audit |

---

_Last updated: 2026-04-04 by UX Audit Team_
