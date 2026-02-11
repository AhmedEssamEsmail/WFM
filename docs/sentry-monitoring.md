# Sentry Monitoring Setup

## Overview

This document describes how to set up and use Sentry for error monitoring in the WFM application, including configuration, alerting, and best practices.

## Sentry Configuration

### 1. Account Setup

**Steps**:
1. Create Sentry account at [sentry.io](https://sentry.io/)
2. Create new project for WFM application
3. Select "React" as platform
4. Note the DSN (Data Source Name)

### 2. Environment Variables

Add to `.env.production`:

```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
```

### 3. Sentry Initialization

Already configured in `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react'

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured')
    return
  }
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors
  })
}
```

## Metrics to Track

### 1. Error Rate

**Definition**: Number of errors per time period

**Target**: <10 errors per day

**Why it matters**: Indicates application stability

### 2. Affected Users

**Definition**: Number of unique users experiencing errors

**Target**: <1% of active users

**Why it matters**: Measures user impact

### 3. Error Resolution Time

**Definition**: Time from error detection to resolution

**Target**: <24 hours for critical, <7 days for others

**Why it matters**: Indicates team responsiveness

### 4. Error Frequency

**Definition**: How often each error occurs

**Why it matters**: Helps prioritize fixes

## Dashboard Setup

### Sentry Dashboard

**Access**: [sentry.io/organizations/your-org/projects/wfm/](https://sentry.io/)

**Key Sections**:
1. **Issues** - All errors grouped by type
2. **Performance** - Transaction performance metrics
3. **Releases** - Errors by release version
4. **Alerts** - Configured alert rules

### Custom Dashboard

**Widgets to Add**:
1. Error rate over time (line chart)
2. Top errors by frequency (table)
3. Errors by release (bar chart)
4. Affected users (number)
5. Unresolved issues (number)
6. Mean time to resolution (number)

**Creating Dashboard**:
1. Go to Dashboards in Sentry
2. Click "Create Dashboard"
3. Add widgets
4. Configure and save

## Alert Configuration

### Alert Rules

**Critical Alerts** (Immediate notification):
- Error rate exceeds 50 per hour
- New error type appears
- Error affects >100 users
- Critical error occurs (payment, auth, data loss)

**Warning Alerts** (Daily digest):
- Error rate exceeds 10 per hour
- Unresolved errors >7 days old
- Error frequency increasing
- Performance degradation

### Alert Channels

**Slack Integration**:
1. Go to Settings → Integrations
2. Add Slack integration
3. Connect to workspace
4. Configure channel (#wfm-errors)

**Email Notifications**:
1. Go to Settings → Notifications
2. Configure email rules
3. Set recipients
4. Set frequency

**PagerDuty** (for critical alerts):
1. Go to Settings → Integrations
2. Add PagerDuty integration
3. Configure escalation policy
4. Test integration

### Alert Rule Examples

**High Error Rate**:
```
Condition: Number of events > 50 in 1 hour
Action: Send notification to #wfm-errors
Frequency: At most once every 30 minutes
```

**New Error Type**:
```
Condition: A new issue is created
Action: Send notification to #wfm-errors
Frequency: Immediately
```

**Unresolved Errors**:
```
Condition: Issue is unresolved for > 7 days
Action: Send email to team lead
Frequency: Daily at 9 AM
```

## Error Triage Process

### 1. Review New Errors

**Daily** (10 minutes):
- Check Sentry dashboard
- Review new errors
- Assign to team members
- Create GitHub issues for important errors

### 2. Prioritize Errors

**Priority Levels**:

**P0 - Critical**:
- Affects core functionality
- Affects many users (>100)
- Data loss or security issue
- Fix immediately

**P1 - High**:
- Affects important features
- Affects some users (10-100)
- Has workaround
- Fix within 24 hours

**P2 - Medium**:
- Affects minor features
- Affects few users (<10)
- Has workaround
- Fix within 1 week

**P3 - Low**:
- Cosmetic issues
- Affects very few users
- Minor inconvenience
- Fix when time permits

### 3. Assign and Track

**Workflow**:
1. Review error details
2. Determine priority
3. Assign to team member
4. Create GitHub issue (if needed)
5. Link Sentry issue to GitHub issue
6. Track progress
7. Mark as resolved when fixed

### 4. Verify Resolution

**Steps**:
1. Deploy fix to production
2. Monitor Sentry for recurrence
3. Wait 24-48 hours
4. If no recurrence, mark as resolved
5. If recurs, reopen and investigate

## Error Analysis

### Error Details

Each error in Sentry includes:

**Stack Trace**:
- File and line number
- Function call stack
- Source code context

**User Context**:
- User ID (anonymized)
- Browser and OS
- Screen resolution
- Locale

**Request Data**:
- URL and route
- HTTP method
- Query parameters
- Request headers

**Breadcrumbs**:
- User actions leading to error
- API calls made
- Navigation history
- Console logs

### Using Error Data

**Reproducing Errors**:
1. Review breadcrumbs
2. Note user actions
3. Check request data
4. Reproduce locally
5. Fix and test

**Identifying Patterns**:
- Group similar errors
- Look for common factors
- Check if related to specific:
  - Browser/OS
  - User role
  - Feature
  - Time of day

## Performance Monitoring

### Transaction Tracking

Sentry tracks:
- Page load times
- API call durations
- Component render times
- User interactions

### Performance Metrics

**Key Metrics**:
- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1
- **TTFB** (Time to First Byte): <600ms

### Performance Alerts

**Slow Transactions**:
```
Condition: Transaction duration > 3 seconds
Action: Send notification to #wfm-performance
Frequency: Daily digest
```

**Performance Regression**:
```
Condition: P75 duration increases by >20%
Action: Send notification to #wfm-performance
Frequency: Immediately
```

## Release Tracking

### Tagging Releases

**In CI/CD**:
```yaml
# .github/workflows/deploy.yml
- name: Create Sentry release
  run: |
    sentry-cli releases new ${{ github.sha }}
    sentry-cli releases set-commits ${{ github.sha }} --auto
    sentry-cli releases finalize ${{ github.sha }}
```

**Benefits**:
- Track errors by release
- See which release introduced error
- Monitor error rate per release
- Rollback if needed

### Release Health

**Metrics**:
- Crash-free sessions
- Crash-free users
- Session duration
- Adoption rate

**Monitoring**:
- Check after each deployment
- Compare to previous releases
- Alert if crash rate increases
- Rollback if necessary

## Best Practices

### Do's

✅ **Review errors daily**
- Check Sentry dashboard every morning
- Triage new errors
- Assign to team members

✅ **Add context to errors**
- Include user ID
- Include relevant data
- Add custom tags
- Use breadcrumbs

✅ **Set up meaningful alerts**
- Alert on critical errors
- Avoid alert fatigue
- Use appropriate channels
- Test alerts

✅ **Track releases**
- Tag every deployment
- Monitor release health
- Compare releases
- Rollback if needed

✅ **Resolve errors properly**
- Fix root cause
- Test thoroughly
- Monitor after deployment
- Document solution

### Don'ts

❌ **Don't ignore errors**
- Review all errors
- Even if infrequent
- May indicate larger issue

❌ **Don't over-alert**
- Too many alerts = ignored alerts
- Use appropriate thresholds
- Group related alerts

❌ **Don't log sensitive data**
- Remove PII before sending
- Mask passwords
- Sanitize user input

❌ **Don't leave errors unassigned**
- Assign to team member
- Set priority
- Track progress

## Reporting

### Daily Report

**Contents**:
- New errors: X
- Total errors: Y
- Affected users: Z
- Top 5 errors by frequency
- Unresolved critical errors

**Distribution**:
- Slack (#wfm-errors)
- Email to team

### Weekly Report

**Contents**:
- Error trends
- Resolution metrics
- Performance metrics
- Action items

**Distribution**:
- Team meeting
- Email to stakeholders

### Monthly Report

**Contents**:
- Monthly trends
- Improvements made
- Goals for next month
- ROI analysis

**Distribution**:
- Management review
- Team retrospective

## Implementation Checklist

### Phase 1: Basic Setup
- [ ] Create Sentry account
- [ ] Configure DSN in production
- [ ] Verify errors are captured
- [ ] Set up Slack integration

### Phase 2: Alerting
- [ ] Define alert rules
- [ ] Configure Slack alerts
- [ ] Configure email alerts
- [ ] Test alerts

### Phase 3: Process
- [ ] Establish triage process
- [ ] Assign team members
- [ ] Create GitHub issue template
- [ ] Document workflow

### Phase 4: Optimization
- [ ] Review alert effectiveness
- [ ] Optimize sampling rates
- [ ] Add custom context
- [ ] Track releases

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Tracking Best Practices](https://blog.sentry.io/error-monitoring-best-practices/)

## Summary

Sentry provides comprehensive error monitoring for the WFM application. Proper configuration, alerting, and triage processes ensure errors are caught and fixed quickly.

**Key Takeaways**:
- Configure Sentry in production
- Set up meaningful alerts
- Review errors daily
- Track releases
- Monitor performance

For questions or setup assistance, contact the DevOps team.
