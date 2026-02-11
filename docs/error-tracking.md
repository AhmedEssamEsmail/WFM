# Error Tracking with Sentry

## Overview

This application uses [Sentry](https://sentry.io) for error tracking and performance monitoring in production. Sentry provides real-time error reporting, performance insights, and debugging context to help identify and fix issues quickly.

## Setup

### Prerequisites

- Sentry account (free tier available)
- Sentry project created for the WFM application
- Sentry DSN (Data Source Name)

### Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production  # or development, staging, etc.
```

**Important**: Never commit the Sentry DSN to version control. Use environment variables or secrets management.

### Installation

Sentry is already installed in the project:

```bash
npm install @sentry/react @sentry/tracing
```

## Integration

### Initialization

Sentry is initialized in `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled')
    return
  }
  
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,  // 10% of transactions
    replaysSessionSampleRate: 0.1,  // 10% of sessions
    replaysOnErrorSampleRate: 1.0,  // 100% of sessions with errors
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

The initialization is called in `src/main.tsx` before the app renders.

### Error Handler Integration

The application's error handler (`src/lib/errorHandler.ts`) automatically sends errors to Sentry:

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

Security events are also sent to Sentry (`src/lib/securityLogger.ts`):

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

## Error Context

### Automatic Context

Sentry automatically captures:
- **Browser information**: Browser type, version, OS
- **URL**: Current page URL and route
- **User agent**: Full user agent string
- **Breadcrumbs**: User actions leading up to the error
- **Stack traces**: Full JavaScript stack traces

### Custom Context

The error handler adds custom context:

```typescript
{
  type: 'database' | 'network' | 'validation' | 'auth' | 'permission',
  operation: 'specific operation name',
  field: 'field name for validation errors',
  // ... other context-specific data
}
```

### User Context

User information is added (without PII):

```typescript
Sentry.setUser({
  id: user.id,  // UUID only, no email or name
})
```

## Error Types

### Application Errors

Custom error types are tracked:

- **ValidationError**: Input validation failures
- **ConcurrencyError**: Optimistic locking conflicts
- **ResourceNotFoundError**: Missing database records
- **SwapExecutionError**: Shift swap failures
- **AuthenticationError**: Login/auth failures
- **PermissionError**: Authorization failures

### Network Errors

API and network failures are captured with:
- Request URL
- HTTP status code
- Response body (if available)
- Request headers (sanitized)

### Database Errors

Supabase errors are captured with:
- Error code
- Error message
- Query context
- Table name

## Performance Monitoring

### Transaction Tracking

Sentry tracks performance with:
- **Page loads**: Initial page load time
- **Route changes**: Navigation performance
- **API calls**: Request/response times
- **Component renders**: React component performance

### Sample Rate

Performance data is sampled at 10% to reduce overhead:

```typescript
tracesSampleRate: 0.1
```

Adjust this value based on traffic and budget.

## Session Replay

### Configuration

Session replay captures user interactions:

```typescript
new Sentry.Replay({
  maskAllText: true,      // Mask all text content
  blockAllMedia: true,    // Block images and videos
})
```

### Privacy

- All text is masked by default
- All media is blocked
- Only DOM structure and interactions are captured
- No sensitive data is recorded

### Sample Rates

- **Normal sessions**: 10% sampled
- **Error sessions**: 100% sampled

## Alert Configuration

### Error Alerts

Configure alerts in Sentry dashboard:

1. **Critical Errors**
   - Trigger: Any error with severity "error" or "fatal"
   - Action: Slack notification + email
   - Frequency: Immediately

2. **High Error Rate**
   - Trigger: >10 errors per minute
   - Action: Slack notification
   - Frequency: Once per hour

3. **New Error Types**
   - Trigger: First occurrence of new error
   - Action: Email notification
   - Frequency: Immediately

### Performance Alerts

1. **Slow Page Load**
   - Trigger: Page load >3 seconds
   - Action: Email notification
   - Frequency: Daily digest

2. **API Latency**
   - Trigger: API response >2 seconds
   - Action: Slack notification
   - Frequency: Once per hour

## Dashboard

### Key Metrics

Monitor these metrics in Sentry:

- **Error rate**: Errors per minute/hour
- **Affected users**: Number of users experiencing errors
- **Error frequency**: Most common errors
- **Performance**: Average page load time
- **Stability**: Crash-free sessions percentage

### Custom Dashboards

Create custom dashboards for:
- **By feature**: Errors grouped by feature area
- **By user role**: Errors by agent/TL/WFM
- **By environment**: Production vs staging
- **By browser**: Browser-specific issues

## Debugging

### Error Details

Each error in Sentry includes:

1. **Stack trace**: Full JavaScript stack trace
2. **Breadcrumbs**: User actions before error
3. **Context**: Custom error context
4. **User info**: User ID (no PII)
5. **Environment**: Browser, OS, device
6. **Tags**: Error type, severity, feature

### Reproduction

To reproduce an error:

1. Review breadcrumbs for user actions
2. Check session replay (if available)
3. Review error context for operation details
4. Check stack trace for code location
5. Verify environment matches (browser, OS)

### Source Maps

Source maps are uploaded to Sentry for readable stack traces:

```bash
# Upload source maps (configured in CI/CD)
sentry-cli releases files <version> upload-sourcemaps ./dist
```

## Best Practices

### Error Handling

1. **Use custom error types**: Create specific error classes
2. **Add context**: Include relevant operation details
3. **Avoid PII**: Never include email, name, or sensitive data
4. **Use error boundaries**: Catch React component errors
5. **Log before throwing**: Log errors before re-throwing

### Performance

1. **Sample appropriately**: Don't track 100% of transactions
2. **Filter noise**: Ignore expected errors (404s, etc.)
3. **Group errors**: Use fingerprinting for similar errors
4. **Set thresholds**: Define acceptable error rates

### Privacy

1. **Mask sensitive data**: Use beforeSend to sanitize
2. **Remove PII**: Strip email, phone, address
3. **Sanitize URLs**: Remove query parameters with tokens
4. **Review replays**: Ensure no sensitive data visible

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN**: Verify VITE_SENTRY_DSN is set
2. **Check environment**: Sentry only runs in production
3. **Check initialization**: Verify initSentry() is called
4. **Check network**: Ensure Sentry.io is accessible
5. **Check console**: Look for Sentry initialization logs

### Missing Context

1. **Check error handler**: Verify context is added
2. **Check beforeSend**: Ensure context not removed
3. **Check error type**: Verify custom error classes used
4. **Check tags**: Verify tags are set correctly

### High Volume

1. **Increase sample rate**: Reduce tracesSampleRate
2. **Filter errors**: Use beforeSend to ignore noise
3. **Group errors**: Improve error fingerprinting
4. **Set rate limits**: Configure in Sentry dashboard

## Testing

### Local Testing

Test Sentry integration locally:

```typescript
// Trigger a test error
throw new Error('Test error for Sentry')

// Trigger a test message
Sentry.captureMessage('Test message', 'info')

// Trigger a test exception
Sentry.captureException(new Error('Test exception'))
```

### Production Testing

Test in production (carefully):

1. Create a test error endpoint
2. Trigger error with specific tag
3. Verify error appears in Sentry
4. Verify context is correct
5. Delete test error from Sentry

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Error Boundaries](https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/react/performance/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/guides/react/session-replay/)

## Support

For Sentry-related issues:

1. Check Sentry status page: https://status.sentry.io/
2. Review Sentry documentation
3. Contact Sentry support (paid plans)
4. Check internal documentation
5. Ask the development team
