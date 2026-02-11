# ARIA Usage Verification Process

## Overview

This document provides guidance for verifying that ARIA (Accessible Rich Internet Applications) attributes are used correctly in the WFM application. Proper ARIA usage enhances accessibility for assistive technology users.

**WCAG Criteria**: 4.1.2 Name, Role, Value

## ARIA First Rule

**"No ARIA is better than bad ARIA"**

- Use semantic HTML first
- Only add ARIA when semantic HTML isn't enough
- Never use ARIA to override semantic HTML
- Test with screen readers to verify

## Common ARIA Attributes

### Roles

| Role | Purpose | When to Use |
|------|---------|-------------|
| `button` | Identifies button | When using `<div>` as button (prefer `<button>`) |
| `link` | Identifies link | When using `<div>` as link (prefer `<a>`) |
| `dialog` | Identifies modal | For modal dialogs |
| `alert` | Identifies alert | For important messages |
| `navigation` | Identifies navigation | For nav sections (or use `<nav>`) |
| `main` | Identifies main content | For main content (or use `<main>`) |
| `complementary` | Identifies sidebar | For sidebars (or use `<aside>`) |
| `search` | Identifies search | For search forms |
| `tablist`, `tab`, `tabpanel` | Identifies tabs | For tab interfaces |
| `listbox`, `option` | Identifies listbox | For custom select dropdowns |

### States and Properties

| Attribute | Purpose | Values |
|-----------|---------|--------|
| `aria-label` | Provides accessible name | Text string |
| `aria-labelledby` | References label element | ID reference |
| `aria-describedby` | References description | ID reference |
| `aria-hidden` | Hides from screen readers | `true` or `false` |
| `aria-expanded` | Indicates expanded state | `true` or `false` |
| `aria-selected` | Indicates selected state | `true` or `false` |
| `aria-checked` | Indicates checked state | `true`, `false`, or `mixed` |
| `aria-disabled` | Indicates disabled state | `true` or `false` |
| `aria-invalid` | Indicates validation error | `true` or `false` |
| `aria-required` | Indicates required field | `true` or `false` |
| `aria-live` | Announces dynamic changes | `off`, `polite`, or `assertive` |
| `aria-atomic` | Announces entire region | `true` or `false` |
| `aria-current` | Indicates current item | `page`, `step`, `location`, etc. |

## Testing Process

### Step 1: Identify ARIA Usage

**Search for ARIA attributes**:
```bash
# Search codebase for ARIA attributes
grep -r "aria-" src/
```

**Common locations**:
- Custom components
- Interactive widgets
- Dynamic content
- Form fields
- Navigation
- Modals

### Step 2: Verify Each ARIA Attribute

For each ARIA attribute found:

1. **Check if necessary**
   - Could semantic HTML be used instead?
   - Is ARIA adding value?

2. **Check if correct**
   - Is the attribute spelled correctly?
   - Is the value valid?
   - Is it used appropriately?

3. **Check for conflicts**
   - Does it conflict with semantic HTML?
   - Are there redundant ARIA attributes?

4. **Test with screen reader**
   - Does it work as expected?
   - Is the announcement clear?

### Step 3: Common Scenarios

#### Scenario 1: Icon Buttons

**Good Example**:
```tsx
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

**Why**:
- Button has accessible name via `aria-label`
- Icon is hidden from screen readers (decorative)

**Bad Example**:
```tsx
<button>
  <XIcon />
</button>
```

**Why**:
- No accessible name
- Screen reader announces "button" with no context

#### Scenario 2: Modal Dialogs

**Good Example**:
```tsx
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-description">
    Are you sure you want to delete this request?
  </p>
  {/* Dialog content */}
</div>
```

**Why**:
- `role="dialog"` identifies as dialog
- `aria-labelledby` provides accessible name
- `aria-describedby` provides description
- `aria-modal="true"` indicates modal behavior

**Bad Example**:
```tsx
<div className="modal">
  <h2>Confirm Delete</h2>
  <p>Are you sure?</p>
</div>
```

**Why**:
- No role (not identified as dialog)
- No accessible name
- No modal indication

#### Scenario 3: Form Validation

**Good Example**:
```tsx
<label htmlFor="email">Email</label>
<input
  type="email"
  id="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}
```

**Why**:
- `aria-invalid` indicates error state
- `aria-describedby` links to error message
- `role="alert"` announces error immediately

**Bad Example**:
```tsx
<input type="email" className={hasError ? "error" : ""} />
{hasError && <div className="error-text">Invalid email</div>}
```

**Why**:
- No programmatic error indication
- Error not associated with field
- Error not announced to screen readers

#### Scenario 4: Dynamic Content

**Good Example**:
```tsx
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**Why**:
- `aria-live="polite"` announces changes
- `aria-atomic="true"` announces entire region

**Bad Example**:
```tsx
<div>{statusMessage}</div>
```

**Why**:
- Changes not announced to screen readers

#### Scenario 5: Navigation

**Good Example**:
```tsx
<nav aria-label="Main navigation">
  <a href="/dashboard" aria-current="page">Dashboard</a>
  <a href="/requests">Requests</a>
</nav>
```

**Why**:
- `<nav>` provides semantic meaning
- `aria-label` distinguishes from other navs
- `aria-current="page"` indicates current page

**Bad Example**:
```tsx
<div className="nav">
  <a href="/dashboard" className="active">Dashboard</a>
  <a href="/requests">Requests</a>
</div>
```

**Why**:
- No semantic navigation element
- Current page indicated by class only

## Common Issues and Solutions

### Issue: Redundant ARIA

**Problem**: ARIA duplicates semantic HTML

```tsx
// Bad - redundant role
<button role="button">Click me</button>

// Bad - redundant aria-label when text exists
<button aria-label="Submit">Submit</button>
```

**Solution**: Remove redundant ARIA

```tsx
// Good - semantic HTML is enough
<button>Click me</button>

// Good - aria-label only when needed
<button aria-label="Close dialog">
  <XIcon />
</button>
```

### Issue: Conflicting ARIA

**Problem**: ARIA conflicts with semantic HTML

```tsx
// Bad - conflicting role
<button role="link">Click me</button>

// Bad - button with link role
<a role="button" href="/page">Link</a>
```

**Solution**: Use correct semantic HTML

```tsx
// Good - use button
<button onClick={handleClick}>Click me</button>

// Good - use link
<a href="/page">Link</a>
```

### Issue: Invalid ARIA Values

**Problem**: ARIA attribute has invalid value

```tsx
// Bad - invalid aria-expanded value
<button aria-expanded="yes">Expand</button>

// Bad - invalid aria-live value
<div aria-live="immediate">Status</div>
```

**Solution**: Use valid values

```tsx
// Good - valid boolean
<button aria-expanded={isExpanded}>Expand</button>

// Good - valid aria-live value
<div aria-live="assertive">Status</div>
```

### Issue: Missing Required ARIA

**Problem**: Role requires additional ARIA attributes

```tsx
// Bad - dialog without label
<div role="dialog">
  <h2>Title</h2>
</div>

// Bad - tab without tablist
<div role="tab">Tab 1</div>
```

**Solution**: Add required ARIA attributes

```tsx
// Good - dialog with label
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Title</h2>
</div>

// Good - complete tab structure
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
</div>
```

### Issue: Hiding Important Content

**Problem**: Important content hidden from screen readers

```tsx
// Bad - hiding important text
<button>
  <span aria-hidden="true">Submit</span>
</button>

// Bad - hiding error message
<div aria-hidden="true" className="error">
  Email is required
</div>
```

**Solution**: Only hide decorative content

```tsx
// Good - hiding decorative icon
<button>
  Submit
  <Icon aria-hidden="true" />
</button>

// Good - error is announced
<div role="alert">
  Email is required
</div>
```

## ARIA Patterns

### Tabs

```tsx
<div role="tablist" aria-label="Request types">
  <button
    role="tab"
    aria-selected={activeTab === 'pending'}
    aria-controls="pending-panel"
    id="pending-tab"
  >
    Pending
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'approved'}
    aria-controls="approved-panel"
    id="approved-tab"
  >
    Approved
  </button>
</div>

<div
  role="tabpanel"
  id="pending-panel"
  aria-labelledby="pending-tab"
  hidden={activeTab !== 'pending'}
>
  {/* Pending requests */}
</div>
```

### Accordion

```tsx
<div>
  <h3>
    <button
      aria-expanded={isExpanded}
      aria-controls="section1-content"
      id="section1-header"
    >
      Section 1
    </button>
  </h3>
  <div
    id="section1-content"
    role="region"
    aria-labelledby="section1-header"
    hidden={!isExpanded}
  >
    {/* Content */}
  </div>
</div>
```

### Combobox (Dropdown)

```tsx
<label htmlFor="user-select">Select User</label>
<div>
  <input
    type="text"
    role="combobox"
    aria-expanded={isOpen}
    aria-controls="user-listbox"
    aria-autocomplete="list"
    id="user-select"
  />
  <ul
    role="listbox"
    id="user-listbox"
    hidden={!isOpen}
  >
    <li role="option" aria-selected={selected === 'user1'}>
      John Doe
    </li>
    <li role="option" aria-selected={selected === 'user2'}>
      Jane Smith
    </li>
  </ul>
</div>
```

## Best Practices

### Do's

✅ **Use semantic HTML first**
```tsx
// Good - semantic HTML
<button>Click me</button>
<nav>Navigation</nav>
<main>Content</main>
```

✅ **Add ARIA when semantic HTML isn't enough**
```tsx
// Good - ARIA adds value
<button aria-label="Close dialog">
  <XIcon />
</button>
```

✅ **Test with screen readers**
- Verify ARIA works as expected
- Check announcements are clear
- Test all interactive states

✅ **Follow ARIA Authoring Practices**
- Use established patterns
- Include all required attributes
- Test keyboard interaction

### Don'ts

❌ **Don't use ARIA when semantic HTML works**
```tsx
// Bad
<div role="button" tabIndex={0}>Click me</div>

// Good
<button>Click me</button>
```

❌ **Don't create conflicting ARIA**
```tsx
// Bad
<button role="link">Click me</button>

// Good
<button>Click me</button>
```

❌ **Don't hide important content**
```tsx
// Bad
<button aria-hidden="true">Submit</button>

// Good
<button>Submit</button>
```

❌ **Don't use invalid ARIA values**
```tsx
// Bad
<button aria-expanded="yes">Expand</button>

// Good
<button aria-expanded={true}>Expand</button>
```

## Testing Checklist

### ARIA Roles
- [ ] Roles are necessary (semantic HTML not sufficient)
- [ ] Roles are spelled correctly
- [ ] Roles are used appropriately
- [ ] Required ARIA attributes included

### ARIA States and Properties
- [ ] Attributes are necessary
- [ ] Attributes are spelled correctly
- [ ] Values are valid
- [ ] States update dynamically

### ARIA Labels
- [ ] `aria-label` used only when needed
- [ ] `aria-labelledby` references exist
- [ ] `aria-describedby` references exist
- [ ] Labels are descriptive

### ARIA Live Regions
- [ ] Live regions used for dynamic content
- [ ] Politeness level appropriate
- [ ] Announcements are clear
- [ ] Not overused (annoying)

### Screen Reader Testing
- [ ] All ARIA tested with NVDA
- [ ] Announcements are clear
- [ ] No redundant announcements
- [ ] Interactive elements work correctly

## Resources

### Guidelines
- [WCAG 2.1 - Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Using ARIA](https://www.w3.org/TR/using-aria/)

### Tools
- [ARIA Validator](https://www.powermapper.com/tests/screen-readers/aria/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Examples
- [ARIA Examples](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [Inclusive Components](https://inclusive-components.design/)

## Summary

ARIA enhances accessibility when used correctly. Always use semantic HTML first, and only add ARIA when necessary. Test all ARIA with screen readers to ensure it works as expected.

**Key Principles**:
- No ARIA is better than bad ARIA
- Use semantic HTML first
- Only add ARIA when needed
- Test with screen readers
- Follow established patterns

For questions or issues, consult with the development team.
