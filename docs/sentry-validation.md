# Sentry Integration Validation Process

## Overview

This document describes the process for validating that Sentry error tracking is properly configured and capturing errors in production.

## Validation Goals

- [ ] Sentry captures 100% of production errors
- [ ] Error context includes user ID, route, and action
- [ ] Source maps are uploaded for readable stack traces
- [ ] Alerts are configured and working
- [ ] Performance monitoring is enabled

## Validation Process

### Step 1: Verify Configuration

**Check Environment Variables**:
```bash
# In production environment (Vercel)
echo $VITE_SENTRY_DSN
echo $VITE_SENTRY_ENVIRONMENT
```

**Expected**:
- DSN is set and valid
- Environment is "production"

**Checklist**:
- [ ] VITE_SENTRY_DSN configured in Vercel
- [ ] VITE_SENTRY_ENVIRONMENT set to "production"
- [ ] Sentry project exists
- [ ] DSN is correct

### Step 2: Trigger Test Errors

**Method 1: Test Button** (Recommended for initial validation):

Add temporary test button:
```tsx
// In a component (remove after validation)
<button onClick={() => {
  throw new Error('Sentry Test Error - Please Ignore')
}}>
  Test Sentry
</button>
```

**Method 2: Console Command**:
```javascript
// In browser console on production site
throw new Error('Sentry Test Error - Please Ignore')
```

**Method 3: API Error**:
```javascript
// Trigger an API error
fetch('https://api.example.com/nonexistent')
  .catch(error => console.error(error))
```

### Step 3: Verify Error Capture

**Check Sentry Dashboard**:
1. Go to [sentry.io](https://sentry.io/)
2. Select WFM project
3. Go to Issues
4. Look for test error

**Expected**:
- Error appears within 1-2 minutes
- Error has correct title
- Stack trace is readable (not minified)
- User context is present
- Environment is "production"

**Checklist**:
- [ ] Error appears in Sentry
- [ ] Error captured within 2 minutes
- [ ] Stack trace is readable
- [ ] Source maps working
- [ ] User context present

### Step 4: Verify Error Context

**Check Error Details**:

**User Context**:
```json
{
  "id": "user-123",
  "username": "john.doe"
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

**Breadcrumbs**:
- User actions leading to error
- API calls made
- Navigation history
- Console logs

**Checklist**:
- [ ] User ID present
- [ ] Email NOT present (PII removed)
- [ ] Route/page information present
- [ ] Error type tagged
- [ ] Breadcrumbs captured
- [ ] Request data present

### Step 5: Verify Source Maps

**Check Stack Trace**:

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
- [ ] File names are readable (not minified)
- [ ] Line numbers are accurate
- [ ] Function names are readable
- [ ] Source code visible in Sentry

**If Source Maps Not Working**:

1. **Check Build Configuration**:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       sourcemap: true, // Must be true
     },
   })
   ```

2. **Check Sentry Plugin**:
   ```typescript
   // vite.config.ts
   import { sentryVitePlugin } from '@sentry/vite-plugin'
   
   export default defineConfig({
     plugins: [
       sentryVitePlugin({
         org: 'your-org',
         project: 'wfm',
         authToken: process.env.SENTRY_AUTH_TOKEN,
       }),
     ],
   })
   ```

3. **Verify Upload**:
   ```bash
   # Check if source maps were uploaded
   sentry-cli releases files VERSION list
   ```

### Step 6: Verify Performance Monitoring

**Check Performance Dashboard**:
1. Go to Performance in Sentry
2. View transactions
3. Check page load times

**Expected**:
- Transactions are captured
- Page load times visible
- API call durations tracked
- LCP, FID, CLS metrics present

**Checklist**:
- [ ] Transactions captured
- [ ] Page load times visible
- [ ] API calls tracked
- [ ] Web Vitals present
- [ ] Sample rate appropriate (10%)

### Step 7: Verify Alerts

**Test Alert Rules**:

**Method 1: Trigger Multiple Errors**:
```javascript
// Trigger 50+ errors quickly
for (let i = 0; i < 60; i++) {
  setTimeout(() => {
    throw new Error(`Test Error ${i}`)
  }, i * 100)
}
```

**Method 2: Check Alert Configuration**:
1. Go to Alerts in Sentry
2. View alert rules
3. Check conditions and actions

**Expected Alerts**:
- High error rate (>50/hour)
- New error type
- Unresolved errors >7 days

**Checklist**:
- [ ] Alert rules configured
- [ ] Slack integration working
- [ ] Email notifications working
- [ ] Alert thresholds appropriate
- [ ] Test alert received

### Step 8: Document Results

**Validation Report**:

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
- [x] PII removed (no email)
- [x] Route information present
- [x] Breadcrumbs captured
- [x] Tags present

## Performance Monitoring

- [x] Transactions captured
- [x] Page load times visible
- [x] Web Vitals present
- [x] Sample rate: 10%

## Alerts

- [x] Alert rules configured
- [x] Slack integration working
- [x] Test alert received

## Summary

**Status**: ✅ Pass / ❌ Fail

**Notes**:
- All validation checks passed
- Sentry is properly configured
- Ready for production use

**Action Items**:
- None (or list if failed)
```

## Validation Checklist

### Configuration
- [ ] Sentry DSN configured in production
- [ ] Environment variable set correctly
- [ ] Sentry initialized in app
- [ ] Project exists in Sentry

### Error Capture
- [ ] Test error captured successfully
- [ ] Capture time <2 minutes
- [ ] Error details complete
- [ ] Stack trace readable

### Context and Data
- [ ] User context present
- [ ] PII removed
- [ ] Route information captured
- [ ] Breadcrumbs working
- [ ] Tags applied correctly

### Source Maps
- [ ] Source maps uploaded
- [ ] File names readable
- [ ] Line numbers accurate
- [ ] Source code visible

### Performance
- [ ] Transactions captured
- [ ] Page load times tracked
- [ ] API calls monitored
- [ ] Web Vitals present

### Alerts
- [ ] Alert rules configured
- [ ] Slack integration working
- [ ] Email notifications working
- [ ] Test alert received

### Sign-Off
- [ ] Validated by: [Name]
- [ ] Date: [Date]
- [ ] Status: Pass / Fail
- [ ] Production ready: Yes / No

## Troubleshooting

### Issue: Errors Not Captured

**Symptoms**:
- Test error not appearing in Sentry
- No errors in dashboard

**Solutions**:
1. Check DSN is correct
2. Verify Sentry is initialized
3. Check browser console for Sentry errors
4. Verify network requests to Sentry
5. Check Sentry project settings

### Issue: Source Maps Not Working

**Symptoms**:
- Minified file names in stack trace
- Unreadable function names
- No source code visible

**Solutions**:
1. Verify `sourcemap: true` in build config
2. Check Sentry plugin configuration
3. Verify source maps uploaded
4. Check Sentry auth token
5. Re-upload source maps

### Issue: Missing Context

**Symptoms**:
- No user information
- No breadcrumbs
- No tags

**Solutions**:
1. Check Sentry initialization
2. Verify context is set before error
3. Check beforeSend hook
4. Verify integrations enabled

### Issue: Alerts Not Working

**Symptoms**:
- No alerts received
- Slack notifications not sent

**Solutions**:
1. Check alert rule conditions
2. Verify Slack integration
3. Check webhook URL
4. Test alert manually
5. Check alert frequency settings

## Continuous Validation

### Weekly Checks

- [ ] Review error rate
- [ ] Check alert effectiveness
- [ ] Verify source maps still working
- [ ] Review performance metrics

### Monthly Checks

- [ ] Full validation process
- [ ] Review and update alert rules
- [ ] Check Sentry quota usage
- [ ] Optimize sample rates if needed

### After Deployments

- [ ] Verify errors still captured
- [ ] Check source maps uploaded
- [ ] Monitor for new error types
- [ ] Review release health

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Error Tracking Documentation](./error-tracking.md)

## Summary

Sentry integration validation ensures production errors are captured and monitored effectively. Complete all validation steps before considering production ready.

**Key Steps**:
1. Verify configuration
2. Trigger test errors
3. Check error capture
4. Verify context and source maps
5. Test alerts
6. Document results

For questions or assistance, contact the DevOps team.
