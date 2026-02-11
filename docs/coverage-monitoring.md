# Test Coverage Monitoring

## Overview

This document describes how to monitor test coverage for the WFM application, including tracking coverage over time, setting goals, and alerting on coverage drops.

## Coverage Goals

### Overall Coverage

**Target**: ≥70% line coverage

**Current**: 34.71% (as of January 2025)

**Gap**: 35.29 percentage points

### Critical Path Coverage

**Target**: ≥90% line coverage

**Critical Paths**:
- Authentication flow
- Swap request creation and approval
- Leave request creation and approval
- Leave balance deduction
- Shift swap execution

### New Code Coverage

**Target**: ≥80% for all new code

**Enforcement**: Via CI/CD checks

## Coverage Metrics

### Line Coverage

**Definition**: Percentage of code lines executed by tests

**Calculation**: (Executed lines / Total lines) × 100

**Why it matters**: Indicates how much code is tested

### Function Coverage

**Definition**: Percentage of functions called by tests

**Calculation**: (Called functions / Total functions) × 100

**Why it matters**: Ensures all functions are tested

### Branch Coverage

**Definition**: Percentage of code branches executed by tests

**Calculation**: (Executed branches / Total branches) × 100

**Why it matters**: Ensures all code paths are tested

### Statement Coverage

**Definition**: Percentage of statements executed by tests

**Calculation**: (Executed statements / Total statements) × 100

**Why it matters**: Similar to line coverage but more granular

## Tracking Coverage

### Local Coverage Reports

**Generate Report**:
```bash
npm run test:coverage
```

**View Report**:
```bash
# Open HTML report
open coverage/index.html

# Or view in terminal
cat coverage/coverage-summary.json
```

**Report Contents**:
- Overall coverage percentages
- Coverage by file
- Uncovered lines highlighted
- Branch coverage details

### CI/CD Coverage Reports

**GitHub Actions Integration**:

```yaml
# .github/workflows/ci.yml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    flags: unittests
    name: codecov-umbrella
```

**Coverage Artifacts**:
- Stored in GitHub Actions
- Available for download
- Retained for 90 days

### Coverage Tracking Tools

**Option 1: Codecov (Recommended)**

**Pros**:
- Free for open source
- GitHub integration
- Coverage trends
- PR comments
- Coverage diff

**Setup**:
1. Sign up at [codecov.io](https://codecov.io/)
2. Connect GitHub repository
3. Add to CI/CD workflow
4. Configure codecov.yml

**Cons**:
- External dependency
- Requires account

**Option 2: Coveralls**

**Pros**:
- Free for open source
- GitHub integration
- Coverage trends
- PR comments

**Setup**:
1. Sign up at [coveralls.io](https://coveralls.io/)
2. Connect GitHub repository
3. Add to CI/CD workflow

**Cons**:
- External dependency
- Requires account

**Option 3: Built-in GitHub Actions**

**Pros**:
- No external dependency
- Free
- Full control

**Setup**:
1. Generate coverage report
2. Upload as artifact
3. Comment on PR with coverage

**Cons**:
- Manual setup
- No historical trends
- Limited visualization

## Coverage Dashboard

### Key Metrics to Display

1. **Overall Coverage** (gauge)
   - Current: 34.71%
   - Target: 70%
   - Trend: ↑ or ↓

2. **Coverage by Category** (bar chart)
   - Services: X%
   - Components: Y%
   - Utils: Z%
   - Hooks: W%

3. **Coverage Trend** (line chart)
   - Last 30 days
   - Show target line
   - Highlight milestones

4. **Uncovered Files** (table)
   - File name
   - Current coverage
   - Lines to cover
   - Priority

5. **Recent Changes** (table)
   - PR number
   - Coverage change
   - Files affected
   - Author

### Example Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Test Coverage Dashboard                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Overall  │  │ Services │  │Components│  │  Utils   ││
│  │  34.71%  │  │  45.2%   │  │  28.3%   │  │  67.8%   ││
│  │ ━━━━━━━  │  │ ━━━━━━━  │  │ ━━━━━━━  │  │ ━━━━━━━  ││
│  │ Target:  │  │ Target:  │  │ Target:  │  │ Target:  ││
│  │   70%    │  │   70%    │  │   70%    │  │   70%    ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                           │
│  Coverage Trend (Last 30 Days)                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                       ││
│  │  70% ┤ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (Target)  ││
│  │      │                                               ││
│  │  50% ┤                                               ││
│  │      │                                               ││
│  │  30% ┤     ╭─╮                                       ││
│  │      │   ╭─╯ ╰─╮                                     ││
│  │  10% ┼───╯     ╰─────────────────────────────────   ││
│  │      │                                               ││
│  │      └───────────────────────────────────────────   ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  Top Uncovered Files                                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │ File                    │ Coverage │ Priority       ││
│  ├─────────────────────────┼──────────┼────────────────┤│
│  │ authService.ts          │   3.33%  │ High           ││
│  │ headcountService.ts     │   1.88%  │ High           ││
│  │ leaveBalancesService.ts │   2.70%  │ High           ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Alerting

### Alert Conditions

**Critical Alerts** (Immediate notification):
- Coverage drops below 30%
- Coverage drops by >10% in single PR
- Critical path coverage drops below 80%

**Warning Alerts** (Daily digest):
- Coverage drops below 70%
- Coverage drops by >5% in single PR
- New file added with <50% coverage

### Alert Channels

**Slack Integration**:
```yaml
# .github/workflows/ci.yml
- name: Check coverage
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 70" | bc -l) )); then
      echo "Coverage below target: $COVERAGE%"
      # Send Slack notification
    fi
```

**PR Comments**:
```yaml
# .github/workflows/ci.yml
- name: Comment coverage on PR
  uses: codecov/codecov-action@v3
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: true
```

**GitHub Status Checks**:
```yaml
# .github/workflows/ci.yml
- name: Coverage check
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 70" | bc -l) )); then
      echo "::error::Coverage below 70%: $COVERAGE%"
      exit 1
    fi
```

## Coverage Improvement Process

### 1. Identify Gaps

**Weekly Review**:
- Generate coverage report
- Identify files with <70% coverage
- Prioritize by importance
- Create tasks

**Tools**:
```bash
# Find files with low coverage
npm run test:coverage
cat coverage/coverage-summary.json | jq '.[] | select(.lines.pct < 70)'
```

### 2. Prioritize Files

**Priority Levels**:

**P0 - Critical**:
- Services (API layer)
- Authentication
- Business logic
- Data transformations

**P1 - High**:
- Custom hooks
- Utility functions
- Error handlers
- Validators

**P2 - Medium**:
- Components
- UI logic
- Formatters

**P3 - Low**:
- Types
- Constants
- Styles

### 3. Write Tests

**Process**:
1. Pick a file from priority list
2. Review uncovered lines
3. Write tests for uncovered code
4. Run coverage report
5. Verify improvement
6. Create PR

**Tips**:
- Start with easy wins (utils)
- Focus on critical paths
- Write meaningful tests
- Don't just chase numbers

### 4. Track Progress

**Weekly**:
- Update coverage dashboard
- Review progress toward goal
- Celebrate milestones
- Adjust priorities

**Monthly**:
- Review overall trends
- Identify blockers
- Plan next month's focus
- Share progress with team

## Coverage Best Practices

### Do's

✅ **Focus on quality over quantity**
- Write meaningful tests
- Test behavior, not implementation
- Cover edge cases
- Test error scenarios

✅ **Test critical paths thoroughly**
- Authentication
- Data mutations
- Business logic
- Error handling

✅ **Review coverage in PRs**
- Check coverage diff
- Ensure new code is tested
- Don't merge if coverage drops significantly

✅ **Track coverage over time**
- Monitor trends
- Set goals
- Celebrate improvements

### Don'ts

❌ **Don't chase 100% coverage**
- Diminishing returns
- Focus on critical code
- Some code doesn't need tests (types, constants)

❌ **Don't write tests just for coverage**
- Tests should be meaningful
- Test behavior, not lines
- Quality over quantity

❌ **Don't ignore coverage drops**
- Investigate immediately
- Fix before merging
- Understand root cause

❌ **Don't test implementation details**
- Test public API
- Test user-facing behavior
- Avoid brittle tests

## Reporting

### Daily Report

**Contents**:
- Current coverage: X%
- Change from yesterday: ±Y%
- Files added/modified
- Coverage impact

**Distribution**:
- Slack (#wfm-ci)
- Automated

### Weekly Report

**Contents**:
- Coverage trend
- Top improvements
- Top gaps
- Action items

**Distribution**:
- Team meeting
- Email to team

### Monthly Report

**Contents**:
- Monthly progress
- Goal achievement
- Blockers identified
- Plan for next month

**Distribution**:
- Management review
- Team retrospective

## Implementation Checklist

### Phase 1: Setup
- [ ] Configure coverage in vitest.config.ts
- [ ] Add coverage script to package.json
- [ ] Generate initial coverage report
- [ ] Document baseline

### Phase 2: CI/CD Integration
- [ ] Add coverage to CI workflow
- [ ] Upload coverage artifacts
- [ ] Set up Codecov (or alternative)
- [ ] Configure PR comments

### Phase 3: Monitoring
- [ ] Create coverage dashboard
- [ ] Set up alerts
- [ ] Schedule weekly reviews
- [ ] Document process

### Phase 4: Improvement
- [ ] Identify coverage gaps
- [ ] Prioritize files
- [ ] Create improvement tasks
- [ ] Track progress

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage)
- [Codecov Documentation](https://docs.codecov.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Summary

Test coverage monitoring helps ensure code quality and catch regressions. Track coverage over time, set goals, and continuously improve.

**Key Takeaways**:
- Target 70% overall coverage, 90% for critical paths
- Track coverage in CI/CD
- Alert on coverage drops
- Focus on quality over quantity
- Review coverage in PRs

For questions or setup assistance, contact the development team.
