# Spec 2: Performance Hardening & Measurement Plan

**Version:** 1.0  
**Date:** 2026-02-17  
**Status:** Proposed

---

## Objective

Establish a measurable performance baseline for the WFM application, then iteratively optimize user-perceived and backend performance based on telemetry.

This spec converts existing high-level goals into an execution plan with owners, milestones, acceptance criteria, and release gates.

---

## Scope

### In Scope

1. Frontend performance measurement and optimization:
   - Initial page load
   - Time to interactive
   - Bundle size
   - Core user interactions (filtering, navigation, table operations)
2. API/query performance measurement and optimization:
   - Supabase query latency by feature
   - Slow query identification
   - Index/query shape improvements
3. Monitoring and alerting:
   - Sentry performance tracing in production
   - Alert thresholds for regressions
4. Performance release gates:
   - CI checks and PR-level budget validation

### Out of Scope

- Full infrastructure redesign or multi-region rollout
- Replacing Supabase or React Query
- Non-user-facing micro-optimizations without measurable impact

---

## Current Baseline (Known)

From current project docs, performance targets exist but key production metrics are not yet measured systematically.

- Target metrics are defined (e.g., page load, TTI, API response time, Lighthouse).  
- Current values are largely TBD and not tracked consistently over time.

---

## Success Metrics (Definition of Done)

### Required Product Metrics

1. **Initial page load (P75):** < 2.0s
2. **Time to interactive (P75):** < 3.0s
3. **API response time (P75):** < 500ms for core list/detail queries
4. **Lighthouse performance score:** >= 90 on Dashboard and Request Management
5. **JS bundle budget (main route):** <= 500KB gzipped equivalent

### Required Operational Metrics

1. Sentry performance instrumentation enabled in production.
2. Alerts configured for latency regression and elevated frontend transaction duration.
3. Weekly performance trend report generated and reviewed.

---

## Workstreams

## WS1 - Instrumentation & Baseline

### Tasks

1. Enable production-grade Sentry tracing configuration validation.
2. Define canonical transaction names per route:
   - `/dashboard`
   - `/requests`
   - `/schedule`
   - `/reports`
3. Add lightweight in-app timing markers for key interactions:
   - Filter apply
   - Page navigation
   - Form submission
4. Capture API duration by service function and endpoint/query category.

### Deliverables

- Performance dashboard with route and interaction-level timing.
- Initial baseline document with P50/P75/P95 stats.

### Acceptance Criteria

- At least 7 days of production-like telemetry captured.
- No major route is missing instrumentation.

---

## WS2 - Frontend Optimization

### Tasks

1. Route-level code split review and optimization.
2. Bundle analysis and dependency trimming for largest chunks.
3. Audit expensive re-renders on data-heavy pages.
4. Validate and tune React Query staleTime/gcTime by data volatility.
5. Validate list virtualization/pagination behavior for large datasets.

### Deliverables

- Before/after performance comparison for top 3 slow routes.
- PRs with measurable wins and no regression in user behavior.

### Acceptance Criteria

- P75 initial load reduced by >= 20% on the slowest route.
- No critical route exceeds 2.5s P75 after optimization.

---

## WS3 - API & Database Query Optimization

### Tasks

1. Identify top 10 slowest queries from logs and app timings.
2. Validate index coverage for high-frequency filters/sorts.
3. Eliminate N+1 query patterns in service layer.
4. Reduce payload size (field-level select discipline).
5. Add query-level caching strategy validation for hot paths.

### Deliverables

- Query optimization report (before/after latency).
- Migration(s) for index or query support where needed.

### Acceptance Criteria

- P75 API duration for core paths < 500ms.
- P95 latency trend stable across two consecutive weekly windows.

---

## WS4 - Performance Gates in CI/CD

### Tasks

1. Add scripted Lighthouse checks for critical routes in CI preview.
2. Add bundle budget checks to fail builds on regressions.
3. Add PR template section for performance impact.
4. Add release checklist items for performance sign-off.

### Deliverables

- Automated check output attached to PR.
- Documented fail/pass thresholds.

### Acceptance Criteria

- Any perf regression beyond threshold blocks merge.
- Release checklist requires explicit perf sign-off.

---

## Timeline (2 Sprint Plan)

### Sprint 1

- WS1 complete (instrumentation + baseline)
- WS2 partial (top 1-2 route optimizations)
- WS4 partial (bundle budget check)

### Sprint 2

- WS2 complete
- WS3 complete
- WS4 complete (Lighthouse + gating + checklist)

---

## Risks & Mitigations

1. **Risk:** Noisy telemetry due to low sample size.  
   **Mitigation:** Use rolling 7-day windows and P75/P95, not raw averages.

2. **Risk:** Optimizations increase complexity with small gains.  
   **Mitigation:** Only merge changes with measurable improvements.

3. **Risk:** CI perf checks are flaky.  
   **Mitigation:** Use stable environment settings and threshold buffers.

---

## Ownership

- **Engineering Lead:** Overall execution and release sign-off
- **Frontend Owner:** WS2 and route metrics quality
- **Backend/Data Owner:** WS3 query optimization
- **QA/Release Owner:** WS4 gating and evidence collection

---

## Exit Criteria

This spec is complete when:

1. All success metrics are met for two consecutive weekly reporting windows.
2. CI/PR performance gates are active and enforced.
3. Performance section in readiness docs is updated from TBD to measured values.
