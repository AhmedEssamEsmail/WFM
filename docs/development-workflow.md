# Development Workflow Guide

This guide covers the optimized development workflow for the WFM project with VS Code extensions and tooling.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests in watch mode
npm test

# Run all validations (type-check, lint, format)
npm run validate
```

## VS Code Extensions Setup

The project is configured to work with the following extensions:

- **Prettier** - Auto-formatting on save
- **ESLint** - Linting with auto-fix on save
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **Error Lens** - Inline error display
- **GitLens** - Enhanced Git features

### Extension Features

1. **Auto-format on save** - Files are automatically formatted with Prettier when you save
2. **Auto-fix on save** - ESLint auto-fixes issues when you save
3. **Inline errors** - Error Lens shows errors directly in your code
4. **Tailwind autocomplete** - Get suggestions for Tailwind classes as you type

## Available Scripts

### Development

```bash
npm run dev              # Start Vite dev server
npm run preview          # Preview production build locally
```

### Code Quality

```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Fix auto-fixable linting errors
npm run format           # Format all files with Prettier
npm run format:check     # Check if files are formatted
npm run type-check       # Run TypeScript compiler without emitting files
npm run validate         # Run all checks (type-check + lint + format:check)
npm run validate:fix     # Run all checks and fix issues (type-check + lint:fix + format)
```

### Testing

```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once (CI mode)
npm run test:coverage    # Run tests with coverage report
```

### Build

```bash
npm run build            # Build for production
```

## Pre-Commit Checklist

Before committing code, run:

```bash
npm run validate:fix     # Fix all auto-fixable issues
npm run test:run         # Ensure all tests pass
```

Or use the quick validation:

```bash
npm run validate         # Check without fixing
```

## Code Quality Standards

### TypeScript

- **Strict mode enabled** - No implicit any, strict null checks
- **Zero TypeScript errors** - All code must pass type checking
- Run `npm run type-check` to verify

### ESLint

- **9 errors fixed** - All explicit `any` types replaced with proper types
- **11 warnings remaining** - Mostly React Hooks exhaustive-deps warnings (acceptable)
- Run `npm run lint` to check

### Prettier

- **Consistent formatting** - All files formatted with Prettier
- **Tailwind class sorting** - Tailwind classes automatically sorted
- Run `npm run format` to format all files

## Common Tasks

### Creating a New Component

1. Create the component file in `src/components/`
2. Save the file (auto-formatting will apply)
3. Import and use the component
4. Check for errors with Error Lens inline display

### Fixing Linting Errors

1. Save the file (auto-fix will run)
2. For remaining errors, check Error Lens inline messages
3. Press `Ctrl+.` on the error for quick fixes
4. Run `npm run lint:fix` to fix all files

### Running Tests

```bash
# Watch mode for development
npm test

# Single run for CI
npm run test:run

# With coverage
npm run test:coverage
```

## CI/CD Integration

The project includes scripts optimized for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: npm ci

- name: Validate code
  run: npm run validate

- name: Run tests
  run: npm run test:coverage

- name: Build
  run: npm run build
```

## Troubleshooting

### Extension Not Working

1. Reload VS Code window: `Ctrl+Shift+P` → "Reload Window"
2. Check extension is enabled in Extensions panel
3. Verify `.vscode/settings.json` exists

### Format on Save Not Working

1. Check Prettier is set as default formatter
2. Verify `editor.formatOnSave` is true in settings
3. Check file is not in `.prettierignore`

### ESLint Not Auto-Fixing

1. Check `editor.codeActionsOnSave` in settings
2. Verify ESLint extension is running (check status bar)
3. Run `npm run lint:fix` manually

## Performance Tips

1. **Use React Query DevTools** - Only loads in development mode
2. **Code splitting** - Large pages are lazy loaded
3. **Memoization** - Use `useMemo` and `useCallback` for expensive operations
4. **Service layer** - All data fetching goes through service layer with caching

## Best Practices

1. **Always run validation before committing** - `npm run validate:fix`
2. **Write tests for new features** - Maintain test coverage
3. **Use TypeScript strictly** - No `any` types without good reason
4. **Follow React Hooks rules** - ESLint will catch violations
5. **Keep components small** - Split large components into smaller ones
6. **Use service layer** - No direct Supabase imports in components

## Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [React Query](https://tanstack.com/query/latest)
