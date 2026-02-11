# Developer Onboarding Guide - WFM Application

## Welcome!

Welcome to the WFM (Workforce Management) development team! This guide will help you get up to speed with our codebase, development practices, and production readiness standards.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Codebase Overview](#codebase-overview)
4. [Development Workflow](#development-workflow)
5. [Testing Requirements](#testing-requirements)
6. [Accessibility Standards](#accessibility-standards)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Error Tracking](#error-tracking)
9. [Code Quality Standards](#code-quality-standards)
10. [Resources and Support](#resources-and-support)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18.x or later installed
- [ ] Git installed and configured
- [ ] GitHub account with repository access
- [ ] Code editor (VS Code recommended)
- [ ] Supabase account access
- [ ] Sentry account access (for error tracking)

### First Day Checklist

- [ ] Clone the repository
- [ ] Install dependencies (`npm install`)
- [ ] Set up environment variables
- [ ] Run the application locally (`npm run dev`)
- [ ] Run tests (`npm run test`)
- [ ] Join team Slack channels
- [ ] Schedule onboarding sessions
- [ ] Review this documentation

## Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/wfm-app.git
cd wfm-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sentry (optional for local development)
VITE_SENTRY_DSN=your_sentry_dsn
VITE_SENTRY_ENVIRONMENT=development

# Test Database (for running tests)
VITE_SUPABASE_TEST_URL=your_test_supabase_url
VITE_SUPABASE_TEST_ANON_KEY=your_test_supabase_anon_key
```

**Note**: Ask your team lead for the actual values.

### 4. Run the Application

```bash
# Development server
npm run dev

# Open http://localhost:5173 in your browser
```

### 5. Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 6. Recommended VS Code Extensions

Install these extensions for the best development experience:

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - TypeScript support
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **axe Accessibility Linter** - Accessibility checking
- **GitLens** - Git integration
- **Error Lens** - Inline error display

## Codebase Overview

### Project Structure

```
wfm-app/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service layer
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   ├── test/            # Test files
│   └── App.tsx          # Main application component
├── docs/                # Documentation
├── .github/             # GitHub Actions workflows
├── public/              # Static assets
└── package.json         # Dependencies and scripts
```

### Key Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Supabase** - Backend (database, auth, storage)
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **Sentry** - Error tracking

### Architecture Patterns

**Service Layer Pattern**:
- All API calls go through service files
- Services handle data transformation
- Components use React Query hooks

**Component Structure**:
- Presentational components (UI only)
- Container components (logic + UI)
- Custom hooks for shared logic

**State Management**:
- React Query for server state
- React Context for global UI state
- Local state for component-specific state

## Development Workflow

### 1. Pick a Task

- Check the project board for available tasks
- Assign yourself to a task
- Move task to "In Progress"

### 2. Create a Branch

```bash
# Feature branch
git checkout -b feature/task-description

# Bug fix branch
git checkout -b fix/bug-description

# Documentation branch
git checkout -b docs/doc-description
```

### 3. Make Changes

- Write code following our standards
- Write tests for new functionality
- Run tests locally
- Check accessibility
- Update documentation if needed

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add swap request filtering

- Add filter component
- Add filter logic to service
- Add tests for filtering
- Update documentation"
```

**Commit Message Format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `style:` - Code style changes
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
# Push branch
git push origin feature/task-description

# Create PR on GitHub
# Fill out PR template
# Request reviews
```

### 6. Address Review Feedback

- Respond to comments
- Make requested changes
- Push updates
- Re-request review

### 7. Merge

- Ensure all CI checks pass
- Get required approvals
- Squash and merge
- Delete branch

## Testing Requirements

### Test Coverage Goals

- **Overall Coverage**: ≥70%
- **Critical Paths**: ≥90%
- **New Features**: ≥80%

### Types of Tests

**Unit Tests**:
- Test individual functions
- Test React components
- Test custom hooks
- Fast execution (<1ms per test)

**Integration Tests**:
- Test user flows
- Test API integration
- Test component interactions
- Slower execution (acceptable)

**Edge Case Tests**:
- Test error scenarios
- Test boundary conditions
- Test race conditions
- Test concurrent operations

### Writing Tests

**Example Unit Test**:
```typescript
import { describe, it, expect } from 'vitest'
import { formatDate } from './dateHelpers'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15')
    expect(formatDate(date)).toBe('01/15/2025')
  })

  it('handles invalid date', () => {
    expect(formatDate(null)).toBe('')
  })
})
```

**Example Component Test**:
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test src/utils/dateHelpers.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Test Best Practices

- Write tests before or alongside code (TDD)
- Test behavior, not implementation
- Use descriptive test names
- Keep tests simple and focused
- Mock external dependencies
- Clean up after tests
- Aim for fast test execution

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

We follow WCAG 2.1 Level AA standards for accessibility. All new features must be accessible.

### Accessibility Checklist

Before submitting a PR, verify:

- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] Color contrast meets 4.5:1 ratio (normal text)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA attributes are used correctly
- [ ] Heading hierarchy is logical
- [ ] Screen reader testing completed

### Testing Tools

**axe DevTools**:
- Install browser extension
- Run on every page you modify
- Fix all critical and serious issues

**Keyboard Navigation**:
- Disconnect mouse
- Tab through all interactive elements
- Verify all functionality works

**Screen Reader** (NVDA on Windows):
- Test critical user flows
- Verify all content is announced
- Verify form labels are read

### Resources

- [Accessibility Tools Setup](./accessibility-tools-setup.md)
- [Keyboard Navigation Testing](./keyboard-navigation-testing.md)
- [Screen Reader Testing](./screen-reader-testing.md)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

## CI/CD Pipeline

### What Runs on Every PR

Our GitHub Actions workflow runs:

1. **Build** - TypeScript compilation
2. **Lint** - ESLint checks (zero errors required)
3. **Test** - All unit and integration tests
4. **Coverage** - Test coverage report

### Viewing CI Results

1. Go to your PR on GitHub
2. Scroll to "Checks" section
3. Click on failed check to see details
4. Fix issues and push again

### Common CI Failures

**TypeScript Errors**:
```bash
# Check locally
npm run build

# Fix type errors
# Push again
```

**Linting Errors**:
```bash
# Check locally
npm run lint

# Auto-fix where possible
npm run lint -- --fix

# Fix remaining errors manually
# Push again
```

**Test Failures**:
```bash
# Run tests locally
npm run test

# Fix failing tests
# Push again
```

### Branch Protection

- All CI checks must pass
- At least 1 approval required
- No force pushes to main
- Branch must be up to date

## Error Tracking

### Sentry Integration

We use Sentry for error tracking in production.

### Viewing Errors

1. Log into [Sentry Dashboard](https://sentry.io/)
2. Select WFM project
3. View recent errors
4. Click error for details

### Error Details

Each error includes:
- Stack trace
- User information (anonymized)
- Request data
- Breadcrumbs (user actions leading to error)
- Environment (production, staging, etc.)

### Triaging Errors

**Priority Levels**:
- **Critical**: Affects many users, blocks core functionality
- **High**: Affects some users, impacts important features
- **Medium**: Affects few users, has workarounds
- **Low**: Minor issues, cosmetic problems

**Workflow**:
1. Review new errors daily
2. Assign to team member
3. Create GitHub issue if needed
4. Fix and deploy
5. Mark as resolved in Sentry

### Resources

- [Error Tracking Documentation](./error-tracking.md)
- [Sentry Dashboard](https://sentry.io/)

## Code Quality Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Define interfaces for data structures
- Use type inference where possible
- Document complex types

### React

- Use functional components
- Use hooks for state and effects
- Keep components small and focused
- Extract reusable logic to custom hooks
- Avoid prop drilling (use context)

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use consistent spacing scale
- Ensure responsive design
- Test on different screen sizes

### Code Organization

- One component per file
- Group related files together
- Use index files for exports
- Keep files under 300 lines
- Extract complex logic to utilities

### Performance

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Use useMemo and useCallback appropriately
- Lazy load routes and components
- Optimize images and assets

### Security

- Never commit secrets or API keys
- Validate all user input
- Sanitize data before display
- Use HTTPS for all requests
- Follow OWASP guidelines

## Resources and Support

### Documentation

- [Testing Guide](./testing-guide.md)
- [Accessibility Documentation](./accessibility-audit.md)
- [Error Tracking](./error-tracking.md)
- [Caching Strategy](./caching-strategy.md)
- [Technical Debt](./technical-debt.md)

### External Resources

**React**:
- [React Documentation](https://react.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)

**TypeScript**:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

**Testing**:
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

**Accessibility**:
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### Getting Help

**Slack Channels**:
- `#wfm-dev` - General development questions
- `#wfm-production-readiness` - Testing, accessibility, CI/CD
- `#wfm-bugs` - Bug reports and fixes

**Office Hours**:
- Tuesdays 2-3 PM - Testing and CI/CD
- Thursdays 3-4 PM - Accessibility
- Fridays 10-11 AM - General Q&A

**1:1 Sessions**:
- Schedule with team lead
- Schedule with senior developers
- Pair programming sessions available

### Team Contacts

- **Team Lead**: [Name] - [email]
- **Senior Developer**: [Name] - [email]
- **QA Lead**: [Name] - [email]
- **DevOps**: [Name] - [email]

## Your First Week

### Day 1: Setup and Orientation

- [ ] Complete environment setup
- [ ] Run application locally
- [ ] Run tests successfully
- [ ] Join Slack channels
- [ ] Meet the team

### Day 2: Codebase Exploration

- [ ] Review project structure
- [ ] Read key documentation
- [ ] Explore main features
- [ ] Review recent PRs
- [ ] Ask questions

### Day 3: First Contribution

- [ ] Pick a "good first issue"
- [ ] Create branch
- [ ] Make changes
- [ ] Write tests
- [ ] Create PR

### Day 4: Testing and Accessibility

- [ ] Complete testing training
- [ ] Complete accessibility training
- [ ] Run accessibility tests
- [ ] Fix accessibility issue

### Day 5: Review and Reflection

- [ ] Review PR feedback
- [ ] Make requested changes
- [ ] Merge first PR
- [ ] Reflect on learnings
- [ ] Plan next week

## Your First Month

### Week 1: Onboarding

- Complete environment setup
- Make first contribution
- Learn testing and accessibility

### Week 2: Feature Development

- Work on small features
- Write comprehensive tests
- Participate in code reviews

### Week 3: Integration

- Work on larger features
- Integrate with team workflows
- Contribute to documentation

### Week 4: Independence

- Work independently on tasks
- Help onboard next new developer
- Share learnings with team

## Success Criteria

By the end of your first month, you should be able to:

- [ ] Set up development environment independently
- [ ] Navigate the codebase confidently
- [ ] Write tests for new features
- [ ] Test accessibility with tools
- [ ] Create PRs that pass CI
- [ ] Respond to code review feedback
- [ ] Follow team workflows
- [ ] Ask for help when needed

## Feedback

We want to improve our onboarding process! Please provide feedback:

- **Survey**: [Onboarding Feedback Form](https://forms.google.com/...)
- **Suggestions**: Email team-lead@company.com
- **Issues**: Create issue in GitHub with label `onboarding`

## Welcome to the Team!

We're excited to have you on the team. Don't hesitate to ask questions, and remember that everyone was new once. We're here to help you succeed!

**Next Steps**:
1. Complete Day 1 checklist
2. Schedule onboarding sessions
3. Join team meetings
4. Start contributing!

For questions or support, reach out in `#wfm-dev` Slack channel or email your team lead.
