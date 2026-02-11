# Keyboard Navigation Testing Process

## Overview

This document provides a comprehensive guide for testing keyboard navigation in the WFM application. Keyboard accessibility is essential for users who cannot use a mouse, including users with motor disabilities, blind users, and power users who prefer keyboard shortcuts.

**WCAG Criteria**: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible

## Why Keyboard Testing Matters

- **Accessibility**: Essential for users with motor disabilities
- **Screen Reader Users**: Blind users navigate primarily with keyboard
- **Power Users**: Many users prefer keyboard for efficiency
- **Legal Compliance**: Required for WCAG 2.1 Level AA compliance
- **Quality Indicator**: Good keyboard support indicates well-structured code

## Prerequisites

- Application running locally (`npm run dev`)
- Test accounts for different roles (Agent, TL, WFM)
- Browser (Chrome, Firefox, or Edge recommended)
- This testing guide

## Essential Keyboard Shortcuts

### Standard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` | Activate button, link, or submit form |
| `Space` | Activate button, toggle checkbox |
| `Escape` | Close modal, cancel action, clear field |
| `Arrow Keys` | Navigate within components (dropdowns, radio groups) |
| `Home` | Jump to first item in list |
| `End` | Jump to last item in list |
| `Page Up` | Scroll up one page |
| `Page Down` | Scroll down one page |

### Form Controls

| Key | Action |
|-----|--------|
| `Tab` | Move to next form field |
| `Shift + Tab` | Move to previous form field |
| `Space` | Toggle checkbox or radio button |
| `Arrow Keys` | Select option in radio group |
| `Enter` | Submit form (when on submit button) |
| `Escape` | Clear field or cancel input |

### Dropdown/Select Controls

| Key | Action |
|-----|--------|
| `Space` or `Enter` | Open dropdown |
| `Arrow Up/Down` | Navigate options |
| `Home` | Jump to first option |
| `End` | Jump to last option |
| `Enter` | Select option and close |
| `Escape` | Close without selecting |
| `Type letters` | Jump to option starting with letter |

### Date Pickers

| Key | Action |
|-----|--------|
| `Tab` | Move to date picker input |
| `Space` or `Enter` | Open calendar |
| `Arrow Keys` | Navigate dates |
| `Page Up/Down` | Change month |
| `Home` | Jump to first day of month |
| `End` | Jump to last day of month |
| `Enter` | Select date |
| `Escape` | Close calendar |

### Modal Dialogs

| Key | Action |
|-----|--------|
| `Tab` | Cycle through focusable elements in modal |
| `Shift + Tab` | Cycle backwards |
| `Escape` | Close modal |
| **Focus must be trapped** | Tab should not leave modal |
| **Focus must return** | Focus returns to trigger element on close |

## Testing Process

### Step 1: Prepare for Testing

1. **Disconnect your mouse** (or move it out of reach)
   - This forces you to rely entirely on keyboard
   - Helps identify issues you might miss otherwise

2. **Open the application**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173`

3. **Open browser DevTools** (F12)
   - Keep Console open to see any errors
   - Use Elements tab to inspect focus styles

4. **Prepare test data**
   - Have test accounts ready
   - Know what data to enter in forms
   - Have expected outcomes documented

### Step 2: Test Each Page

For each page in the application, follow this process:

#### A. Initial Focus

- [ ] **Refresh the page**
- [ ] **Press Tab once**
- [ ] **Verify**: Focus moves to first interactive element
- [ ] **Verify**: Focus indicator is clearly visible
- [ ] **Note**: What element receives focus first?

#### B. Tab Order

- [ ] **Press Tab repeatedly** through all interactive elements
- [ ] **Verify**: Tab order is logical (left-to-right, top-to-bottom)
- [ ] **Verify**: All interactive elements are reachable
- [ ] **Verify**: No elements are skipped
- [ ] **Verify**: Focus doesn't jump unexpectedly
- [ ] **Document**: Any issues with tab order

**Expected Tab Order**:
1. Skip link (if present)
2. Logo/home link
3. Navigation menu items
4. Main content interactive elements
5. Footer links

#### C. Focus Indicators

- [ ] **Tab through all elements**
- [ ] **Verify**: Each element shows visible focus indicator
- [ ] **Verify**: Focus indicator has sufficient contrast (3:1 minimum)
- [ ] **Verify**: Focus indicator is not obscured by other elements
- [ ] **Document**: Any elements with missing or poor focus indicators

**Good Focus Indicators**:
- Outline or border around element
- Background color change
- Box shadow
- Combination of above

**Poor Focus Indicators**:
- Too subtle (low contrast)
- Obscured by other elements
- Removed entirely (outline: none without replacement)

#### D. Keyboard Activation

- [ ] **Tab to each interactive element**
- [ ] **Press Enter or Space** to activate
- [ ] **Verify**: Element activates correctly
- [ ] **Verify**: Expected action occurs
- [ ] **Document**: Any elements that don't respond to keyboard

**Test These Elements**:
- Buttons (Enter and Space should both work)
- Links (Enter should work)
- Checkboxes (Space should toggle)
- Radio buttons (Arrow keys should select)
- Dropdowns (Space/Enter should open)
- Custom controls (should have keyboard support)

#### E. Form Navigation

- [ ] **Tab to first form field**
- [ ] **Enter data using keyboard only**
- [ ] **Tab through all fields**
- [ ] **Verify**: Can complete entire form
- [ ] **Verify**: Can submit form with Enter key
- [ ] **Verify**: Can clear fields with Escape (if applicable)
- [ ] **Document**: Any fields that are not keyboard accessible

**Form Testing Checklist**:
- [ ] Text inputs accept keyboard input
- [ ] Dropdowns open with Space/Enter
- [ ] Date pickers are keyboard accessible
- [ ] Checkboxes toggle with Space
- [ ] Radio buttons navigate with Arrow keys
- [ ] Submit button activates with Enter
- [ ] Validation errors are keyboard accessible

#### F. Modal Dialogs

- [ ] **Open modal using keyboard**
- [ ] **Verify**: Focus moves into modal
- [ ] **Press Tab repeatedly**
- [ ] **Verify**: Focus stays within modal (focus trap)
- [ ] **Verify**: Can reach all elements in modal
- [ ] **Press Escape**
- [ ] **Verify**: Modal closes
- [ ] **Verify**: Focus returns to trigger element
- [ ] **Document**: Any focus management issues

**Modal Testing Checklist**:
- [ ] Modal opens with keyboard
- [ ] Focus moves to modal on open
- [ ] Tab cycles through modal elements only
- [ ] Shift+Tab cycles backwards
- [ ] Escape closes modal
- [ ] Focus returns to trigger on close
- [ ] Background content is not accessible while modal open

#### G. Keyboard Traps

- [ ] **Tab through entire page**
- [ ] **Verify**: Can always move focus forward
- [ ] **Shift+Tab through entire page**
- [ ] **Verify**: Can always move focus backward
- [ ] **Verify**: Never stuck on an element
- [ ] **Document**: Any keyboard traps found

**Common Keyboard Traps**:
- Embedded iframes without escape
- Custom widgets without proper focus management
- Modals without Escape key handler
- Infinite tab loops

#### H. Skip Links

- [ ] **Refresh page**
- [ ] **Press Tab once**
- [ ] **Verify**: Skip link appears (if implemented)
- [ ] **Press Enter on skip link**
- [ ] **Verify**: Focus jumps to main content
- [ ] **Document**: Whether skip link is present and functional

**Skip Link Best Practices**:
- Should be first focusable element
- Should be visible on focus
- Should skip to main content
- Should have descriptive text ("Skip to main content")

### Step 3: Test Interactive Components

#### Tables

- [ ] **Tab to table**
- [ ] **Verify**: Can navigate table with keyboard
- [ ] **Verify**: Can access all interactive elements in table
- [ ] **Verify**: Tab order follows logical reading order
- [ ] **Document**: Any navigation issues

#### Pagination

- [ ] **Tab to pagination controls**
- [ ] **Verify**: Can navigate to all page buttons
- [ ] **Press Enter on page button**
- [ ] **Verify**: Page changes
- [ ] **Verify**: Focus management after page change
- [ ] **Document**: Any issues with pagination

#### Filters and Search

- [ ] **Tab to filter controls**
- [ ] **Verify**: Can interact with all filters
- [ ] **Apply filter using keyboard**
- [ ] **Verify**: Results update
- [ ] **Verify**: Focus management after filter
- [ ] **Document**: Any issues with filters

#### Tooltips and Popovers

- [ ] **Tab to element with tooltip**
- [ ] **Verify**: Tooltip appears on focus
- [ ] **Verify**: Tooltip content is accessible
- [ ] **Tab away**
- [ ] **Verify**: Tooltip disappears
- [ ] **Document**: Any tooltip issues

### Step 4: Test Dynamic Content

#### Loading States

- [ ] **Trigger loading state**
- [ ] **Verify**: Focus is managed during loading
- [ ] **Verify**: Loading indicator is announced (if using screen reader)
- [ ] **Verify**: Focus returns appropriately after loading
- [ ] **Document**: Any focus management issues

#### Error Messages

- [ ] **Trigger validation error**
- [ ] **Verify**: Error message is keyboard accessible
- [ ] **Verify**: Focus moves to error (or stays on field)
- [ ] **Verify**: Can dismiss error with keyboard
- [ ] **Document**: Any error handling issues

#### Toast Notifications

- [ ] **Trigger toast notification**
- [ ] **Verify**: Toast is announced (if using screen reader)
- [ ] **Verify**: Can dismiss toast with keyboard (if dismissible)
- [ ] **Verify**: Toast doesn't trap focus
- [ ] **Document**: Any notification issues

## Page-Specific Testing

### Dashboard

**Interactive Elements**:
- Navigation menu
- Statistics cards (if clickable)
- Quick action buttons
- Data tables
- Charts (if interactive)

**Test Scenarios**:
1. Tab through all navigation items
2. Activate quick action buttons
3. Navigate data tables
4. Interact with any charts or graphs

**Expected Tab Order**:
1. Skip link
2. Logo
3. Navigation items
4. Main content
5. Quick actions
6. Data table
7. Footer

### Login Page

**Interactive Elements**:
- Email input
- Password input
- Submit button
- "Forgot password" link (if present)
- "Sign up" link (if present)

**Test Scenarios**:
1. Tab through form fields
2. Enter credentials
3. Submit with Enter key
4. Test validation errors
5. Test "Forgot password" link

**Expected Tab Order**:
1. Email input
2. Password input
3. Submit button
4. Additional links

### Swap Requests List

**Interactive Elements**:
- Filter controls
- Search input
- Table rows
- Action buttons (View, Approve, Reject)
- Pagination controls

**Test Scenarios**:
1. Tab through filters
2. Apply filters with keyboard
3. Navigate table rows
4. Activate action buttons
5. Navigate pagination

**Expected Tab Order**:
1. Search input
2. Filter controls
3. Table rows (or first action button in each row)
4. Pagination controls

### Create Swap Request Form

**Interactive Elements**:
- Target user dropdown
- Requester shift dropdown
- Target shift dropdown
- Date picker
- Reason textarea
- Submit button
- Cancel button

**Test Scenarios**:
1. Tab through all form fields
2. Select options from dropdowns
3. Pick dates with keyboard
4. Enter text in textarea
5. Submit form
6. Cancel form

**Expected Tab Order**:
1. Target user dropdown
2. Requester shift dropdown
3. Target shift dropdown
4. Date picker
5. Reason textarea
6. Submit button
7. Cancel button

### Modal Dialogs

**Interactive Elements**:
- Close button (X)
- Form fields (if present)
- Action buttons (Confirm, Cancel)

**Test Scenarios**:
1. Open modal with keyboard
2. Verify focus moves to modal
3. Tab through modal elements
4. Verify focus trap
5. Close with Escape
6. Verify focus returns

**Expected Behavior**:
- Focus moves to modal on open
- Tab cycles within modal only
- Escape closes modal
- Focus returns to trigger element

## Common Issues and Solutions

### Issue: Element Not Focusable

**Symptoms**:
- Tab skips over element
- Element doesn't receive focus

**Causes**:
- Element is not interactive (div, span)
- Element has `tabindex="-1"`
- Element is hidden or off-screen

**Solutions**:
```tsx
// Make div focusable and interactive
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click me
</div>

// Or use proper semantic HTML
<button onClick={handleClick}>
  Click me
</button>
```

### Issue: Poor Focus Indicator

**Symptoms**:
- Can't see which element has focus
- Focus indicator is too subtle

**Causes**:
- `outline: none` without replacement
- Low contrast focus styles
- Focus styles removed by CSS reset

**Solutions**:
```css
/* Add visible focus styles */
button:focus,
a:focus,
input:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Or use focus-visible for better UX */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Remove outline for mouse users only */
button:focus:not(:focus-visible) {
  outline: none;
}
```

### Issue: Illogical Tab Order

**Symptoms**:
- Tab jumps around unexpectedly
- Tab order doesn't match visual order

**Causes**:
- Incorrect DOM order
- Positive `tabindex` values
- CSS positioning changes visual order

**Solutions**:
```tsx
// Fix DOM order to match visual order
// Before (wrong)
<div>
  <button tabIndex={2}>Second</button>
  <button tabIndex={1}>First</button>
</div>

// After (correct)
<div>
  <button>First</button>
  <button>Second</button>
</div>

// Avoid positive tabindex values
// Use 0 or -1 only
```

### Issue: Keyboard Trap

**Symptoms**:
- Can't tab out of element
- Stuck in infinite loop

**Causes**:
- Modal without Escape handler
- Custom widget without proper focus management
- Embedded iframe

**Solutions**:
```tsx
// Add Escape key handler to modal
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [])

// Trap focus within modal
const trapFocus = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }
}
```

### Issue: Focus Not Visible in Modal

**Symptoms**:
- Modal opens but focus unclear
- Tab doesn't seem to work in modal

**Causes**:
- Focus not moved to modal on open
- Focus not trapped in modal
- Background content still focusable

**Solutions**:
```tsx
// Move focus to modal on open
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }
}, [isOpen])

// Return focus on close
const closeModal = () => {
  setIsOpen(false)
  triggerRef.current?.focus()
}

// Make background inert
<div inert={isModalOpen}>
  {/* Background content */}
</div>
```

### Issue: Dropdown Not Keyboard Accessible

**Symptoms**:
- Can't open dropdown with keyboard
- Can't select options with keyboard

**Causes**:
- Custom dropdown without keyboard support
- Missing keyboard event handlers

**Solutions**:
```tsx
// Add keyboard support to custom dropdown
<div
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  tabIndex={0}
  onKeyDown={(e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (isOpen) {
          // Move to next option
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        // Move to previous option
        break
    }
  }}
>
  {/* Dropdown content */}
</div>

// Or use native select element
<select>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

## Testing Checklist

Use this checklist to track testing progress:

### Global Navigation
- [ ] Can tab through all navigation items
- [ ] Can activate navigation items with Enter
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Forms
- [ ] Can tab through all form fields
- [ ] Can enter data in all fields
- [ ] Can submit form with Enter
- [ ] Can clear fields with Escape (if applicable)
- [ ] Validation errors are keyboard accessible
- [ ] Focus moves to errors appropriately

### Modals
- [ ] Can open modal with keyboard
- [ ] Focus moves to modal on open
- [ ] Focus is trapped in modal
- [ ] Can close modal with Escape
- [ ] Focus returns to trigger on close

### Tables
- [ ] Can navigate table with keyboard
- [ ] Can access all interactive elements
- [ ] Tab order is logical

### Interactive Components
- [ ] Dropdowns are keyboard accessible
- [ ] Date pickers are keyboard accessible
- [ ] Checkboxes toggle with Space
- [ ] Radio buttons navigate with Arrow keys
- [ ] Custom controls have keyboard support

### Dynamic Content
- [ ] Focus is managed during loading
- [ ] Error messages are keyboard accessible
- [ ] Toast notifications don't trap focus
- [ ] Dynamic updates don't break keyboard navigation

## Documentation Template

When documenting keyboard navigation issues, use this format:

### Issue Template

```markdown
## Issue: [Brief Description]

**Page**: [Page name]  
**Element**: [Element description or selector]  
**Severity**: [Critical/Serious/Moderate/Minor]  
**WCAG Criterion**: [e.g., 2.1.1 Keyboard]

### Problem
[Detailed description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Impact
[How this affects users]

### Recommended Fix
[Specific solution]

### Code Example
```tsx
// Current code
[Current implementation]

// Proposed fix
[Fixed implementation]
```

### Verification
- [ ] Issue fixed
- [ ] Tested with keyboard only
- [ ] Focus indicator visible
- [ ] No keyboard traps
- [ ] Tab order logical
```

## Best Practices

### Do's

✅ **Use semantic HTML**
- Use `<button>` for buttons
- Use `<a>` for links
- Use `<input>` for form fields
- Use proper heading hierarchy

✅ **Provide visible focus indicators**
- Use outline or box-shadow
- Ensure sufficient contrast (3:1 minimum)
- Don't remove focus styles without replacement

✅ **Maintain logical tab order**
- Match visual order
- Use natural DOM order
- Avoid positive tabindex values

✅ **Support standard keyboard shortcuts**
- Enter to activate
- Space to toggle
- Escape to cancel
- Arrow keys to navigate

✅ **Manage focus appropriately**
- Move focus to modals on open
- Return focus on close
- Trap focus in modals
- Announce dynamic changes

### Don'ts

❌ **Don't use `outline: none` without replacement**
```css
/* Bad */
button:focus {
  outline: none;
}

/* Good */
button:focus-visible {
  outline: 2px solid #0066cc;
}
```

❌ **Don't use positive tabindex values**
```tsx
// Bad
<button tabIndex={1}>First</button>
<button tabIndex={2}>Second</button>

// Good
<button>First</button>
<button>Second</button>
```

❌ **Don't make non-interactive elements clickable**
```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

❌ **Don't forget keyboard event handlers**
```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>
```

❌ **Don't create keyboard traps**
```tsx
// Bad - no way to escape
<div onKeyDown={(e) => e.preventDefault()}>
  Trapped!
</div>

// Good - allow Escape
<div onKeyDown={(e) => {
  if (e.key === 'Escape') {
    close()
  }
}}>
  Can escape!
</div>
```

## Resources

### Tools
- [Keyboard Navigation Bookmarklet](https://accessibility-bookmarklets.org/install.html)
- [Focus Order Bookmarklet](https://khan.github.io/tota11y/)
- [Tab Order Viewer](https://chrome.google.com/webstore/detail/tab-order-viewer/fkbmhfnbfkbkbfkbfkbfkbfkbfkbfkbf)

### Guidelines
- [WCAG 2.1 - Keyboard Accessible](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [WebAIM - Keyboard Accessibility](https://webaim.org/articles/keyboard/)
- [MDN - Keyboard-navigable JavaScript widgets](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets)

### Examples
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Style Guide](https://a11y-style-guide.com/style-guide/)

## Next Steps

1. **Complete keyboard testing** on all pages (Task 10.5)
2. **Document all issues** found during testing
3. **Create GitHub issues** for each problem
4. **Prioritize fixes** by severity
5. **Implement fixes** and re-test
6. **Add to CI/CD** - automated keyboard testing where possible

## Summary

Keyboard navigation testing is essential for accessibility. By following this guide, you can ensure that all users can navigate and interact with the WFM application using only a keyboard.

**Key Takeaways**:
- Test with keyboard only (disconnect mouse)
- Verify tab order is logical
- Ensure focus indicators are visible
- Support standard keyboard shortcuts
- Manage focus in modals and dynamic content
- Document and fix all issues found

For questions or issues, refer to the resources section or consult with the development team.
