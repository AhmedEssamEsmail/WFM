# Accessibility Guide

Complete guide for ensuring WCAG 2.1 Level AA compliance in the WFM application.

## Table of Contents

1. [Overview](#overview)
2. [Tools Setup](#tools-setup)
3. [Audit Process](#audit-process)
4. [Testing Procedures](#testing-procedures)
5. [Remediation](#remediation)
6. [Monitoring](#monitoring)
7. [Validation](#validation)

---

## Overview

### WCAG 2.1 Level AA Compliance

**Target**: 100% compliance with WCAG 2.1 Level AA standards

**Why it matters**:
- Legal compliance (ADA, Section 508)
- Better user experience for all users
- Approximately 15% of the population has some form of disability
- Improves SEO and code quality

### Key Principles

**Perceivable**: Information must be presentable to users in ways they can perceive
**Operable**: User interface components must be operable
**Understandable**: Information and operation must be understandable
**Robust**: Content must be robust enough to work with assistive technologies

---

## Tools Setup

### Required Tools

#### 1. axe DevTools Browser Extension

**Purpose**: Automated accessibility testing

**Installation**:
- Chrome: [axe DevTools Extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
- Firefox: [axe DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

**Usage**:
1. Open DevTools (F12)
2. Navigate to "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review violations by severity
5. Export results as CSV

#### 2. NVDA Screen Reader (Windows)

**Purpose**: Manual screen reader testing

**Installation**:
1. Download from [nvaccess.org](https://www.nvaccess.org/download/)
2. Run installer
3. Choose installation type (install recommended)
4. Complete setup wizard

**Basic Shortcuts**:
- `Ctrl + Alt + N`: Start NVDA
- `NVDA + Q`: Quit NVDA
- `H`: Next heading
- `K`: Next link
- `B`: Next button
- `F`: Next form field
- `Tab`: Next interactive element

#### 3. Color Contrast Checker

**Browser DevTools** (Recommended):
- Chrome: Inspect → Styles → Color picker → Contrast ratio
- Firefox: Inspect → Accessibility → Color contrast

**Online Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

---

## Audit Process

### Pages to Audit (17 total)

**Priority 1 - Core Pages**:
- Dashboard (`/dashboard`)
- Login (`/login`)
- Swap Requests List (`/swap-requests`)
- Leave Requests List (`/leave-requests`)

**Priority 2 - Form Pages**:
- Create Swap Request (`/swap-requests/new`)
- Create Leave Request (`/leave-requests/new`)
- Settings (`/settings`)

**Priority 3 - Detail Pages**:
- Swap Request Detail (`/swap-requests/:id`)
- Leave Request Detail (`/leave-requests/:id`)
- Employee Detail (`/headcount/:id`)

**Priority 4 - Additional Pages**:
- Signup (`/signup`)
- Leave Balances (`/leave-balances`)
- Schedule (`/schedule`)
- Schedule Upload (`/schedule/upload`)
- Employee Directory (`/headcount`)
- Reports (`/reports`)
- Unauthorized (`/unauthorized`)

### Quick Audit Process (15-20 min per page)

#### 1. Automated Scan (2-5 minutes)
```
1. Navigate to page
2. Open DevTools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations
6. Export results
```

#### 2. Keyboard Navigation (3-5 minutes)
```
1. Reload page
2. Press Tab repeatedly
3. Verify all interactive elements reachable
4. Verify tab order is logical
5. Verify focus indicators visible
6. Test Enter/Space on buttons
7. Test Escape on modals
```

#### 3. Screen Reader Test (5-10 minutes)
```
1. Start NVDA (Ctrl+Alt+N)
2. Navigate to page
3. Press H for headings
4. Press Tab for interactive elements
5. Test forms (if present)
6. Verify all content announced
7. Stop NVDA (NVDA+Q)
```

#### 4. Document Results (5 minutes)
```
1. Note violation count by severity
2. Document specific issues
3. Add to tracking spreadsheet
```

---

## Testing Procedures

### Keyboard Navigation Testing

**Goal**: Ensure all functionality available via keyboard

**Process**:
1. Disconnect mouse (or move out of reach)
2. Tab through all interactive elements
3. Verify tab order is logical (left-to-right, top-to-bottom)
4. Test activation (Enter/Space)
5. Test dismissal (Escape)
6. Verify no keyboard traps

**Common Issues**:
- Elements not focusable
- Poor focus indicators
- Illogical tab order
- Keyboard traps in modals

**Solutions**:
```tsx
// Make element focusable
<button onClick={handleClick}>Click me</button>

// Add visible focus indicator
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

// Fix tab order (use natural DOM order)
<div>
  <button>First</button>
  <button>Second</button>
</div>
```

### Screen Reader Testing

**Goal**: Ensure all content accessible to screen reader users

**Process**:
1. Start NVDA
2. Navigate page with keyboard
3. Verify page title announced
4. Check heading hierarchy (H key)
5. Test form labels (F key)
6. Verify button labels (B key)
7. Test dynamic content announcements

**Common Issues**:
- Missing alt text on images
- Missing form labels
- Poor heading hierarchy
- Buttons without labels
- Content not announced

**Solutions**:
```tsx
// Add alt text
<img src="icon.png" alt="User profile icon" />

// Add form labels
<label htmlFor="email">Email</label>
<input type="email" id="email" />

// Add button labels
<button aria-label="Close dialog">
  <XIcon />
</button>

// Announce dynamic changes
<div aria-live="polite">
  {statusMessage}
</div>
```

### Color Contrast Verification

**Goal**: Ensure sufficient contrast for readability

**Requirements**:
- Normal text: 4.5:1 minimum
- Large text (≥18pt or ≥14pt bold): 3:1 minimum
- UI components: 3:1 minimum

**Process**:
1. Inspect element
2. Note foreground and background colors
3. Check ratio in DevTools color picker
4. Verify meets requirements

**Common Issues**:
- Light gray text on white background
- Low contrast button borders
- Placeholder text too light
- Link color insufficient contrast

**Solutions**:
```css
/* Darken text for better contrast */
.text {
  color: #666666; /* 5.74:1 ratio */
}

/* Darken borders */
.input {
  border: 1px solid #959595; /* 3.04:1 ratio */
}

/* Use darker link color */
a {
  color: #0066CC; /* 7.22:1 ratio */
}
```

### Focus Indicators Verification

**Goal**: Ensure visible focus indicators on all interactive elements

**Requirements**:
- All interactive elements must have focus indicators
- Indicators must be visible (3:1 contrast minimum)
- Indicators should be at least 2px thick

**Process**:
1. Tab to each interactive element
2. Verify focus indicator visible
3. Check contrast of indicator
4. Verify thickness adequate

**Common Issues**:
- `outline: none` without replacement
- Focus indicator too subtle
- Low contrast indicators

**Solutions**:
```css
/* Add visible focus indicator */
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

/* Or use box-shadow */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
}
```

### Form Accessibility Verification

**Goal**: Ensure all forms are accessible

**Requirements**:
- All fields have labels
- Required fields indicated
- Validation errors announced
- Error messages specific and actionable

**Process**:
1. Navigate to form
2. Verify all fields have labels
3. Check required field indicators
4. Submit with errors
5. Verify error messages announced

**Common Issues**:
- Missing labels
- Placeholder as label
- Generic error messages
- Errors not associated with fields

**Solutions**:
```tsx
// Proper label
<label htmlFor="email">Email</label>
<input type="email" id="email" required />

// Required indicator
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>

// Specific error message
<input 
  type="email" 
  id="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Please enter a valid email address
</div>
```

### ARIA Usage Verification

**Goal**: Ensure ARIA used correctly

**First Rule**: "No ARIA is better than bad ARIA"

**Process**:
1. Search codebase for ARIA attributes
2. Verify each is necessary
3. Check for conflicts with semantic HTML
4. Test with screen reader

**Common Issues**:
- Redundant ARIA (duplicates semantic HTML)
- Conflicting ARIA (contradicts semantic HTML)
- Invalid ARIA values
- Missing required ARIA attributes

**Solutions**:
```tsx
// Use semantic HTML first
<button>Click me</button>

// Add ARIA only when needed
<button aria-label="Close dialog">
  <XIcon />
</button>

// Proper modal ARIA
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirm Delete</h2>
</div>
```

---

## Remediation

### Prioritization Framework

**Critical (P0)** - Fix immediately (within 1 week):
- Blocks core user tasks
- Affects all users
- WCAG Level A violation

**Serious (P1)** - Fix within 2-4 weeks:
- Significantly impacts UX
- Affects many users
- WCAG Level AA violation

**Moderate (P2)** - Fix within 1-2 months:
- Creates barriers with workarounds
- Affects some users
- WCAG Level AA violation

**Minor (P3)** - Fix within 3-6 months:
- Minor inconvenience
- Affects few users
- Best practice recommendation

### Common Fixes

#### Missing Alt Text
```tsx
// Before
<img src="icon.png" />

// After
<img src="icon.png" alt="User profile icon" />

// Decorative images
<img src="decoration.png" alt="" />
```

#### Poor Color Contrast
```css
/* Before */
.text {
  color: #999;
  background: #fff;
}

/* After */
.text {
  color: #666; /* Meets 4.5:1 ratio */
  background: #fff;
}
```

#### Missing Form Labels
```tsx
// Before
<input type="text" placeholder="Email" />

// After
<label htmlFor="email">Email</label>
<input type="text" id="email" name="email" />
```

#### Keyboard Navigation Issues
```tsx
// Before
<div onClick={handleClick}>Click me</div>

// After
<button onClick={handleClick}>Click me</button>
```

#### Missing Focus Indicators
```css
/* Add visible focus styles */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### Implementation Phases

**Phase 1: Critical Fixes** (Week 1)
- Address all P0 issues
- Test with accessibility tools
- Verify with screen reader
- Deploy to production

**Phase 2: Serious Fixes** (Weeks 2-4)
- Address all P1 issues
- Test incrementally
- Deploy with regular releases

**Phase 3: Moderate Fixes** (Months 2-3)
- Address all P2 issues
- Test in batches
- Deploy with regular releases

**Phase 4: Minor Fixes** (Months 4-6)
- Address all P3 issues
- Test as time permits
- Deploy with regular releases

---

## Monitoring

### Metrics to Track

**Violation Count**:
- Critical: 0 (target)
- Serious: 0 (target)
- Moderate: <5 (target)
- Minor: <10 (target)

**WCAG Compliance**:
- Target: 100% Level AA compliance
- Track by principle (Perceivable, Operable, Understandable, Robust)

**Remediation Progress**:
- Issues identified: X
- Issues fixed: Y
- Completion rate: (Y/X) × 100%

### Continuous Monitoring

**Automated Checks**:
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Check

on: [pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run a11y:test
```

**PR Checks**:
- Run axe DevTools on affected pages
- Check for new violations
- Verify fixes don't break accessibility
- Document in PR description

**Monthly Audits**:
- Full manual audit
- Update compliance score
- Review trends
- Plan improvements

### Alerting

**Critical Alerts** (Immediate):
- New critical violation introduced
- Compliance score drops below 80%

**Warning Alerts** (Daily digest):
- New serious violation introduced
- Compliance score drops below 90%

---

## Validation

### Validation Process

#### Step 1: Re-run Automated Audit
- Run axe DevTools on all pages
- Verify critical violations: 0
- Verify serious violations: 0
- Verify moderate violations: <5

#### Step 2: Verify Critical Issues Resolved
- Review original audit
- List all critical issues
- Verify each is fixed
- Test with tools and screen reader

#### Step 3: Manual Testing
- Keyboard navigation on all pages
- Screen reader testing on critical flows
- Color contrast verification
- Focus indicator verification

#### Step 4: User Feedback
- Test with users with disabilities
- Collect feedback
- Document issues
- Prioritize improvements

#### Step 5: Document Results
```markdown
# Accessibility Validation Report

**Date**: [Date]
**Status**: ✅ Pass / ❌ Fail

## Automated Audit Results
- Critical: 0 ✅
- Serious: 0 ✅
- Moderate: 3 ✅
- Minor: 8 ✅

## Manual Testing
- Keyboard navigation: ✅ Pass
- Screen reader: ✅ Pass
- Color contrast: ✅ Pass
- Focus indicators: ✅ Pass

## WCAG 2.1 AA Compliance
- Overall: 100% ✅
- Perceivable: 10/10 ✅
- Operable: 11/11 ✅
- Understandable: 9/9 ✅
- Robust: 3/3 ✅

## Summary
All accessibility requirements met. Application is WCAG 2.1 Level AA compliant.
```

---

## Best Practices

### Do's

✅ Use semantic HTML
✅ Provide text alternatives for images
✅ Ensure keyboard accessibility
✅ Use sufficient color contrast
✅ Provide visible focus indicators
✅ Label all form fields
✅ Use ARIA appropriately
✅ Test with real screen readers
✅ Test with keyboard only
✅ Document all issues

### Don'ts

❌ Don't use color alone to convey information
❌ Don't remove focus indicators without replacement
❌ Don't use placeholder as label
❌ Don't hide content from screen readers unnecessarily
❌ Don't create keyboard traps
❌ Don't use tables for layout
❌ Don't rely only on automated tools
❌ Don't ignore minor violations
❌ Don't test only at the end
❌ Don't assume it's accessible

---

## Resources

### Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE](https://wave.webaim.org/)

### Training
- [Deque University](https://dequeuniversity.com/)
- [WebAIM Training](https://webaim.org/training/)
- [A11ycasts (YouTube)](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

---

## Summary

Accessibility is essential for ensuring all users can access and use the WFM application. Follow this guide to achieve and maintain WCAG 2.1 Level AA compliance.

**Key Takeaways**:
- Test early and often
- Use automated and manual testing
- Fix critical issues immediately
- Monitor continuously
- Train the team
- Make accessibility part of the development process

For questions or assistance, contact the development team.
