# Technical Debt Inventory

This document tracks known technical debt items in the WFM application, categorized by priority and impact.

## High Priority Items

### 1. PWA Icons Missing
**Category**: User Experience  
**Impact**: High  
**Effort**: Low (1-2 hours)  
**Status**: Open

**Description**:
The application is missing required PWA icons for Android devices:
- android-chrome-192x192.png (required for Android)
- android-chrome-512x512.png (required for splash screens)

**Current State**:
- ✅ favicon-16x16.png
- ✅ favicon-32x32.png
- ✅ apple-touch-icon.png (180x180)
- ✅ favicon.ico
- ❌ android-chrome-192x192.png
- ❌ android-chrome-512x512.png

**Impact**:
- PWA installation may not work properly on Android devices
- Missing splash screen on app launch
- Reduced user experience for mobile users

**Remediation**:
1. Generate icons using realfavicongenerator.net or ImageMagick
2. Update site.webmanifest to include new icons
3. Test PWA installation on Android devices
4. Verify icons display correctly in Chrome DevTools

**References**:
- See `public/icons/PWA_ICONS_TODO.md` for detailed instructions
- Related issue: None yet

---

### 2. Data Fetching Pagination
**Category**: Performance  
**Impact**: High  
**Effort**: High (2-3 days)  
**Status**: Open

**Description**:
Current implementation loads all data at once without pagination, which can cause performance issues with large datasets.

**Affected Areas**:
- Swap requests list
- Leave requests list
- Employee directory
- Shift schedule views

**Impact**:
- Slow page load times with >100 records
- High memory usage in browser
- Poor user experience on slower connections
- Increased database load

**Remediation**:
1. Implement cursor-based pagination in services
2. Create usePaginatedQuery hook
3. Add pagination controls to UI components
4. Configure appropriate page sizes (20-50 items)
5. Implement infinite scroll or "Load More" buttons

**Success Criteria**:
- Initial page load <2s
- Interactions <500ms
- Support for 1000+ records without performance degradation

---

### 3. Test Coverage Gaps
**Category**: Quality  
**Impact**: Medium  
**Effort**: High (3-5 days)  
**Status**: In Progress

**Description**:
While critical paths have good test coverage, many components and utilities lack comprehensive tests.

**Current Coverage**:
- Edge cases: ✅ 72 tests
- Business logic: ✅ 19 tests
- Backend/RLS: ✅ 43 tests
- Integration: ✅ 33 tests
- **Total: 167 tests**

**Missing Coverage**:
- Page components (Dashboard, Settings, Reports)
- Service layer CRUD operations
- Utility functions (partial coverage)
- Error boundaries
- Toast notifications (partial coverage)

**Target Coverage**:
- Overall: >70% line coverage
- Critical paths: >90% coverage
- Total tests: >200

**Remediation**:
See Task 9 in production-readiness tasks.md for detailed breakdown.

---

## Medium Priority Items

### 4. Property-Based Testing
**Category**: Quality  
**Impact**: Medium  
**Effort**: Medium (2-3 days)  
**Status**: Open

**Description**:
Current tests use example-based testing. Property-based testing (PBT) would improve coverage of edge cases and invariants.

**Recommended Library**: fast-check

**Use Cases**:
- Validator functions (email, dates, balances)
- Business logic invariants (balance never negative)
- Date calculations (shift swaps, leave duration)
- CSV parsing and formatting

**Benefits**:
- Discover edge cases automatically
- Test invariants across wide input ranges
- Reduce test maintenance burden
- Improve confidence in critical logic

**Remediation**:
1. Install fast-check: `npm install --save-dev fast-check`
2. Write PBT tests for validators
3. Add PBT for business logic invariants
4. Document PBT patterns for team
5. Add to CI pipeline

**Estimated Effort**: 2-3 days

---

### 5. Error Tracking Configuration
**Category**: Operations  
**Impact**: Medium  
**Effort**: Low (2-4 hours)  
**Status**: Partially Complete

**Description**:
Sentry is integrated but not fully configured for production.

**Completed**:
- ✅ Sentry SDK installed
- ✅ Error handler integration
- ✅ Security logger integration
- ✅ PII removal configured

**Missing**:
- ❌ Production DSN configuration
- ❌ Source map upload
- ❌ Alert rules configuration
- ❌ Slack/email notifications
- ❌ Performance monitoring

**Remediation**:
1. Create Sentry account (free tier)
2. Add VITE_SENTRY_DSN to Vercel environment
3. Configure source map upload in build
4. Set up alert rules for critical errors
5. Configure team notifications
6. Enable performance monitoring

**References**:
- Tasks 2.5 and 2.6 in production-readiness tasks.md

---

### 6. CI/CD Branch Protection
**Category**: Process  
**Impact**: Medium  
**Effort**: Low (1 hour)  
**Status**: Open

**Description**:
GitHub branch protection rules are not configured.

**Missing Protections**:
- Require CI checks to pass before merge
- Require code review approval
- Prevent force pushes to main
- Require linear history

**Remediation**:
1. Go to GitHub repo Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass"
4. Enable "Require pull request reviews"
5. Enable "Require linear history"
6. Document process in CONTRIBUTING.md

---

## Low Priority Items

### 7. Bundle Size Optimization
**Category**: Performance  
**Impact**: Low  
**Effort**: Medium (1-2 days)  
**Status**: Open

**Description**:
Current bundle size is acceptable but could be optimized.

**Opportunities**:
- Code splitting by route
- Lazy loading of heavy components
- Tree shaking optimization
- Remove unused dependencies
- Optimize icon imports

**Current State**:
- No route-based code splitting
- All components loaded eagerly
- Some unused dependencies may exist

**Remediation**:
1. Analyze bundle with `npm run build -- --analyze`
2. Implement route-based code splitting
3. Lazy load heavy components (charts, editors)
4. Audit and remove unused dependencies
5. Optimize icon imports (use specific imports)

**Target**:
- Initial bundle <200KB gzipped
- Route chunks <50KB each

---

### 8. Accessibility Enhancements
**Category**: Accessibility  
**Impact**: Low  
**Effort**: Medium (2-3 days)  
**Status**: Open

**Description**:
Basic accessibility is implemented but could be enhanced.

**Current State**:
- Semantic HTML used
- ARIA labels on interactive elements
- Keyboard navigation works
- Color contrast meets WCAG AA

**Enhancements**:
- Screen reader testing with NVDA
- Focus management improvements
- Skip navigation links
- ARIA live regions for dynamic content
- High contrast mode support

**Remediation**:
See Task 10 in production-readiness tasks.md for detailed audit plan.

---

### 9. Documentation Gaps
**Category**: Documentation  
**Impact**: Low  
**Effort**: Medium (2-3 days)  
**Status**: In Progress

**Missing Documentation**:
- API documentation
- Component library documentation
- Deployment guide
- Troubleshooting guide
- Architecture decision records (ADRs)

**Remediation**:
1. Document API endpoints and schemas
2. Create component documentation with Storybook
3. Write deployment guide for Vercel
4. Create troubleshooting guide
5. Start ADR practice for major decisions

---

## Deferred Items

### 10. E2E Testing
**Category**: Quality  
**Impact**: Low  
**Effort**: High (5+ days)  
**Status**: Deferred

**Description**:
No end-to-end tests currently exist. Integration tests provide good coverage for now.

**Rationale for Deferral**:
- Integration tests cover critical paths
- E2E tests are expensive to maintain
- Current test suite provides adequate confidence
- Can be added later as application matures

**Future Consideration**:
- Implement with Playwright when team grows
- Focus on critical user journeys
- Run in CI on main branch only

---

### 11. Visual Regression Testing
**Category**: Quality  
**Impact**: Low  
**Effort**: Medium (2-3 days)  
**Status**: Deferred

**Description**:
No visual regression testing in place.

**Rationale for Deferral**:
- Manual testing catches most visual issues
- Component library is stable
- Cost/benefit not favorable yet
- Can be added later if needed

---

## Summary Statistics

**Total Items**: 11

**By Priority**:
- High: 3 items
- Medium: 4 items
- Low: 2 items
- Deferred: 2 items

**By Status**:
- Open: 8 items
- In Progress: 2 items
- Deferred: 2 items

**Total Estimated Effort**: 15-25 days

---

## Tracking Process

1. **Review Frequency**: Monthly
2. **Owner**: Tech Lead
3. **Updates**: Add new items as discovered, update status regularly
4. **Prioritization**: Re-evaluate priorities quarterly
5. **GitHub Issues**: Create issues for high/medium priority items

---

## Related Documents

- `production-readiness/tasks.md` - Implementation tasks
- `production-readiness/requirements.md` - Requirements context
- `public/icons/PWA_ICONS_TODO.md` - PWA icons instructions
- `src/test/README.md` - Testing documentation

---

*Last Updated: February 10, 2026*
