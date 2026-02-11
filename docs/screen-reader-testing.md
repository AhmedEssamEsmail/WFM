# Screen Reader Testing Process

## Overview

This document provides a comprehensive guide for testing the WFM application with screen readers. Screen reader testing is essential for ensuring that blind and visually impaired users can access and use all features of the application.

**WCAG Criteria**: 1.1.1 Non-text Content, 1.3.1 Info and Relationships, 2.4.6 Headings and Labels, 4.1.2 Name, Role, Value

## Why Screen Reader Testing Matters

- **Accessibility**: Essential for blind and visually impaired users
- **Legal Compliance**: Required for WCAG 2.1 Level AA compliance
- **User Base**: Approximately 2.2% of the population uses screen readers
- **Quality Indicator**: Good screen reader support indicates semantic, well-structured code
- **SEO Benefits**: Screen reader-friendly content is also search engine-friendly

## Screen Reader Options

### NVDA (Recommended for Testing)

**Platform**: Windows  
**Cost**: Free and open-source  
**Download**: [https://www.nvaccess.org/download/](https://www.nvaccess.org/download/)

**Pros**:
- Free and widely used
- Excellent documentation
- Regular updates
- Good browser support

**Cons**:
- Windows only
- Slightly different from JAWS (commercial standard)

### JAWS

**Platform**: Windows  
**Cost**: $95/year (home) or $1,295 (professional)  
**Download**: [https://www.freedomscientific.com/products/software/jaws/](https://www.freedomscientific.com/products/software/jaws/)

**Pros**:
- Industry standard
- Most feature-rich
- Excellent support

**Cons**:
- Expensive
- Steeper learning curve

### VoiceOver

**Platform**: macOS, iOS  
**Cost**: Free (built-in)  
**Activation**: Cmd + F5 (macOS)

**Pros**:
- Built into macOS/iOS
- Good integration with Safari
- Free

**Cons**:
- macOS/iOS only
- Different keyboard shortcuts
- Less commonly used for web testing

### Narrator

**Platform**: Windows  
**Cost**: Free (built-in)  
**Activation**: Ctrl + Win + Enter

**Pros**:
- Built into Windows
- Free
- Improving with each Windows update

**Cons**:
- Less feature-rich than NVDA/JAWS
- Less commonly used
- Limited browser support

## This Guide Focuses on NVDA

This guide uses NVDA as the primary screen reader for testing. If you're using a different screen reader, keyboard shortcuts and behavior may differ.

## Prerequisites

- NVDA installed (see `docs/accessibility-tools-setup.md`)
- Application running locally (`npm run dev`)
- Test accounts for different roles
- Headphones or speakers
- This testing guide
- Patience (screen reader testing takes time!)

## Essential NVDA Keyboard Shortcuts

### Basic Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + N` | Start NVDA |
| `NVDA + Q` | Quit NVDA (then Enter to confirm) |
| `Ctrl` | Stop reading |
| `NVDA + Down Arrow` | Read all from cursor |
| `Down Arrow` | Read next line |
| `Up Arrow` | Read previous line |
| `Right Arrow` | Read next character |
| `Left Arrow` | Read previous character |
| `Ctrl + Right Arrow` | Read next word |
| `Ctrl + Left Arrow` | Read previous word |

**Note**: NVDA key is typically `Insert` or `CapsLock` (configurable in settings)

### Quick Navigation Keys

| Key | Action |
|-----|--------|
| `H` | Next heading |
| `Shift + H` | Previous heading |
| `1-6` | Next heading of level 1-6 |
| `K` | Next link |
| `Shift + K` | Previous link |
| `B` | Next button |
| `Shift + B` | Previous button |
| `F` | Next form field |
| `Shift + F` | Previous form field |
| `T` | Next table |
| `Shift + T` | Previous table |
| `L` | Next list |
| `Shift + L` | Previous list |
| `I` | Next list item |
| `Shift + I` | Previous list item |
| `D` | Next landmark |
| `Shift + D` | Previous landmark |
| `G` | Next graphic (image) |
| `Shift + G` | Previous graphic |

### Forms and Tables

| Shortcut | Action |
|----------|--------|
| `Tab` | Next form field |
| `Shift + Tab` | Previous form field |
| `Space` | Toggle checkbox/button |
| `Arrow Keys` | Navigate radio buttons/select options |
| `Ctrl + Alt + Arrow Keys` | Navigate table cells |
| `Ctrl + Alt + Home` | First cell in table |
| `Ctrl + Alt + End` | Last cell in table |

### Lists and Dialogs

| Shortcut | Action |
|----------|--------|
| `NVDA + F7` | Elements list (links, headings, landmarks) |
| `NVDA + Space` | Toggle browse/focus mode |
| `Escape` | Exit focus mode |

### Speech Control

| Shortcut | Action |
|----------|--------|
| `NVDA + S` | Toggle speech mode (off/beep/talk) |
| `NVDA + Ctrl + Up Arrow` | Increase speech rate |
| `NVDA + Ctrl + Down Arrow` | Decrease speech rate |
| `NVDA + Ctrl + Left Arrow` | Previous voice setting |
| `NVDA + Ctrl + Right Arrow` | Next voice setting |

## Browse Mode vs Focus Mode

### Browse Mode (Default)

- Used for reading content
- Quick navigation keys work (H, K, B, etc.)
- Arrow keys read content
- Best for navigating pages

### Focus Mode

- Used for interacting with forms
- Quick navigation keys don't work
- Arrow keys move within controls
- Automatically activated when entering form fields
- Toggle manually with `NVDA + Space`

**When to Use Each**:
- **Browse Mode**: Reading content, navigating page structure
- **Focus Mode**: Filling out forms, interacting with widgets

## Testing Process

### Step 1: Prepare for Testing

1. **Start NVDA**
   ```
   Press Ctrl + Alt + N
   ```
   NVDA will start speaking immediately

2. **Adjust speech rate** (if needed)
   ```
   NVDA + Ctrl + Up/Down Arrow
   ```

3. **Open the application**
   - Start browser (Chrome or Firefox recommended)
   - Navigate to `http://localhost:5173`

4. **Prepare for testing**
   - Have test data ready
   - Know what content to expect
   - Have this guide open for reference

### Step 2: Test Page Structure

#### A. Page Title

- [ ] **Navigate to page**
- [ ] **Listen for page title announcement**
- [ ] **Verify**: Page title is descriptive and unique
- [ ] **Verify**: Page title includes app name
- [ ] **Document**: Any missing or poor page titles

**Good Page Titles**:
- "Dashboard - WFM"
- "Swap Requests - WFM"
- "Create Leave Request - WFM"

**Poor Page Titles**:
- "WFM" (not descriptive)
- "Page" (not unique)
- "" (missing)

#### B. Heading Structure

- [ ] **Press H repeatedly** to navigate headings
- [ ] **Verify**: Headings are in logical order (H1 → H2 → H3)
- [ ] **Verify**: No heading levels are skipped
- [ ] **Verify**: Headings describe content sections
- [ ] **Verify**: Only one H1 per page
- [ ] **Document**: Any heading hierarchy issues

**Test with NVDA**:
```
1. Press H to jump to first heading
2. Listen to heading level and text
3. Press H again for next heading
4. Verify logical progression
5. Press Shift + H to go back
```

**Good Heading Structure**:
```
H1: Dashboard
  H2: Quick Actions
  H2: Recent Requests
    H3: Swap Requests
    H3: Leave Requests
  H2: Statistics
```

**Poor Heading Structure**:
```
H1: Dashboard
  H3: Quick Actions (skipped H2)
  H2: Recent Requests (wrong order)
H1: Statistics (multiple H1s)
```

#### C. Landmarks

- [ ] **Press D repeatedly** to navigate landmarks
- [ ] **Verify**: Page has proper landmark regions
- [ ] **Verify**: Landmarks are labeled appropriately
- [ ] **Verify**: Main content is in `<main>` landmark
- [ ] **Document**: Any missing or mislabeled landmarks

**Expected Landmarks**:
- Banner (header)
- Navigation
- Main (main content)
- Complementary (sidebar, if present)
- Contentinfo (footer)

**Test with NVDA**:
```
1. Press D to jump to first landmark
2. Listen to landmark type and label
3. Press D again for next landmark
4. Verify all major sections have landmarks
```

#### D. Lists

- [ ] **Press L repeatedly** to navigate lists
- [ ] **Verify**: Lists are announced as lists
- [ ] **Verify**: List item count is announced
- [ ] **Press I** to navigate list items
- [ ] **Verify**: Each item is announced clearly
- [ ] **Document**: Any list structure issues

**Test with NVDA**:
```
1. Press L to jump to first list
2. Listen for "List with X items"
3. Press I to navigate items
4. Verify each item is announced
```

### Step 3: Test Navigation

#### A. Main Navigation

- [ ] **Press K repeatedly** to navigate links
- [ ] **Verify**: All navigation links are announced
- [ ] **Verify**: Link text is descriptive
- [ ] **Verify**: Current page is indicated
- [ ] **Document**: Any navigation issues

**Good Link Text**:
- "Dashboard"
- "Swap Requests"
- "Leave Requests"
- "Settings"

**Poor Link Text**:
- "Click here"
- "More"
- "Link"
- "" (empty)

#### B. Skip Links

- [ ] **Refresh page**
- [ ] **Press Tab once**
- [ ] **Listen for skip link announcement**
- [ ] **Press Enter on skip link**
- [ ] **Verify**: Focus jumps to main content
- [ ] **Document**: Whether skip link is present and functional

**Expected Announcement**:
"Skip to main content, link"

### Step 4: Test Content

#### A. Text Content

- [ ] **Press NVDA + Down Arrow** to read all content
- [ ] **Verify**: All text is read aloud
- [ ] **Verify**: Text is in logical reading order
- [ ] **Verify**: No content is skipped
- [ ] **Document**: Any content that's not announced

**Test Different Content Types**:
- Paragraphs
- Lists
- Tables
- Quotes
- Code blocks

#### B. Images

- [ ] **Press G repeatedly** to navigate images
- [ ] **Verify**: Each image has alt text
- [ ] **Verify**: Alt text is descriptive
- [ ] **Verify**: Decorative images are hidden (alt="")
- [ ] **Document**: Any missing or poor alt text

**Good Alt Text**:
- "User profile photo of John Doe"
- "Chart showing swap request trends"
- "Warning icon"

**Poor Alt Text**:
- "image.png" (filename)
- "img" (not descriptive)
- "picture" (not specific)

**Decorative Images**:
- Should have alt=""
- Should be announced as "graphic" only
- Should not convey information

#### C. Links

- [ ] **Press K repeatedly** to navigate links
- [ ] **Verify**: Link purpose is clear from text
- [ ] **Verify**: Links are distinguishable from buttons
- [ ] **Verify**: External links are indicated (if applicable)
- [ ] **Document**: Any unclear or misleading links

**Test Link Context**:
```
1. Press K to jump to link
2. Listen to link text only
3. Verify you understand where link goes
4. If unclear, listen to surrounding context
```

#### D. Buttons

- [ ] **Press B repeatedly** to navigate buttons
- [ ] **Verify**: Each button has descriptive text
- [ ] **Verify**: Button purpose is clear
- [ ] **Verify**: Icon-only buttons have aria-label
- [ ] **Document**: Any buttons with missing or poor labels

**Good Button Labels**:
- "Submit request"
- "Cancel"
- "Close dialog"
- "Delete request"

**Poor Button Labels**:
- "Button" (not descriptive)
- "" (empty)
- "OK" (too generic)

### Step 5: Test Forms

#### A. Form Fields

- [ ] **Press F repeatedly** to navigate form fields
- [ ] **Verify**: Each field has a label
- [ ] **Verify**: Label is announced before field type
- [ ] **Verify**: Required fields are indicated
- [ ] **Verify**: Field instructions are announced
- [ ] **Document**: Any fields with missing or poor labels

**Expected Announcement**:
"Email, edit, blank" or "Email, required, edit, blank"

**Test Each Field Type**:
- Text inputs
- Textareas
- Dropdowns/selects
- Checkboxes
- Radio buttons
- Date pickers

#### B. Form Instructions

- [ ] **Navigate to form**
- [ ] **Listen for form instructions**
- [ ] **Verify**: Instructions are announced before fields
- [ ] **Verify**: Instructions are clear and helpful
- [ ] **Document**: Any missing or unclear instructions

**Good Instructions**:
- "Select the user you want to swap shifts with"
- "Enter the reason for your leave request (optional)"
- "Choose a date between today and 30 days from now"

#### C. Required Fields

- [ ] **Navigate to required field**
- [ ] **Verify**: "Required" is announced
- [ ] **Verify**: Required indicator is not color-only
- [ ] **Document**: Any required fields not properly indicated

**Expected Announcement**:
"Email, required, edit, blank"

#### D. Field Validation

- [ ] **Submit form with errors**
- [ ] **Verify**: Error message is announced immediately
- [ ] **Verify**: Error message is specific and actionable
- [ ] **Verify**: Focus moves to first error (or stays on field)
- [ ] **Verify**: Error is associated with field
- [ ] **Document**: Any validation issues

**Good Error Messages**:
- "Email is required"
- "Password must be at least 8 characters"
- "Please select a valid date"

**Poor Error Messages**:
- "Error" (not specific)
- "Invalid input" (not actionable)
- "" (empty)

#### E. Dropdowns and Selects

- [ ] **Navigate to dropdown**
- [ ] **Verify**: Label is announced
- [ ] **Verify**: Current selection is announced
- [ ] **Open dropdown** (Space or Enter)
- [ ] **Navigate options** (Arrow keys)
- [ ] **Verify**: Each option is announced
- [ ] **Verify**: Selected option is indicated
- [ ] **Document**: Any dropdown issues

**Expected Announcement**:
"Leave type, combo box, Annual Leave, collapsed"

**Test Interaction**:
```
1. Tab to dropdown
2. Listen to label and current value
3. Press Space to open
4. Press Down Arrow to navigate options
5. Listen to each option
6. Press Enter to select
7. Verify selection is announced
```

#### F. Checkboxes

- [ ] **Navigate to checkbox**
- [ ] **Verify**: Label is announced
- [ ] **Verify**: Checked/unchecked state is announced
- [ ] **Toggle checkbox** (Space)
- [ ] **Verify**: New state is announced
- [ ] **Document**: Any checkbox issues

**Expected Announcement**:
"Auto-approve requests, checkbox, not checked"

#### G. Radio Buttons

- [ ] **Navigate to radio group**
- [ ] **Verify**: Group label is announced
- [ ] **Verify**: Current selection is announced
- [ ] **Navigate options** (Arrow keys)
- [ ] **Verify**: Each option is announced
- [ ] **Verify**: Selected option is indicated
- [ ] **Document**: Any radio button issues

**Expected Announcement**:
"Request type, radio button, Swap Request, 1 of 2"

#### H. Date Pickers

- [ ] **Navigate to date picker**
- [ ] **Verify**: Label is announced
- [ ] **Verify**: Current date is announced (if set)
- [ ] **Open date picker** (Space or Enter)
- [ ] **Navigate dates** (Arrow keys)
- [ ] **Verify**: Dates are announced as you navigate
- [ ] **Select date** (Enter)
- [ ] **Verify**: Selected date is announced
- [ ] **Document**: Any date picker issues

**Expected Announcement**:
"Start date, edit, 01/15/2025"

### Step 6: Test Tables

#### A. Table Structure

- [ ] **Press T** to navigate to table
- [ ] **Verify**: Table is announced as table
- [ ] **Verify**: Row and column count is announced
- [ ] **Verify**: Table has caption or aria-label
- [ ] **Document**: Any table structure issues

**Expected Announcement**:
"Table with 5 rows and 4 columns, Swap Requests"

#### B. Table Headers

- [ ] **Navigate to first cell** (Ctrl + Alt + Home)
- [ ] **Verify**: Column header is announced
- [ ] **Navigate cells** (Ctrl + Alt + Arrow keys)
- [ ] **Verify**: Headers are announced with each cell
- [ ] **Document**: Any header issues

**Expected Announcement**:
"Requester, John Doe" (column header + cell content)

#### C. Table Navigation

- [ ] **Navigate table cells** (Ctrl + Alt + Arrow keys)
- [ ] **Verify**: Can navigate all cells
- [ ] **Verify**: Row and column position is announced
- [ ] **Verify**: Cell content is announced clearly
- [ ] **Document**: Any navigation issues

**Test Navigation**:
```
1. Ctrl + Alt + Home (first cell)
2. Ctrl + Alt + Right Arrow (next column)
3. Ctrl + Alt + Down Arrow (next row)
4. Listen to announcements
5. Verify position and content
```

### Step 7: Test Interactive Components

#### A. Modal Dialogs

- [ ] **Open modal** (with keyboard)
- [ ] **Verify**: Modal opening is announced
- [ ] **Verify**: Focus moves to modal
- [ ] **Verify**: Modal title is announced
- [ ] **Navigate modal content**
- [ ] **Verify**: All content is accessible
- [ ] **Close modal** (Escape)
- [ ] **Verify**: Modal closing is announced
- [ ] **Verify**: Focus returns to trigger
- [ ] **Document**: Any modal issues

**Expected Announcement**:
"Dialog, Confirm Delete Request"

#### B. Toast Notifications

- [ ] **Trigger notification**
- [ ] **Verify**: Notification is announced immediately
- [ ] **Verify**: Message is clear and complete
- [ ] **Verify**: Notification doesn't interrupt current task
- [ ] **Document**: Any notification issues

**Expected Announcement**:
"Success: Request submitted successfully"

**Test Different Types**:
- Success messages
- Error messages
- Warning messages
- Info messages

#### C. Loading States

- [ ] **Trigger loading state**
- [ ] **Verify**: Loading is announced
- [ ] **Wait for content to load**
- [ ] **Verify**: Content loaded is announced
- [ ] **Document**: Any loading state issues

**Expected Announcement**:
"Loading..." then "Content loaded"

#### D. Tabs

- [ ] **Navigate to tab list**
- [ ] **Verify**: Tab list is announced
- [ ] **Verify**: Current tab is announced
- [ ] **Navigate tabs** (Arrow keys)
- [ ] **Verify**: Each tab is announced
- [ ] **Activate tab** (Enter or Space)
- [ ] **Verify**: Tab panel content is announced
- [ ] **Document**: Any tab issues

**Expected Announcement**:
"Pending Requests, tab, 1 of 3, selected"

### Step 8: Test Dynamic Content

#### A. Live Regions

- [ ] **Trigger content update**
- [ ] **Verify**: Update is announced automatically
- [ ] **Verify**: Announcement doesn't interrupt current task
- [ ] **Document**: Any live region issues

**Test Scenarios**:
- Form validation errors
- Search results updating
- Status changes
- New notifications

#### B. Focus Management

- [ ] **Perform action that changes content**
- [ ] **Verify**: Focus is managed appropriately
- [ ] **Verify**: User isn't lost after action
- [ ] **Document**: Any focus management issues

**Test Scenarios**:
- Submitting form
- Deleting item
- Navigating pages
- Opening/closing modals

## Common Issues and Solutions

### Issue: Content Not Announced

**Symptoms**:
- NVDA skips over content
- Content is silent

**Causes**:
- Content is hidden with CSS
- Content has `aria-hidden="true"`
- Content is in `<div>` without role

**Solutions**:
```tsx
// Ensure content is visible
<div>Content here</div>

// Don't hide from screen readers unless decorative
<div aria-hidden="false">Content here</div>

// Use semantic HTML
<p>Content here</p>
```

### Issue: Poor Form Labels

**Symptoms**:
- Field type announced but no label
- Label not associated with field

**Causes**:
- Missing `<label>` element
- Label not using `htmlFor`
- Using placeholder as label

**Solutions**:
```tsx
// Use proper label
<label htmlFor="email">Email</label>
<input type="text" id="email" name="email" />

// Or use aria-label
<input type="text" aria-label="Email" />

// Or use aria-labelledby
<span id="email-label">Email</span>
<input type="text" aria-labelledby="email-label" />
```

### Issue: Button Without Label

**Symptoms**:
- "Button" announced with no description
- Icon-only button not described

**Causes**:
- Button contains only icon
- No text or aria-label

**Solutions**:
```tsx
// Add aria-label
<button aria-label="Close dialog">
  <XIcon />
</button>

// Or add visually hidden text
<button>
  <XIcon />
  <span className="sr-only">Close dialog</span>
</button>

// Or add title (less preferred)
<button title="Close dialog">
  <XIcon />
</button>
```

### Issue: Table Without Headers

**Symptoms**:
- Table cells announced without context
- No column headers announced

**Causes**:
- Using `<div>` instead of `<table>`
- Missing `<th>` elements
- Missing `scope` attribute

**Solutions**:
```tsx
// Use proper table structure
<table>
  <caption>Swap Requests</caption>
  <thead>
    <tr>
      <th scope="col">Requester</th>
      <th scope="col">Target</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Doe</td>
      <td>Jane Smith</td>
      <td>Pending</td>
    </tr>
  </tbody>
</table>
```

### Issue: Modal Not Announced

**Symptoms**:
- Modal opens silently
- Focus doesn't move to modal

**Causes**:
- Missing `role="dialog"`
- Missing `aria-label` or `aria-labelledby`
- Focus not moved to modal

**Solutions**:
```tsx
// Add proper ARIA attributes
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-modal="true"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  {/* Modal content */}
</div>

// Move focus to modal on open
useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus()
  }
}, [isOpen])
```

### Issue: Status Not Announced

**Symptoms**:
- Status changes silently
- Color-only status indicators

**Causes**:
- Status is visual only (color)
- No text alternative
- No ARIA live region

**Solutions**:
```tsx
// Add text status
<span className="status-badge status-approved">
  Approved
</span>

// Or use aria-label
<span 
  className="status-badge status-approved"
  aria-label="Status: Approved"
>
  ✓
</span>

// For dynamic updates, use live region
<div aria-live="polite" aria-atomic="true">
  Status changed to Approved
</div>
```

## Testing Checklist

Use this checklist to track screen reader testing progress:

### Page Structure
- [ ] Page title is descriptive and unique
- [ ] Heading hierarchy is logical (H1 → H2 → H3)
- [ ] Landmarks are present and labeled
- [ ] Lists are properly structured
- [ ] Skip links are present and functional

### Navigation
- [ ] All navigation links are announced
- [ ] Link text is descriptive
- [ ] Current page is indicated
- [ ] Breadcrumbs are accessible (if present)

### Content
- [ ] All text content is announced
- [ ] Images have appropriate alt text
- [ ] Links are distinguishable from buttons
- [ ] Buttons have descriptive labels
- [ ] Content reading order is logical

### Forms
- [ ] All form fields have labels
- [ ] Required fields are indicated
- [ ] Field instructions are announced
- [ ] Validation errors are announced
- [ ] Error messages are specific and actionable
- [ ] Dropdowns are keyboard accessible
- [ ] Checkboxes announce state
- [ ] Radio buttons are grouped properly
- [ ] Date pickers are accessible

### Tables
- [ ] Tables are announced as tables
- [ ] Tables have captions or labels
- [ ] Column headers are announced
- [ ] Row headers are announced (if applicable)
- [ ] Table navigation works correctly

### Interactive Components
- [ ] Modals are announced on open
- [ ] Modal content is accessible
- [ ] Toast notifications are announced
- [ ] Loading states are announced
- [ ] Tabs are properly labeled
- [ ] Tab panels are accessible

### Dynamic Content
- [ ] Content updates are announced
- [ ] Focus is managed appropriately
- [ ] Live regions work correctly
- [ ] Status changes are announced

## Documentation Template

When documenting screen reader issues, use this format:

### Issue Template

```markdown
## Issue: [Brief Description]

**Page**: [Page name]  
**Element**: [Element description]  
**Severity**: [Critical/Serious/Moderate/Minor]  
**WCAG Criterion**: [e.g., 4.1.2 Name, Role, Value]

### Problem
[Detailed description of the issue]

### Steps to Reproduce
1. Start NVDA
2. Navigate to [page]
3. [Specific steps]

### Expected Announcement
[What NVDA should say]

### Actual Announcement
[What NVDA actually says]

### Impact
[How this affects screen reader users]

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
- [ ] Tested with NVDA
- [ ] Announcement is clear
- [ ] No information lost
```

## Best Practices

### Do's

✅ **Use semantic HTML**
- Use proper heading hierarchy
- Use `<button>` for buttons
- Use `<a>` for links
- Use `<table>` for tabular data

✅ **Provide text alternatives**
- Alt text for images
- Labels for form fields
- Aria-labels for icon buttons
- Captions for tables

✅ **Use ARIA appropriately**
- Add roles when semantic HTML isn't enough
- Use aria-label for additional context
- Use aria-live for dynamic updates
- Use aria-describedby for help text

✅ **Manage focus properly**
- Move focus to modals on open
- Return focus on close
- Announce dynamic changes
- Maintain logical focus order

✅ **Test with real screen readers**
- Don't rely on automated tools alone
- Test with NVDA or JAWS
- Test critical user flows
- Document all issues found

### Don'ts

❌ **Don't use placeholder as label**
```tsx
// Bad
<input type="text" placeholder="Email" />

// Good
<label htmlFor="email">Email</label>
<input type="text" id="email" placeholder="e.g., john@example.com" />
```

❌ **Don't hide content from screen readers unnecessarily**
```tsx
// Bad
<div aria-hidden="true">Important content</div>

// Good
<div>Important content</div>

// Only hide decorative content
<div aria-hidden="true">
  <DecorativeIcon />
</div>
```

❌ **Don't use color alone to convey information**
```tsx
// Bad
<span className="text-red">Error</span>

// Good
<span className="text-red" role="alert">
  Error: Email is required
</span>
```

❌ **Don't create empty links or buttons**
```tsx
// Bad
<button onClick={handleClick}>
  <Icon />
</button>

// Good
<button onClick={handleClick} aria-label="Delete request">
  <Icon />
</button>
```

❌ **Don't use tables for layout**
```tsx
// Bad
<table>
  <tr>
    <td>Navigation</td>
    <td>Content</td>
  </tr>
</table>

// Good
<div className="layout">
  <nav>Navigation</nav>
  <main>Content</main>
</div>
```

## Resources

### Screen Readers
- [NVDA Download](https://www.nvaccess.org/download/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Download](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver Guide](https://www.apple.com/voiceover/info/guide/)

### Guidelines
- [WCAG 2.1 - Text Alternatives](https://www.w3.org/WAI/WCAG21/Understanding/text-alternatives)
- [WebAIM - Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Deque - Screen Reader Testing](https://www.deque.com/blog/dont-screen-readers-read-whats-screen-part-1-punctuation-typographic-symbols/)

### Training
- [WebAIM - Using NVDA](https://webaim.org/articles/nvda/)
- [Deque University - Screen Reader Testing](https://dequeuniversity.com/screenreaders/)
- [A11ycasts - Screen Reader Basics](https://www.youtube.com/watch?v=dEbl5jvLKGQ)

## Next Steps

1. **Install NVDA** (if not already installed)
2. **Practice basic navigation** with NVDA
3. **Test each page** following this guide
4. **Document all issues** found
5. **Create GitHub issues** for each problem
6. **Prioritize fixes** by severity
7. **Implement fixes** and re-test
8. **Add to testing process** - test with screen reader for all new features

## Summary

Screen reader testing is essential for ensuring that blind and visually impaired users can access and use the WFM application. By following this guide and testing with NVDA, you can identify and fix accessibility issues that automated tools might miss.

**Key Takeaways**:
- Test with real screen readers (NVDA recommended)
- Verify all content is announced
- Ensure form fields have labels
- Check heading hierarchy
- Test interactive components
- Document and fix all issues found

For questions or issues, refer to the resources section or consult with the development team.
