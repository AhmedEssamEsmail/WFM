# Test Coverage Validation Process

## Overview

This document describes the process for validating that test coverage meets the production readiness goals of ≥70% overall coverage and ≥90% critical path coverage.

## Coverage Goals

### Overall Coverage

**Target**: ≥70% line coverage

**Validation**: Run coverage report and verify percentage

### Critical Path Coverage

**Target**: ≥90% line coverage

**Critical Paths**:
- Authentication (login, logout, session management)
- Swap request creation and approval workflow
- Leave request creation and approval workflow
- Leave balance deduction and validation
- Shift swap execution (atomic 4-shift update)

### New Code Coverage

**Target**: ≥80% for all new code

**Validation**: Check coverage diff in PRs

## Validation Process

### Step 1: Generate Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# View JSON summary
cat coverage/coverage-summary.json
```

### Step 2: Check Overall Coverage

**Command**:
```bash
# Extract overall coverage percentage
cat coverage/coverage-summary.json | jq '.total.lines.pct'
```

**Expected Output**: ≥70.0

**Validation**:
- [ ] Overall line coverage ≥70%
- [ ] Overall function coverage ≥70%
- [ ] Overall branch coverage ≥70%
- [ ] Overall statement coverage ≥70%

### Step 3: Check Critical Path Coverage

**Critical Files to Verify**:

**Authentication** (`src/services/authService.ts`):
```bash
cat coverage/coverage-summary.json | jq '.["src/services/authService.ts"].lines.pct'
```
**Target**: ≥90%

**Swap Requests** (`src/services/swapRequestsService.ts`):
```bash
cat coverage/coverage-summary.json | jq '.["src/services/swapRequestsService.ts"].lines.pct'
```
**Target**: ≥90%

**Leave Requests** (`src/services/leaveRequestsService.ts`):
```bash
cat coverage/coverage-summary.json | jq '.["src/services/leaveRequestsService.ts"].lines.pct'
```
**Target**: ≥90%

**Leave Balances** (`src/services/leaveBalancesService.ts`):
```bash
cat coverage/coverage-summary.json | jq '.["src/services/leaveBalancesService.ts"].lines.pct'
```
**Target**: ≥90%

**Shifts** (`src/services/shiftsService.ts`):
```bash
cat coverage/coverage-summary.json | jq '.["src/services/shiftsService.ts"].lines.pct'
```
**Target**: ≥90%

### Step 4: Document Results

**Coverage Validation Report**:

```markdown
# Test Coverage Validation Report

**Date**: [Date]
**Validator**: [Name]
**Commit**: [SHA]

## Overall Coverage

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lines | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Functions | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Branches | X.XX% | 70% | ✅ Pass / ❌ Fail |
| Statements | X.XX% | 70% | ✅ Pass / ❌ Fail |

## Critical Path Coverage

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| authService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| swapRequestsService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| leaveRequestsService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| leaveBalancesService | X.XX% | 90% | ✅ Pass / ❌ Fail |
| shiftsService | X.XX% | 90% | ✅ Pass / ❌ Fail |

## Summary

**Overall Status**: ✅ Pass / ❌ Fail

**Notes**:
- [Any notes or observations]

**Action Items**:
- [If failed, list action items to reach goals]
```

### Step 5: Address Gaps (If Needed)

**If Coverage Below Target**:

1. **Identify Gaps**:
   ```bash
   # Find files with low coverage
   cat coverage/coverage-summary.json | jq 'to_entries | .[] | select(.value.lines.pct < 70) | {file: .key, coverage: .value.lines.pct}'
   ```

2. **Prioritize**:
   - Critical paths first
   - High-impact files second
   - Other files third

3. **Write Tests**:
   - Focus on uncovered lines
   - Test edge cases
   - Test error scenarios

4. **Re-validate**:
   - Run coverage again
   - Verify improvement
   - Document results

## Validation Checklist

### Pre-Validation

- [ ] All tests passing
- [ ] No skipped tests
- [ ] No test warnings
- [ ] Clean test output

### Coverage Validation

- [ ] Overall coverage ≥70%
- [ ] Critical path coverage ≥90%
- [ ] No critical files below 70%
- [ ] Coverage report generated

### Documentation

- [ ] Validation report created
- [ ] Results documented
- [ ] Gaps identified (if any)
- [ ] Action items created (if needed)

### Sign-Off

- [ ] Validated by: [Name]
- [ ] Date: [Date]
- [ ] Status: Pass / Fail
- [ ] Next steps: [If failed]

## Continuous Validation

### In CI/CD

**GitHub Actions**:
```yaml
# .github/workflows/ci.yml
- name: Validate coverage
  run: |
    npm run test:coverage
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 70" | bc -l) )); then
      echo "::error::Coverage below 70%: $COVERAGE%"
      exit 1
    fi
    echo "Coverage: $COVERAGE%"
```

### In PRs

**Coverage Diff**:
- Check coverage change
- Ensure new code is tested
- Block merge if coverage drops significantly

**PR Comment**:
```
## Coverage Report

**Overall**: 72.5% (+2.3%)
**New Code**: 85.2%

**Status**: ✅ Pass

All coverage goals met!
```

## Troubleshooting

### Issue: Coverage Below Target

**Symptoms**:
- Overall coverage <70%
- Critical path coverage <90%

**Solutions**:
1. Identify uncovered files
2. Write tests for uncovered code
3. Focus on critical paths first
4. Re-run validation

### Issue: Flaky Coverage

**Symptoms**:
- Coverage varies between runs
- Inconsistent results

**Solutions**:
1. Check for non-deterministic tests
2. Fix flaky tests
3. Ensure clean test environment
4. Run multiple times to verify

### Issue: Coverage Report Not Generated

**Symptoms**:
- No coverage folder
- Empty coverage report

**Solutions**:
1. Check vitest.config.ts
2. Verify coverage provider installed
3. Run with --coverage flag
4. Check for errors in test output

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage)
- [Coverage Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Coverage Guide](./testing-guide.md)

## Summary

Test coverage validation ensures the WFM application meets production readiness standards. Validate coverage regularly and address gaps promptly.

**Key Steps**:
1. Generate coverage report
2. Check overall coverage (≥70%)
3. Check critical path coverage (≥90%)
4. Document results
5. Address gaps if needed

For questions or assistance, contact the development team.
