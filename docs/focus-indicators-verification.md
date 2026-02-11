# Focus Indicators Verification Process

## Overview

This document provides guidance for verifying that all interactive elements in the WFM application have visible focus indicators. Focus indicators are essential for keyboard users to know which element currently has focus.

**WCAG Criteria**: 2.4.7 Focus Visible, 2.4.11 Focus Appearance (Minimum)

## Requirements

### WCAG 2.1 Level AA (2.4.7 Focus Visible)

- All interactive elements must have a visible focus indicator
- Focus indicator must be visible when element receives keyboard focus
- Focus indicator must have sufficient contrast (3:1 minimum against adjacent colors)

### WCAG 2.2 Level AA (2.4.11 Focus Appearance - Future)

- Focus indicator must be at least 2 CSS pixels thick
- Focus indicator must have 3:1 contrast ratio against adjacent colors
- Focus indicator must encompass the entire element or be at least as large as a 2px border

## What Needs Focus Indicators

### Interactive Elements

- [ ] Buttons
- [ ] Links
- [ ] Form inputs (text, email, password, etc.)
- [ ] Textareas
- [ ] Select dropdowns
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Toggle switches
- [ ] Date pickers
- [ ] File upload buttons
- [ ] Custom controls (sliders, tabs, etc.)
- [ ] Modal close buttons
- [ ] Navigation menu items
- [ ] Pagination controls
- [ ] Table action buttons
- [ ] Icon buttons
- [ ] Search inputs

## Testing Process

### Step 1: Prepare for Testing

1. **Disconnect mouse** or move it out of reach
2. **Open application** in browser
3. **Open DevTools** (F12) to inspect styles
4. **Have this checklist** ready

### Step 2: Test Each Interactive Element

For each element:

1. **Tab to element**
   - Press Tab until element receives focus

2. **Verify focus indicator is visible**
   - Look for outline, border, box-shadow, or background change
   - Indicator should be clearly visible

3. **Check contrast**
   - Focus indicator must have 3:1 contrast against adjacent colors
   - Use browser DevTools color picker to verify

4. **Check thickness**
   - Indicator should be at least 2px thick (recommended)
   - Thin indicators (1px) may be hard to see

5. **Document issues**
   - Note any elements with missing or poor focus indicators

### Step 3: Test Different Element Types

#### Buttons

**Expected**: Outline, box-shadow, or background change

```css
/* Good examples */
button:focus {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
}
```

**Test**:
- [ ] Primary buttons
- [ ] Secondary buttons
- [ ] Icon buttons
- [ ] Text buttons
- [ ] Disabled buttons (should not receive focus)

#### Links

**Expected**: Outline or underline change

```css
/* Good examples */
a:focus {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

a:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}
```

**Test**:
- [ ] Navigation links
- [ ] In-content links
- [ ] Footer links
- [ ] Breadcrumb links

#### Form Inputs

**Expected**: Border change or box-shadow

```css
/* Good examples */
input:focus,
textarea:focus,
select:focus {
  border: 2px solid #0066CC;
  outline: none;
}

input:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
}
```

**Test**:
- [ ] Text inputs
- [ ] Email inputs
- [ ] Password inputs
- [ ] Number inputs
- [ ] Textareas
- [ ] Select dropdowns
- [ ] Date inputs

#### Checkboxes and Radio Buttons

**Expected**: Outline or box-shadow around control

```css
/* Good examples */
input[type="checkbox"]:focus,
input[type="radio"]:focus {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

**Test**:
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Custom styled checkboxes
- [ ] Custom styled radio buttons

#### Custom Controls

**Expected**: Clear visual indicator appropriate to control type

**Test**:
- [ ] Date pickers
- [ ] Dropdowns
- [ ] Tabs
- [ ] Accordions
- [ ] Sliders
- [ ] Toggle switches

### Step 4: Test in Different Contexts

#### Light Mode

- [ ] Test all elements in light theme
- [ ] Verify focus indicators are visible
- [ ] Check contrast against light backgrounds

#### Dark Mode (if applicable)

- [ ] Test all elements in dark theme
- [ ] Verify focus indicators are visible
- [ ] Check contrast against dark backgrounds

#### On Colored Backgrounds

- [ ] Test elements on colored backgrounds
- [ ] Verify focus indicators still visible
- [ ] Adjust colors if needed

#### In Modals

- [ ] Test focus indicators in modal dialogs
- [ ] Verify indicators visible against modal background
- [ ] Check close button focus indicator

## Common Issues and Solutions

### Issue: No Focus Indicator

**Problem**: Element has `outline: none` with no replacement

```css
/* Bad */
button:focus {
  outline: none;
}
```

**Solution**: Add visible focus indicator

```css
/* Good */
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

### Issue: Focus Indicator Too Subtle

**Problem**: Focus indicator is barely visible

```css
/* Bad - too subtle */
button:focus {
  outline: 1px dotted #CCCCCC;
}
```

**Solution**: Make indicator more prominent

```css
/* Good - clearly visible */
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

### Issue: Low Contrast Focus Indicator

**Problem**: Focus indicator doesn't have 3:1 contrast

```css
/* Bad - low contrast */
button:focus {
  outline: 2px solid #DDDDDD; /* 1.3:1 against white */
}
```

**Solution**: Use higher contrast color

```css
/* Good - sufficient contrast */
button:focus-visible {
  outline: 2px solid #0066CC; /* 7.22:1 against white */
}
```

### Issue: Focus Indicator Obscured

**Problem**: Focus indicator is hidden by other elements

**Solution**: Adjust z-index or positioning

```css
/* Ensure focus indicator is visible */
button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid #0066CC;
}
```

## Best Practices

### Do's

✅ **Use `:focus-visible` for better UX**
```css
/* Only show focus indicator for keyboard users */
button:focus-visible {
  outline: 2px solid #0066CC;
}

/* Hide for mouse users */
button:focus:not(:focus-visible) {
  outline: none;
}
```

✅ **Use sufficient contrast**
```css
/* 3:1 minimum against adjacent colors */
button:focus-visible {
  outline: 2px solid #0066CC; /* 7.22:1 against white */
}
```

✅ **Make indicators prominent**
```css
/* At least 2px thick */
button:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

✅ **Test with keyboard only**
- Disconnect mouse
- Tab through all elements
- Verify all indicators are visible

### Don'ts

❌ **Don't remove outline without replacement**
```css
/* Bad */
button:focus {
  outline: none;
}
```

❌ **Don't use low contrast indicators**
```css
/* Bad */
button:focus {
  outline: 1px solid #CCCCCC;
}
```

❌ **Don't make indicators too subtle**
```css
/* Bad */
button:focus {
  outline: 1px dotted gray;
}
```

## Documentation Template

### Focus Indicator Test Results

| Element | Location | Has Indicator | Visible | Contrast | Thickness | Pass/Fail | Notes |
|---------|----------|---------------|---------|----------|-----------|-----------|-------|
| Primary button | All pages | ✅ | ✅ | 7.22:1 | 2px | ✅ Pass | |
| Text input | Forms | ✅ | ✅ | 7.22:1 | 2px | ✅ Pass | |
| Link | Navigation | ❌ | ❌ | N/A | N/A | ❌ Fail | No focus indicator |

### Issue Documentation

```markdown
## Focus Indicator Issue: [Element Name]

**Location**: [Page/component]  
**Element**: [Description]  
**Severity**: [Critical/Serious/Moderate]  
**WCAG Criterion**: 2.4.7 Focus Visible

### Problem
[Description of the issue]

### Current State
- Has focus indicator: [Yes/No]
- Visible: [Yes/No]
- Contrast ratio: [X.XX:1]
- Thickness: [Xpx]

### Impact
[How this affects keyboard users]

### Recommended Fix
```css
/* Current */
.element:focus {
  outline: none;
}

/* Proposed */
.element:focus-visible {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
```

### Verification
- [ ] Focus indicator added
- [ ] Indicator is visible
- [ ] Contrast ≥ 3:1
- [ ] Thickness ≥ 2px
- [ ] Tested with keyboard
```

## Testing Checklist

### Global Elements
- [ ] Logo/home link
- [ ] Navigation menu items
- [ ] Search input
- [ ] User menu button
- [ ] Logout button

### Forms
- [ ] Text inputs
- [ ] Email inputs
- [ ] Password inputs
- [ ] Textareas
- [ ] Select dropdowns
- [ ] Checkboxes
- [ ] Radio buttons
- [ ] Date pickers
- [ ] File upload buttons
- [ ] Submit buttons
- [ ] Cancel buttons

### Interactive Components
- [ ] Buttons (all types)
- [ ] Links (all locations)
- [ ] Icon buttons
- [ ] Modal close buttons
- [ ] Tab controls
- [ ] Accordion headers
- [ ] Pagination controls
- [ ] Table action buttons
- [ ] Filter controls
- [ ] Sort controls

### Custom Controls
- [ ] Date pickers
- [ ] Dropdowns
- [ ] Toggle switches
- [ ] Sliders
- [ ] Custom selects

## Resources

### Guidelines
- [WCAG 2.1 - Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [WCAG 2.2 - Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance-minimum)
- [WebAIM - Keyboard Accessibility](https://webaim.org/articles/keyboard/)

### Tools
- [Focus Indicator Bookmarklet](https://accessibility-bookmarklets.org/install.html)
- [What Has Focus?](https://chrome.google.com/webstore/detail/what-has-focus/glakmabbmcihbgkgdgfmijgcbhkfmgkj)

### Examples
- [Focus Styles](https://www.sarasoueidan.com/blog/focus-indicators/)
- [Modern CSS Focus Styles](https://moderncss.dev/modern-css-upgrades-to-improve-accessibility/)

## Summary

Focus indicators are essential for keyboard accessibility. All interactive elements must have visible focus indicators with sufficient contrast.

**Key Requirements**:
- All interactive elements must have focus indicators
- Indicators must be visible (not removed with `outline: none`)
- Indicators must have 3:1 contrast against adjacent colors
- Indicators should be at least 2px thick
- Test with keyboard only (disconnect mouse)

For questions or issues, consult with the development team.
