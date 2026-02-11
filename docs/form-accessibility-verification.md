# Form Accessibility Verification Process

## Overview

This document provides guidance for verifying that all forms in the WFM application are accessible. Accessible forms are essential for all users, especially those using assistive technologies.

**WCAG Criteria**: 1.3.1 Info and Relationships, 3.3.1 Error Identification, 3.3.2 Labels or Instructions, 3.3.3 Error Suggestion, 3.3.4 Error Prevention, 4.1.2 Name, Role, Value

## Form Accessibility Requirements

### Labels (WCAG 3.3.2)

- [ ] All form fields have associated labels
- [ ] Labels are visible (not just placeholders)
- [ ] Labels use `<label>` element with `htmlFor` attribute
- [ ] Labels are descriptive and clear
- [ ] Required fields are indicated

### Instructions (WCAG 3.3.2)

- [ ] Form purpose is clear
- [ ] Field-level instructions provided where needed
- [ ] Format requirements explained (e.g., date format)
- [ ] Instructions are associated with fields

### Error Identification (WCAG 3.3.1)

- [ ] Errors are identified clearly
- [ ] Error messages are specific
- [ ] Errors are associated with fields
- [ ] Errors are announced to screen readers

### Error Suggestion (WCAG 3.3.3)

- [ ] Error messages suggest how to fix
- [ ] Examples provided where helpful
- [ ] Corrections are actionable

### Error Prevention (WCAG 3.3.4)

- [ ] Important actions can be reversed
- [ ] Confirmation required for destructive actions
- [ ] Data is validated before submission
- [ ] Users can review before final submission

## Testing Process

### Step 1: Identify All Forms

**Forms to Test**:
- [ ] Login form
- [ ] Signup form
- [ ] Create swap request form
- [ ] Create leave request form
- [ ] Edit profile form
- [ ] Settings form
- [ ] Search forms
- [ ] Filter forms
- [ ] Upload forms

### Step 2: Test Each Form

For each form, verify:

#### A. Form Labels

**Test**:
1. Inspect each form field
2. Verify `<label>` element exists
3. Verify `htmlFor` matches input `id`
4. Verify label text is descriptive

**Good Example**:
```tsx
<label htmlFor="email">Email Address</label>
<input type="email" id="email" name="email" />
```

**Bad Example**:
```tsx
<input type="email" placeholder="Email" />
```

**Checklist**:
- [ ] All fields have labels
- [ ] Labels use `htmlFor` attribute
- [ ] Label text is descriptive
- [ ] Labels are visible (not hidden)

#### B. Required Fields

**Test**:
1. Identify required fields
2. Verify required indicator is present
3. Verify indicator is not color-only
4. Verify `required` attribute or `aria-required="true"`

**Good Example**:
```tsx
<label htmlFor="email">
  Email Address <span aria-label="required">*</span>
</label>
<input 
  type="email" 
  id="email" 
  name="email" 
  required 
  aria-required="true"
/>
```

**Checklist**:
- [ ] Required fields indicated
- [ ] Indicator is visible
- [ ] Indicator is not color-only
- [ ] `required` or `aria-required` used

#### C. Field Instructions

**Test**:
1. Check for field-level instructions
2. Verify instructions are clear
3. Verify instructions are associated with field

**Good Example**:
```tsx
<label htmlFor="password">Password</label>
<input 
  type="password" 
  id="password" 
  aria-describedby="password-help"
/>
<div id="password-help">
  Must be at least 8 characters with one number and one special character
</div>
```

**Checklist**:
- [ ] Instructions provided where needed
- [ ] Instructions are clear
- [ ] Instructions use `aria-describedby`

#### D. Error Messages

**Test**:
1. Submit form with errors
2. Verify error messages appear
3. Verify errors are specific
4. Verify errors are associated with fields
5. Test with screen reader

**Good Example**:
```tsx
<label htmlFor="email">Email Address</label>
<input 
  type="email" 
  id="email" 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Please enter a valid email address (e.g., john@example.com)
</div>
```

**Checklist**:
- [ ] Errors are identified
- [ ] Error messages are specific
- [ ] Errors use `aria-invalid="true"`
- [ ] Errors use `aria-describedby`
- [ ] Errors have `role="alert"`
- [ ] Errors suggest how to fix

#### E. Form Submission

**Test**:
1. Fill out form
2. Submit with Enter key
3. Verify submission works
4. Check focus management after submission

**Checklist**:
- [ ] Form submits with Enter key
- [ ] Loading state is announced
- [ ] Success message is announced
- [ ] Focus is managed appropriately

#### F. Keyboard Navigation

**Test**:
1. Tab through all form fields
2. Verify tab order is logical
3. Verify all fields are reachable
4. Test with keyboard only

**Checklist**:
- [ ] All fields are keyboard accessible
- [ ] Tab order is logical
- [ ] Can submit with Enter
- [ ] Can cancel with Escape (if applicable)

## Form-Specific Testing

### Login Form

**Fields**:
- Email
- Password

**Test**:
- [ ] Email field has label
- [ ] Password field has label
- [ ] Both fields are required
- [ ] Error messages are specific
- [ ] Can submit with Enter
- [ ] Focus management after submission

**Common Issues**:
- Using placeholder as label
- No error messages
- Generic error ("Invalid credentials")

### Create Swap Request Form

**Fields**:
- Target user (dropdown)
- Requester shift (dropdown)
- Target shift (dropdown)
- Date (date picker)
- Reason (textarea)

**Test**:
- [ ] All fields have labels
- [ ] Required fields indicated
- [ ] Dropdowns are keyboard accessible
- [ ] Date picker is keyboard accessible
- [ ] Error messages are specific
- [ ] Can submit with Enter

**Common Issues**:
- Dropdowns not keyboard accessible
- Date picker not keyboard accessible
- No validation messages

### Create Leave Request Form

**Fields**:
- Leave type (dropdown)
- Start date (date picker)
- End date (date picker)
- Reason (textarea)

**Test**:
- [ ] All fields have labels
- [ ] Required fields indicated
- [ ] Date range validation
- [ ] Balance check message
- [ ] Error messages are specific

**Common Issues**:
- Date validation not clear
- Balance information not announced
- No error prevention

## Common Issues and Solutions

### Issue: Missing Label

**Problem**: Input has no associated label

```tsx
// Bad
<input type="text" placeholder="Email" />
```

**Solution**: Add proper label

```tsx
// Good
<label htmlFor="email">Email</label>
<input type="text" id="email" placeholder="e.g., john@example.com" />
```

### Issue: Placeholder as Label

**Problem**: Using placeholder instead of label

```tsx
// Bad
<input type="text" placeholder="Email Address" />
```

**Solution**: Use label + placeholder

```tsx
// Good
<label htmlFor="email">Email Address</label>
<input type="text" id="email" placeholder="e.g., john@example.com" />
```

### Issue: Generic Error Message

**Problem**: Error message is not specific

```tsx
// Bad
<div>Error: Invalid input</div>
```

**Solution**: Provide specific, actionable error

```tsx
// Good
<div id="email-error" role="alert">
  Please enter a valid email address (e.g., john@example.com)
</div>
```

### Issue: Error Not Associated

**Problem**: Error message not linked to field

```tsx
// Bad
<input type="email" id="email" />
<div>Email is required</div>
```

**Solution**: Associate error with field

```tsx
// Good
<input 
  type="email" 
  id="email" 
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" role="alert">
  Email is required
</div>
```

### Issue: Required Not Indicated

**Problem**: Required fields not marked

```tsx
// Bad
<label htmlFor="email">Email</label>
<input type="email" id="email" required />
```

**Solution**: Add visual and programmatic indicator

```tsx
// Good
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input 
  type="email" 
  id="email" 
  required 
  aria-required="true"
/>
```

## Best Practices

### Do's

✅ **Use proper labels**
```tsx
<label htmlFor="email">Email Address</label>
<input type="email" id="email" />
```

✅ **Indicate required fields**
```tsx
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input type="email" id="email" required aria-required="true" />
```

✅ **Provide helpful instructions**
```tsx
<label htmlFor="password">Password</label>
<input type="password" id="password" aria-describedby="password-help" />
<div id="password-help">
  Must be at least 8 characters
</div>
```

✅ **Show specific error messages**
```tsx
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

✅ **Manage focus appropriately**
```tsx
// Move focus to first error
if (errors.length > 0) {
  firstErrorRef.current?.focus()
}
```

### Don'ts

❌ **Don't use placeholder as label**
```tsx
// Bad
<input type="text" placeholder="Email Address" />
```

❌ **Don't hide labels**
```tsx
// Bad
<label htmlFor="email" className="sr-only">Email</label>
<input type="text" id="email" placeholder="Email" />
```

❌ **Don't use generic errors**
```tsx
// Bad
<div>Error</div>
```

❌ **Don't rely on color alone**
```tsx
// Bad - error indicated by red border only
<input type="email" className="border-red" />
```

## Documentation Template

### Form Accessibility Test Results

| Form | Location | Labels | Required | Instructions | Errors | Pass/Fail | Notes |
|------|----------|--------|----------|--------------|--------|-----------|-------|
| Login | /login | ✅ | ✅ | ✅ | ✅ | ✅ Pass | |
| Create Swap | /swap-requests/new | ✅ | ✅ | ⚠️ | ✅ | ⚠️ Partial | Date picker needs instructions |

### Issue Documentation

```markdown
## Form Accessibility Issue: [Form Name]

**Location**: [Page/URL]  
**Field**: [Field name]  
**Severity**: [Critical/Serious/Moderate]  
**WCAG Criterion**: [e.g., 3.3.2 Labels or Instructions]

### Problem
[Description of the issue]

### Current State
[What currently exists]

### Impact
[How this affects users]

### Recommended Fix
```tsx
// Current
[Current implementation]

// Proposed
[Fixed implementation]
```

### Verification
- [ ] Issue fixed
- [ ] Tested with keyboard
- [ ] Tested with screen reader
- [ ] Error messages are specific
- [ ] Labels are associated
```

## Testing Checklist

### All Forms
- [ ] All fields have labels
- [ ] Labels use `htmlFor` attribute
- [ ] Required fields indicated
- [ ] Instructions provided where needed
- [ ] Error messages are specific
- [ ] Errors are associated with fields
- [ ] Can submit with Enter
- [ ] Focus management works

### Specific Forms
- [ ] Login form
- [ ] Signup form
- [ ] Create swap request
- [ ] Create leave request
- [ ] Edit profile
- [ ] Settings
- [ ] Search forms
- [ ] Filter forms

## Resources

### Guidelines
- [WCAG 2.1 - Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions)
- [WCAG 2.1 - Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification)
- [WebAIM - Creating Accessible Forms](https://webaim.org/techniques/forms/)

### Examples
- [Accessible Form Examples](https://www.w3.org/WAI/tutorials/forms/)
- [Form Validation](https://www.w3.org/WAI/tutorials/forms/validation/)

## Summary

Form accessibility is essential for ensuring all users can complete tasks in the WFM application. All forms must have proper labels, clear instructions, and specific error messages.

**Key Requirements**:
- All fields must have labels
- Required fields must be indicated
- Instructions must be provided where needed
- Error messages must be specific and associated with fields
- Forms must be keyboard accessible

For questions or issues, consult with the development team.
