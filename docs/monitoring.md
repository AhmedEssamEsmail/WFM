# Monitoring and Error Tracking

Complete guide for monitoring the WFM application, including error tracking with Sentry, performance monitoring, and alerting.

## Table of Contents

1. [Overview](#overview)
2. [Sentry Setup](#sentry-setup)
3. [Error Tracking](#error-tracking)
4. [Performance Monitoring](#performance-monitoring)
5. [CI/CD Monitoring](#cicd-monitoring)
6. [Alerting](#alerting)
7. [Dashboard](#dashboard)
8. [Validation](#validation)

---

## Overview

### Monitoring Stack

- **Error Tracking**: Sentry
- **Performance Monitoring**: Sentry Browser Tracing
- **Session Replay**: Sentry Replay
- **Alerting**: Slack, Email, PagerDuty

### Key Metrics

**Error Metrics**:
- Error rate: <10 errors per day (target)
- Affected users: <1% of active users (target)
- Resolution time: <24 hours for critical (target)

**Performance Metrics**:
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- TTFB (Time to First Byte): <600ms

---

## Sentry Setup

### 1. Account Setup

**Steps**:
1. Create Sentry account at [sentry.io](https://sentry.io/)
2. Create new project for WFM application
3. Select "React" as platform
4. Note the DSN (Data Source Name)

### 2. Environment Configuration

Add to `.env.production`:

```env
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
```

**Important**: Never commit the Sentry DSN to version control.

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
    beforeSend(event, hint) {
      // Remove PII before sending
      if (event.user) {
        event.user.id = event.user.id
        delete event.user.email
        delete event.user.username
      }
      return event
    },
  })
}
```

---

## Error Tracking

### Error Types

**Application Errors**:
- ValidationError: Input validation failures
- ConcurrencyError: Optimistic locking conflicts
- ResourceNotFoundError: Missing database records
- SwapExecutionError: Shift swap failures
- AuthenticationError: Login/auth failures
- PermissionError: Authorization failures

**Network Errors**:
- API failures
- HTTP status codes
- Request/response data

**Database Errors**:
- Supabase errors
- Query failures
- RLS violations

### Error Context

**Automatic Context**:
- Browser information
- URL and route
- User agent
- Breadcrumbs (user actions)
- Stack traces

**Custom Context**:
```typescript
{
  type: 'database' | 'network' | 'validation' | 'auth' | 'permission',
  operation: 'specific operation name',
  field: 'field name for validation errors',
  // ... other context-specific data
}
```

**User Context** (no PII):
```typescript
Sentry.setUser({
  id: user.id,  // UUID only
})
```

### Error Handler Integration

The error handler (`src/lib/errorHandler.ts`) automatically sends errors to Sentry:

```typescript
private sendToErrorTracking(errorLog: ErrorLog): void {
  if (import.meta.env.PROD && window.Sentry) {
    Sentry.captureException(errorLog.error, {
      extra: errorLog.context,
      tags: {
        errorType: errorLog.context.type as string,
      },
    })
  }
}
```

### Security Logger Integration

Security events are sent to Sentry (`src/lib/securityLogger.ts`):

```typescript
private sendToSentry(event: SecurityEvent): void {
  if (import.meta.env.PROD && window.Sentry) {
    Sentry.captureMessage(event.message, {
      level: this.mapSeverityToSentryLevel(event.severity),
      tags: {
        eventType: event.eventType,
        severity: event.severity,
      },
      extra: event.metadata,
    })
  }
}
```

### Error Triage Process

#### 1. Review New Errors (Daily - 10 minutes)
- Check Sentry dashboard
- Review new errors
- Assign to team members
- Create GitHub issues for important errors

#### 2. Prioritize Errors

**P0 - Critical** (Fix immediately):
- Affects core functionality
- Affects many users (>100)
- Data loss or security issue

**P1 - High** (Fix within 24 hours):
- Affects important features
- Affects some users (10-100)
- Has workaround

**P2 - Medium** (Fix within 1 week):
- Affects minor features
- Affects few users (<10)
- Has workaround

**P3 - Low** (Fix when time permits):
- Cosmetic issues
- Affects very few users
- Minor inconvenience

#### 3. Assign and Track

1. Review error details
2. Determine priority
3. Assign to team member
4. Create GitHub issue (if needed)
5. Link Sentry issue to GitHub issue
6. Track progress
7. Mark as resolved when fixed

#### 4. Verify Resolution

1. Deploy fix to production
2. Monitor Sentry for recurrence
3. Wait 24-48 hours
4. If no recurrence, mark as resolved
5. If recurs, reopen and investigate

---

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

### Sample Rate

Performance data is sampled at 10% to reduce overhead:

```typescript
tracesSampleRate: 0.1
```

Adjust based on traffic and budget.

### Session Replay

**Configuration**:
```typescript
new Sentry.Replay({
  maskAllText: true,      // Mask all text content
  blockAllMedia: true,    // Block images and videos
})
```

**Privacy**:
- All text is masked by default
- All media is blocked
- Only DOM structure and interactions captured
- No sensitive data recorded

**Sample Rates**:
- Normal sessions: 10% sampled
- Error sessions: 100% sampled

---

## Alerting

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

---

## Dashboard

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
7. Page load times (line chart)
8. API latency (line chart)

**Creating Dashboard**:
1. Go to Dashboards in Sentry
2. Click "Create Dashboard"
3. Add widgets
4. Configure and save

---

## Validation

### Validation Process

#### Step 1: Verify Configuration

```bash
# Check environment variables (in production)
echo $VITE_SENTRY_DSN
echo $VITE_SENTRY_ENVIRONMENT
```

**Checklist**:
- [ ] VITE_SENTRY_DSN configured
- [ ] VITE_SENTRY_ENVIRONMENT set to "production"
- [ ] Sentry project exists
- [ ] DSN is correct

#### Step 2: Trigger Test Errors

**Method 1: Test Button**:
```tsx
<button onClick={() => {
  throw new Error('Sentry Test Error - Please Ignore')
}}>
  Test Sentry
</button>
```

**Method 2: Console Command**:
```javascript
throw new Error('Sentry Test Error - Please Ignore')
```

#### Step 3: Verify Error Capture

**Check Sentry Dashboard**:
1. Go to sentry.io
2. Select WFM project
3. Go to Issues
4. Look for test error

**Expected**:
- Error appears within 1-2 minutes
- Stack trace is readable (not minified)
- User context is present
- Environment is "production"

**Checklist**:
- [ ] Error appears in Sentry
- [ ] Error captured within 2 minutes
- [ ] Stack trace is readable
- [ ] Source maps working
- [ ] User context present

#### Step 4: Verify Error Context

**User Context**:
```json
{
  "id": "user-123"
  // Email should NOT be present (PII removed)
}
```

**Tags**:
```json
{
  "errorType": "UnhandledError",
  "route": "/dashboard",
  "environment": "production"
}
```

**Checklist**:
- [ ] User ID present
- [ ] Email NOT present (PII removed)
- [ ] Route information present
- [ ] Error type tagged
- [ ] Breadcrumbs captured

#### Step 5: Verify Source Maps

**Good** (source maps working):
```
Error: Sentry Test Error
  at handleClick (Dashboard.tsx:45:11)
  at onClick (Button.tsx:12:5)
```

**Bad** (source maps not working):
```
Error: Sentry Test Error
  at a (main.abc123.js:1:2345)
  at b (main.abc123.js:1:6789)
```

**Checklist**:
- [ ] File names are readable
- [ ] Line numbers are accurate
- [ ] Function names are readable
- [ ] Source code visible in Sentry

#### Step 6: Verify Performance Monitoring

**Check Performance Dashboard**:
1. Go to Performance in Sentry
2. View transactions
3. Check page load times

**Checklist**:
- [ ] Transactions captured
- [ ] Page load times visible
- [ ] API calls tracked
- [ ] Web Vitals present
- [ ] Sample rate appropriate (10%)

#### Step 7: Verify Alerts

**Test Alert Rules**:
```javascript
// Trigger 50+ errors quickly
for (let i = 0; i < 60; i++) {
  setTimeout(() => {
    throw new Error(`Test Error ${i}`)
  }, i * 100)
}
```

**Checklist**:
- [ ] Alert rules configured
- [ ] Slack integration working
- [ ] Email notifications working
- [ ] Alert thresholds appropriate
- [ ] Test alert received

#### Step 8: Document Results

```markdown
# Sentry Integration Validation Report

**Date**: [Date]
**Validator**: [Name]
**Environment**: Production

## Configuration
- [x] DSN configured
- [x] Environment set to production
- [x] Sentry initialized

## Error Capture
- [x] Test error captured
- [x] Capture time: <2 minutes
- [x] Stack trace readable
- [x] Source maps working

## Error Context
- [x] User ID present
- [x] PII removed
- [x] Route information present
- [x] Breadcrumbs captured

## Performance Monitoring
- [x] Transactions captured
- [x] Page load times visible
- [x] Web Vitals present

## Alerts
- [x] Alert rules configured
- [x] Slack integration working
- [x] Test alert received

## Summary
**Status**: ✅ Pass / ❌ Fail

**Notes**: [Any notes]

**Action Items**: [If failed]
```

---

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

✅ **Protect privacy**
- Remove PII before sending
- Mask sensitive data
- Sanitize URLs
- Review replays

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

❌ **Don't track 100% of transactions**
- Use appropriate sample rate
- Balance cost and coverage
- Adjust based on traffic

---

## Troubleshooting

### Errors Not Captured

**Solutions**:
1. Check DSN is correct
2. Verify Sentry is initialized
3. Check browser console for Sentry errors
4. Verify network requests to Sentry
5. Check Sentry project settings

### Source Maps Not Working

**Solutions**:
1. Verify `sourcemap: true` in build config
2. Check Sentry plugin configuration
3. Verify source maps uploaded
4. Check Sentry auth token
5. Re-upload source maps

### Missing Context

**Solutions**:
1. Check Sentry initialization
2. Verify context is set before error
3. Check beforeSend hook
4. Verify integrations enabled

### Alerts Not Working

**Solutions**:
1. Check alert rule conditions
2. Verify Slack integration
3. Check webhook URL
4. Test alert manually
5. Check alert frequency settings

---

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

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Boundaries](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/react/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/guides/react/session-replay/)

---

## Summary

Proper monitoring and error tracking are essential for maintaining application health. Sentry provides comprehensive error tracking, performance monitoring, and alerting capabilities.

**Key Takeaways**:
- Configure Sentry in production
- Set up meaningful alerts
- Review errors daily
- Track releases
- Monitor performance
- Protect user privacy

For questions or assistance, contact the DevOps team.
