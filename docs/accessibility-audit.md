# Accessibility Audit Report

## Executive Summary

This document provides a comprehensive accessibility audit of the WFM (Workforce Management) application against WCAG 2.1 Level AA standards. The audit includes automated testing, manual keyboard navigation, screen reader testing, and color contrast verification.

**Audit Date**: [To be completed]  
**Auditor**: [To be completed]  
**WCAG Version**: 2.1 Level AA  
**Tools Used**: axe DevTools, NVDA Screen Reader, Manual Testing

## Audit Status

⚠️ **Status**: Ready for Execution

This document serves as a template for the accessibility audit. The audit process has been documented and is ready to be performed.

**Prerequisites Completed**:
- ✅ Accessibility testing tools documented (Task 10.1)
- ✅ Tool setup guide created (Task 10.2)
- ✅ Audit process documented (Task 10.3)

**Next Steps**:
1. Run automated audits on all pages using axe DevTools (see instructions below)
2. Perform manual keyboard navigation testing (Task 10.5)
3. Conduct screen reader testing (Task 10.6)
4. Verify color contrast ratios (Task 10.7)
5. Document all findings in this report (Task 10.4)

## Methodology

### Automated Testing

**Tool**: axe DevTools Browser Extension

**Pages Tested**:
- [ ] Dashboard (`/dashboard`)
- [ ] Login (`/login`)
- [ ] Signup (`/signup`)
- [ ] Swap Requests List (`/swap-requests`)
- [ ] Swap Request Detail (`/swap-requests/:id`)
- [ ] Create Swap Request (`/swap-requests/new`)
- [ ] Leave Requests List (`/leave-requests`)
- [ ] Leave Request Detail (`/leave-requests/:id`)
- [ ] Create Leave Request (`/leave-requests/new`)
- [ ] Leave Balances (`/leave-balances`)
- [ ] Schedule (`/schedule`)
- [ ] Schedule Upload (`/schedule/upload`)
- [ ] Settings (`/settings`)
- [ ] Employee Directory (`/headcount`)
- [ ] Employee Detail (`/headcount/:id`)
- [ ] Reports (`/reports`)
- [ ] Unauthorized (`/unauthorized`)

### How to Run the Automated Audit

#### Prerequisites

1. **Install axe DevTools** (see `docs/accessibility-tools-setup.md`)
   - Chrome: [axe DevTools Extension](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
   - Firefox: [axe DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **Prepare test accounts** with different roles:
   - Agent account (for basic user views)
   - Team Leader account (for TL-specific views)
   - WFM account (for admin views)

#### Audit Process for Each Page

For each page listed above, follow these steps:

**Step 1: Navigate to the page**
- Open your browser and go to `http://localhost:5173`
- Log in with the appropriate test account
- Navigate to the specific page you're auditing

**Step 2: Run axe DevTools scan**
1. Open Developer Tools (F12 or right-click → Inspect)
2. Click on the "axe DevTools" tab
3. Click the "Scan ALL of my page" button
4. Wait for the scan to complete (2-5 seconds)

**Step 3: Review and document results**
1. Review the violations by severity:
   - **Critical**: Prevents users from completing tasks
   - **Serious**: Significantly impacts user experience
   - **Moderate**: Creates barriers but has workarounds
   - **Minor**: Causes minor inconvenience

2. For each violation:
   - Click on the issue to see details
   - Note the WCAG criterion violated
   - Review the "Inspect" section to see affected elements
   - Read the "How to Fix" guidance
   - Take screenshots if helpful

3. Export the results:
   - Click the "Export" button
   - Save as CSV or JSON for reference
   - Name the file: `axe-audit-[page-name]-[date].csv`

**Step 4: Document in this report**
- Update the "Findings by Severity" section
- Update the "Findings by Page" section for the specific page
- Add issue IDs, descriptions, and WCAG criteria

**Step 5: Test different states**
- Test with forms filled vs empty
- Test with error states visible
- Test with modals/dialogs open
- Test with loading states
- Test with data present vs empty states

#### Special Considerations

**Dynamic Content**:
- For pages with dynamic content (tables, lists), ensure data is loaded before scanning
- Test both empty states and populated states
- Test pagination controls if present

**Interactive Elements**:
- Test forms in both valid and invalid states
- Test modals and dialogs (scan with them open)
- Test dropdown menus and select elements
- Test date pickers and custom controls

**Role-Based Content**:
- Some pages show different content based on user role
- Audit each page with the appropriate role(s):
  - Agent role: Basic user views
  - TL role: Team leader views with approval capabilities
  - WFM role: Admin views with full access

**Responsive Design**:
- Test at different viewport sizes:
  - Desktop: 1920x1080
  - Tablet: 768x1024
  - Mobile: 375x667
- Some accessibility issues only appear at certain sizes

### Manual Testing

**Keyboard Navigation**:
- Tab order verification
- Enter/Space key activation
- Escape key dismissal
- Arrow key navigation (where applicable)
- Focus indicators visibility

**Screen Reader Testing**:
- NVDA on Windows
- Content announcement
- Form label association
- Error message announcement
- Navigation landmarks

**Color Contrast**:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

## Findings by Severity

### Critical Issues (Blockers)

**Definition**: Issues that prevent users from completing core tasks

| ID | Page | Issue | WCAG Criterion | Impact |
|----|------|-------|----------------|--------|
| [To be filled during audit] | | | | |

**Total Critical Issues**: 0 (pending audit)

### Serious Issues (High Priority)

**Definition**: Issues that significantly impact user experience

| ID | Page | Issue | WCAG Criterion | Impact |
|----|------|-------|----------------|--------|
| [To be filled during audit] | | | | |

**Total Serious Issues**: 0 (pending audit)

### Moderate Issues (Medium Priority)

**Definition**: Issues that create barriers but have workarounds

| ID | Page | Issue | WCAG Criterion | Impact |
|----|------|-------|----------------|--------|
| [To be filled during audit] | | | | |

**Total Moderate Issues**: 0 (pending audit)

### Minor Issues (Low Priority)

**Definition**: Issues that cause minor inconvenience

| ID | Page | Issue | WCAG Criterion | Impact |
|----|------|-------|----------------|--------|
| [To be filled during audit] | | | | |

**Total Minor Issues**: 0 (pending audit)

## Findings by Page

### Dashboard

**Page URL**: `/dashboard`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Export results to `axe-audit-dashboard-[date].csv`
- [ ] Document violations below

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Violation Count**:
- Critical: [To be filled]
- Serious: [To be filled]
- Moderate: [To be filled]
- Minor: [To be filled]

**Keyboard Navigation Checklist**:
- [ ] Tab through all interactive elements
- [ ] Verify tab order is logical (left-to-right, top-to-bottom)
- [ ] Test Enter/Space on buttons and links
- [ ] Verify focus indicators are visible on all elements
- [ ] Test Escape key on any modals/dialogs
- [ ] Verify no keyboard traps

**Keyboard Navigation Results**:
- [ ] All interactive elements accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Issues found (see details below)

**Screen Reader Checklist** (NVDA):
- [ ] Start NVDA and navigate to dashboard
- [ ] Verify page title is announced
- [ ] Use H key to navigate headings (verify hierarchy)
- [ ] Use K key to navigate links (verify descriptive text)
- [ ] Use B key to navigate buttons (verify descriptive text)
- [ ] Tab through interactive elements (verify labels)
- [ ] Verify statistics/metrics are announced clearly
- [ ] Verify any charts/graphs have text alternatives
- [ ] Test any dynamic content updates (verify announcements)

**Screen Reader Results**:
- [ ] All content announced
- [ ] Navigation clear
- [ ] Issues found (see details below)

**Color Contrast Checklist**:
- [ ] Check heading text contrast
- [ ] Check body text contrast
- [ ] Check link text contrast
- [ ] Check button text contrast
- [ ] Check icon contrast (if icons convey meaning)
- [ ] Check status indicators (colors must not be only indicator)

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [e.g., DASH-001] | [Critical/Serious/Moderate/Minor] | [Description] | [e.g., 1.4.3] | [CSS selector or description] | [Remediation steps] |

**Example**:
| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| DASH-001 | Serious | Button missing accessible name | 4.1.2 | `.icon-button` | Add aria-label or visible text |

---

### Login Page

**Page URL**: `/login`  
**User Roles**: Unauthenticated  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Export results to `axe-audit-login-[date].csv`
- [ ] Document violations below

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Violation Count**:
- Critical: [To be filled]
- Serious: [To be filled]
- Moderate: [To be filled]
- Minor: [To be filled]

**Keyboard Navigation Checklist**:
- [ ] Tab through form fields (email, password)
- [ ] Verify tab order: email → password → submit button
- [ ] Test Enter key to submit form
- [ ] Verify focus indicators visible on all fields
- [ ] Test with form validation errors
- [ ] Verify error messages are keyboard accessible

**Keyboard Navigation Results**:
- [ ] All interactive elements accessible
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Issues found (see details below)

**Screen Reader Checklist** (NVDA):
- [ ] Verify page title is announced ("Login - WFM")
- [ ] Tab to email field (verify label is announced)
- [ ] Tab to password field (verify label is announced)
- [ ] Tab to submit button (verify button text)
- [ ] Submit form with errors (verify error messages announced)
- [ ] Verify error messages are associated with fields
- [ ] Verify required field indicators are announced

**Screen Reader Results**:
- [ ] All content announced
- [ ] Form labels properly associated
- [ ] Error messages announced
- [ ] Issues found (see details below)

**Form Accessibility Checklist**:
- [ ] All inputs have associated `<label>` elements
- [ ] Labels use `htmlFor` attribute matching input `id`
- [ ] Required fields indicated (not just with color)
- [ ] Error messages associated with fields (`aria-describedby`)
- [ ] Form has clear submit button
- [ ] Validation errors are clear and actionable

**Color Contrast Checklist**:
- [ ] Check form label text contrast
- [ ] Check input text contrast
- [ ] Check placeholder text contrast (if used)
- [ ] Check button text contrast
- [ ] Check error message text contrast
- [ ] Check link text contrast (e.g., "Forgot password?")

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

---

### Swap Requests Pages

**Pages Audited**:
- Swap Requests List (`/swap-requests`)
- Swap Request Detail (`/swap-requests/:id`)
- Create Swap Request (`/swap-requests/new`)

#### Swap Requests List

**Page URL**: `/swap-requests`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan with empty list
- [ ] Run axe DevTools scan with populated list
- [ ] Test with filters applied
- [ ] Test with pagination controls visible
- [ ] Export results to `axe-audit-swap-requests-list-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Violation Count**:
- Critical: [To be filled]
- Serious: [To be filled]
- Moderate: [To be filled]
- Minor: [To be filled]

**Keyboard Navigation Checklist**:
- [ ] Tab through filter controls
- [ ] Tab through table rows (if table is used)
- [ ] Tab through action buttons (View, Approve, etc.)
- [ ] Tab through pagination controls
- [ ] Test Enter/Space on all interactive elements
- [ ] Verify focus indicators visible
- [ ] Test with keyboard shortcuts (if any)

**Screen Reader Checklist** (NVDA):
- [ ] Verify page title announced
- [ ] Navigate headings with H key
- [ ] If table: Press T to jump to table
- [ ] If table: Verify table headers announced
- [ ] If table: Verify row/column navigation works
- [ ] Tab through list items (verify all info announced)
- [ ] Verify status indicators announced (not just color)
- [ ] Test filter controls (verify labels and current values)
- [ ] Test pagination (verify current page and total pages)

**Table Accessibility Checklist** (if table is used):
- [ ] Table has `<caption>` or `aria-label`
- [ ] Table uses `<thead>`, `<tbody>`, `<th>` correctly
- [ ] Column headers have `scope="col"`
- [ ] Row headers have `scope="row"` (if applicable)
- [ ] Complex tables use `id`/`headers` attributes

**List Accessibility Checklist** (if list is used):
- [ ] List uses semantic HTML (`<ul>`, `<ol>`, or `role="list"`)
- [ ] List items use `<li>` or `role="listitem"`
- [ ] Each item has clear structure
- [ ] Interactive elements within items are accessible

**Filter/Search Accessibility Checklist**:
- [ ] Filter controls have labels
- [ ] Search input has label or aria-label
- [ ] Filter results announced to screen readers
- [ ] Clear/reset button is accessible
- [ ] Applied filters are visible and removable

**Pagination Accessibility Checklist**:
- [ ] Current page is indicated (not just with color)
- [ ] Page buttons have descriptive labels
- [ ] Previous/Next buttons have text or aria-label
- [ ] Disabled buttons indicated properly
- [ ] Keyboard navigation works (Tab, Enter)

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Swap Request Detail

**Page URL**: `/swap-requests/:id`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with different request statuses
- [ ] Test with comments section visible
- [ ] Export results to `axe-audit-swap-request-detail-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Keyboard Navigation Checklist**:
- [ ] Tab through all sections
- [ ] Tab through action buttons (Accept, Approve, Reject)
- [ ] Tab through comment form (if present)
- [ ] Test Enter/Space on buttons
- [ ] Verify focus indicators visible

**Screen Reader Checklist**:
- [ ] Verify page title includes request ID
- [ ] Navigate headings (verify logical hierarchy)
- [ ] Verify all request details announced
- [ ] Verify status is announced clearly
- [ ] Verify dates are announced in readable format
- [ ] Test comment section (verify all comments read)
- [ ] Test action buttons (verify clear labels)

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Create Swap Request

**Page URL**: `/swap-requests/new`  
**User Roles**: Agent  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan with empty form
- [ ] Run axe DevTools scan with validation errors
- [ ] Test with date picker open
- [ ] Test with dropdowns open
- [ ] Export results to `axe-audit-create-swap-request-[date].csv`

**Form Accessibility Checklist**:
- [ ] All form fields have labels
- [ ] Required fields indicated
- [ ] Date picker is keyboard accessible
- [ ] Dropdown/select is keyboard accessible
- [ ] Validation errors are clear
- [ ] Error messages associated with fields
- [ ] Submit button has clear text

**Keyboard Navigation Checklist**:
- [ ] Tab through all form fields
- [ ] Test date picker with keyboard (arrow keys, Enter, Escape)
- [ ] Test dropdown with keyboard (arrow keys, Enter, Escape)
- [ ] Test form submission with Enter key
- [ ] Verify focus management after submission

**Screen Reader Checklist**:
- [ ] Verify all field labels announced
- [ ] Verify required fields indicated
- [ ] Verify field instructions announced
- [ ] Test date picker (verify selected date announced)
- [ ] Test dropdown (verify selected option announced)
- [ ] Submit with errors (verify error messages announced)

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

---

### Leave Requests Pages

**Pages Audited**:
- Leave Requests List (`/leave-requests`)
- Leave Request Detail (`/leave-requests/:id`)
- Create Leave Request (`/leave-requests/new`)

#### Leave Requests List

**Page URL**: `/leave-requests`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan with empty list
- [ ] Run axe DevTools scan with populated list
- [ ] Test with filters applied
- [ ] Test with pagination controls visible
- [ ] Export results to `axe-audit-leave-requests-list-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Keyboard Navigation Checklist**:
- [ ] Tab through filter controls
- [ ] Tab through table/list items
- [ ] Tab through action buttons
- [ ] Tab through pagination controls
- [ ] Verify focus indicators visible

**Screen Reader Checklist**:
- [ ] Verify page title announced
- [ ] Navigate headings with H key
- [ ] Test table/list navigation
- [ ] Verify status indicators announced
- [ ] Test filter controls
- [ ] Test pagination

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Leave Request Detail

**Page URL**: `/leave-requests/:id`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with different request statuses
- [ ] Export results to `axe-audit-leave-request-detail-[date].csv`

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Create Leave Request

**Page URL**: `/leave-requests/new`  
**User Roles**: Agent  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan with empty form
- [ ] Run axe DevTools scan with validation errors
- [ ] Test with date range picker open
- [ ] Export results to `axe-audit-create-leave-request-[date].csv`

**Form Accessibility Checklist**:
- [ ] All form fields have labels
- [ ] Required fields indicated
- [ ] Date range picker is keyboard accessible
- [ ] Leave type dropdown is accessible
- [ ] Validation errors are clear
- [ ] Balance information is announced

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

---

### Schedule Pages

**Pages Audited**:
- Schedule View (`/schedule`)
- Schedule Upload (`/schedule/upload`)

#### Schedule View

**Page URL**: `/schedule`  
**User Roles**: Agent, TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with calendar view visible
- [ ] Test with different date ranges
- [ ] Export results to `axe-audit-schedule-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Calendar Accessibility Checklist**:
- [ ] Calendar has descriptive label
- [ ] Current date is indicated (not just with color)
- [ ] Date navigation is keyboard accessible
- [ ] Selected date is announced to screen readers
- [ ] Shift information is accessible
- [ ] Date picker (if present) is keyboard accessible

**Keyboard Navigation Checklist**:
- [ ] Tab through date navigation controls
- [ ] Test arrow keys for date navigation (if supported)
- [ ] Tab through shift entries
- [ ] Test Enter/Space on interactive elements
- [ ] Verify focus indicators visible

**Screen Reader Checklist**:
- [ ] Verify page title announced
- [ ] Navigate to calendar (verify structure announced)
- [ ] Test date navigation (verify dates announced)
- [ ] Verify shift information announced
- [ ] Test any filters or controls

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Schedule Upload

**Page URL**: `/schedule/upload`  
**User Roles**: WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with file selected
- [ ] Test with upload errors
- [ ] Export results to `axe-audit-schedule-upload-[date].csv`

**File Upload Accessibility Checklist**:
- [ ] File input has label
- [ ] File input is keyboard accessible
- [ ] Selected file name is announced
- [ ] Upload button has clear text
- [ ] Upload progress is announced
- [ ] Success/error messages are announced
- [ ] Instructions are clear and accessible

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

---

### Settings Page

**Page URL**: `/settings`  
**User Roles**: WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with different settings sections
- [ ] Test with toggle switches in different states
- [ ] Export results to `axe-audit-settings-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Form Controls Accessibility Checklist**:
- [ ] All form controls have labels
- [ ] Toggle switches have accessible names
- [ ] Toggle state is announced (on/off)
- [ ] Checkboxes have labels
- [ ] Radio buttons have labels and grouping
- [ ] Save button has clear text

**Keyboard Navigation Checklist**:
- [ ] Tab through all settings controls
- [ ] Test Space key on checkboxes and toggles
- [ ] Test arrow keys on radio button groups
- [ ] Test Enter key on save button
- [ ] Verify focus indicators visible

**Screen Reader Checklist**:
- [ ] Verify page title announced
- [ ] Navigate headings (verify sections clear)
- [ ] Test each control (verify label and state)
- [ ] Test toggle switches (verify on/off announced)
- [ ] Verify help text is announced
- [ ] Test save confirmation

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

---

### Headcount Pages

**Pages Audited**:
- Employee Directory (`/headcount`)
- Employee Detail (`/headcount/:id`)

#### Employee Directory

**Page URL**: `/headcount`  
**User Roles**: TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan with empty list
- [ ] Run axe DevTools scan with populated list
- [ ] Test with search/filter active
- [ ] Export results to `axe-audit-headcount-[date].csv`

**Automated Audit Results**:
- [ ] No violations found
- [ ] Violations found (see details below)

**Table/List Accessibility Checklist**:
- [ ] Table/list has descriptive label
- [ ] Headers are properly marked
- [ ] Search input has label
- [ ] Filter controls are accessible
- [ ] Action buttons have clear labels

**Keyboard Navigation Checklist**:
- [ ] Tab through search/filter controls
- [ ] Tab through table rows
- [ ] Tab through action buttons
- [ ] Verify focus indicators visible

**Screen Reader Checklist**:
- [ ] Verify page title announced
- [ ] Test table navigation
- [ ] Verify employee information announced
- [ ] Test search functionality
- [ ] Test filter controls

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

#### Employee Detail

**Page URL**: `/headcount/:id`  
**User Roles**: TL, WFM  
**Audit Date**: [To be completed]  
**Auditor**: [To be completed]

**Automated Audit Checklist**:
- [ ] Run axe DevTools scan
- [ ] Test with edit mode active (if applicable)
- [ ] Export results to `axe-audit-employee-detail-[date].csv`

**Issues Found**:

| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| [To be filled during audit] | | | | | |

## Color Contrast Analysis

### Text Contrast

| Element | Foreground | Background | Ratio | Pass/Fail | Notes |
|---------|-----------|------------|-------|-----------|-------|
| [To be filled during audit] | | | | | |

### UI Component Contrast

| Component | Foreground | Background | Ratio | Pass/Fail | Notes |
|-----------|-----------|------------|-------|-----------|-------|
| [To be filled during audit] | | | | | |

## WCAG 2.1 Level AA Compliance

### Perceivable

- [ ] **1.1.1 Non-text Content**: All images have alt text
- [ ] **1.2.1 Audio-only and Video-only**: N/A (no audio/video content)
- [ ] **1.3.1 Info and Relationships**: Semantic HTML used correctly
- [ ] **1.3.2 Meaningful Sequence**: Reading order is logical
- [ ] **1.3.3 Sensory Characteristics**: Instructions don't rely solely on sensory characteristics
- [ ] **1.4.1 Use of Color**: Color not used as only visual means
- [ ] **1.4.2 Audio Control**: N/A (no auto-playing audio)
- [ ] **1.4.3 Contrast (Minimum)**: Text contrast meets 4.5:1 ratio
- [ ] **1.4.4 Resize Text**: Text can be resized to 200%
- [ ] **1.4.5 Images of Text**: No images of text used

### Operable

- [ ] **2.1.1 Keyboard**: All functionality available via keyboard
- [ ] **2.1.2 No Keyboard Trap**: No keyboard traps present
- [ ] **2.2.1 Timing Adjustable**: N/A (no time limits)
- [ ] **2.2.2 Pause, Stop, Hide**: N/A (no auto-updating content)
- [ ] **2.3.1 Three Flashes**: No flashing content
- [ ] **2.4.1 Bypass Blocks**: Skip links or landmarks provided
- [ ] **2.4.2 Page Titled**: All pages have descriptive titles
- [ ] **2.4.3 Focus Order**: Focus order is logical
- [ ] **2.4.4 Link Purpose**: Link purpose clear from text
- [ ] **2.4.5 Multiple Ways**: Multiple ways to find pages
- [ ] **2.4.6 Headings and Labels**: Headings and labels are descriptive
- [ ] **2.4.7 Focus Visible**: Focus indicators are visible

### Understandable

- [ ] **3.1.1 Language of Page**: Page language specified
- [ ] **3.2.1 On Focus**: No unexpected context changes on focus
- [ ] **3.2.2 On Input**: No unexpected context changes on input
- [ ] **3.2.3 Consistent Navigation**: Navigation is consistent
- [ ] **3.2.4 Consistent Identification**: Components identified consistently
- [ ] **3.3.1 Error Identification**: Errors are identified clearly
- [ ] **3.3.2 Labels or Instructions**: Form labels and instructions provided
- [ ] **3.3.3 Error Suggestion**: Error correction suggestions provided
- [ ] **3.3.4 Error Prevention**: Important actions can be reversed

### Robust

- [ ] **4.1.1 Parsing**: HTML is valid
- [ ] **4.1.2 Name, Role, Value**: UI components have accessible names
- [ ] **4.1.3 Status Messages**: Status messages announced to screen readers

## Summary Statistics

**Total Issues**: 0 (pending audit)
- Critical: 0
- Serious: 0
- Moderate: 0
- Minor: 0

**WCAG 2.1 AA Compliance**: Pending audit
- Perceivable: 0/10 criteria met
- Operable: 0/11 criteria met
- Understandable: 0/9 criteria met
- Robust: 0/3 criteria met

**Overall Compliance**: 0% (pending audit)

## Recommendations

### Immediate Actions (Critical Issues)

[To be filled after audit]

### Short-term Actions (Serious Issues)

[To be filled after audit]

### Medium-term Actions (Moderate Issues)

[To be filled after audit]

### Long-term Actions (Minor Issues)

[To be filled after audit]

## Testing Tools Setup

### axe DevTools

1. Install browser extension:
   - Chrome: https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/

2. Open DevTools (F12)
3. Navigate to "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations

### NVDA Screen Reader

1. Download from: https://www.nvaccess.org/download/
2. Install NVDA
3. Start NVDA (Ctrl+Alt+N)
4. Navigate application with:
   - Tab: Move between interactive elements
   - Arrow keys: Read content
   - H: Jump between headings
   - T: Jump between tables
   - F: Jump between form fields

### Color Contrast Checker

1. Use browser DevTools:
   - Chrome: Inspect element → Styles → Color picker → Contrast ratio
   - Firefox: Inspect element → Accessibility → Color contrast

2. Or use online tools:
   - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - Coolors Contrast Checker: https://coolors.co/contrast-checker

## Next Steps

1. **Complete Audit** (Task 10.3-10.10)
   - Run automated tests on all pages
   - Perform manual keyboard navigation
   - Conduct screen reader testing
   - Verify color contrast

2. **Document Findings** (Task 10.4)
   - Fill in all sections of this report
   - Categorize issues by severity
   - Add screenshots where helpful

3. **Create Remediation Plan** (Task 10.11)
   - Prioritize issues
   - Estimate effort
   - Create GitHub issues
   - Set timeline

4. **Implement Fixes** (Task 10.12)
   - Address critical issues first
   - Test fixes with accessibility tools
   - Re-run audit to verify

5. **Ongoing Monitoring**
   - Add accessibility checks to CI/CD
   - Include in code review checklist
   - Regular audits (quarterly)

## Expected Output Format

### Documenting Violations

When documenting violations found during the audit, use the following format:

#### Issue ID Format
- Use page abbreviation + sequential number
- Examples: `DASH-001`, `LOGIN-001`, `SWAP-LIST-001`

#### Severity Definitions

**Critical (Blocker)**:
- Prevents users from completing core tasks
- Examples:
  - Form cannot be submitted with keyboard
  - Required content not accessible to screen readers
  - Color contrast below 3:1 for large text or UI components

**Serious (High Priority)**:
- Significantly impacts user experience
- Examples:
  - Missing form labels
  - Incorrect heading hierarchy
  - Missing alt text on informative images
  - Color contrast below 4.5:1 for normal text

**Moderate (Medium Priority)**:
- Creates barriers but has workarounds
- Examples:
  - Redundant or conflicting ARIA
  - Missing skip links
  - Non-descriptive link text ("click here")
  - Focus indicators not clearly visible

**Minor (Low Priority)**:
- Causes minor inconvenience
- Examples:
  - Missing lang attribute
  - Non-semantic HTML (divs instead of buttons)
  - Missing page titles
  - Decorative images with alt text

#### Issue Documentation Template

For each issue found, document the following:

```markdown
| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| DASH-001 | Serious | Button missing accessible name | 4.1.2 | `.icon-button` at line 45 | Add aria-label="Close dialog" to button |
```

**Fields Explanation**:
- **ID**: Unique identifier (page-###)
- **Severity**: Critical/Serious/Moderate/Minor
- **Issue**: Brief description of the problem
- **WCAG**: WCAG 2.1 success criterion violated (e.g., 1.4.3, 2.1.1)
- **Element**: CSS selector or description of affected element
- **How to Fix**: Specific remediation steps

#### Detailed Issue Documentation

For complex issues, add a detailed section:

```markdown
### Issue: DASH-001 - Button Missing Accessible Name

**Severity**: Serious  
**WCAG Criterion**: 4.1.2 Name, Role, Value  
**Impact**: Screen reader users cannot understand button purpose

**Location**:
- File: `src/components/Dashboard.tsx`
- Line: 45
- Element: `<button className="icon-button">`

**Current Code**:
```tsx
<button className="icon-button" onClick={handleClose}>
  <XIcon />
</button>
```

**Problem**:
The button contains only an icon with no text content. Screen readers announce "button" but don't indicate what the button does.

**How to Fix**:
Add an aria-label to describe the button's purpose:

```tsx
<button 
  className="icon-button" 
  onClick={handleClose}
  aria-label="Close dialog"
>
  <XIcon aria-hidden="true" />
</button>
```

**Verification**:
1. Run axe DevTools scan - violation should be resolved
2. Test with NVDA - button should announce "Close dialog button"
3. Verify visual appearance unchanged

**Priority**: High (fix in current sprint)
```

### Exporting axe DevTools Results

When exporting results from axe DevTools:

1. **File Naming Convention**:
   - Format: `axe-audit-[page-name]-[date].csv`
   - Examples:
     - `axe-audit-dashboard-2025-01-15.csv`
     - `axe-audit-login-2025-01-15.csv`
     - `axe-audit-swap-requests-list-2025-01-15.csv`

2. **Storage Location**:
   - Create folder: `docs/accessibility-audit-results/`
   - Store all exported files there
   - Add to `.gitignore` if files are large

3. **CSV Format**:
   The exported CSV will contain:
   - Violation ID
   - Impact (Critical/Serious/Moderate/Minor)
   - Description
   - WCAG Criterion
   - HTML Element
   - CSS Selector
   - How to Fix

4. **Processing Results**:
   - Review CSV file
   - Transfer critical and serious issues to this document
   - Create GitHub issues for each violation
   - Link GitHub issues in this document

### Summary Statistics Format

Update the summary statistics section with actual numbers:

```markdown
**Total Issues**: 47
- Critical: 3
- Serious: 12
- Moderate: 18
- Minor: 14

**WCAG 2.1 AA Compliance**: 78%
- Perceivable: 8/10 criteria met (80%)
- Operable: 9/11 criteria met (82%)
- Understandable: 7/9 criteria met (78%)
- Robust: 2/3 criteria met (67%)

**Overall Compliance**: 78% (26/33 criteria met)
```

### Creating GitHub Issues

For each violation, create a GitHub issue:

**Issue Title Format**:
```
[A11y] [Page] Brief description
```

**Examples**:
- `[A11y] [Dashboard] Button missing accessible name`
- `[A11y] [Login] Form labels not associated with inputs`
- `[A11y] [Swap Requests] Table missing headers`

**Issue Template**:
```markdown
## Accessibility Issue

**Page**: Dashboard  
**Severity**: Serious  
**WCAG Criterion**: 4.1.2 Name, Role, Value  
**Audit ID**: DASH-001

### Description
Button contains only an icon with no text content. Screen readers announce "button" but don't indicate what the button does.

### Location
- File: `src/components/Dashboard.tsx`
- Line: 45
- Element: `<button className="icon-button">`

### Current Code
```tsx
<button className="icon-button" onClick={handleClose}>
  <XIcon />
</button>
```

### Expected Fix
Add an aria-label to describe the button's purpose:

```tsx
<button 
  className="icon-button" 
  onClick={handleClose}
  aria-label="Close dialog"
>
  <XIcon aria-hidden="true" />
</button>
```

### Acceptance Criteria
- [ ] Button has accessible name
- [ ] axe DevTools shows no violation
- [ ] NVDA announces "Close dialog button"
- [ ] Visual appearance unchanged

### Priority
High - Fix in current sprint

### Related
- Audit Report: `docs/accessibility-audit.md` (DASH-001)
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/Understanding/name-role-value
```

**Labels**:
- `accessibility`
- `a11y`
- `wcag`
- Severity: `critical`, `high-priority`, `medium-priority`, `low-priority`
- Page: `dashboard`, `login`, `swap-requests`, etc.

### Audit Completion Checklist

Use this checklist to track audit progress:

**Automated Audits** (Task 10.3):
- [ ] Dashboard
- [ ] Login
- [ ] Signup
- [ ] Swap Requests List
- [ ] Swap Request Detail
- [ ] Create Swap Request
- [ ] Leave Requests List
- [ ] Leave Request Detail
- [ ] Create Leave Request
- [ ] Leave Balances
- [ ] Schedule
- [ ] Schedule Upload
- [ ] Settings
- [ ] Employee Directory
- [ ] Employee Detail
- [ ] Reports
- [ ] Unauthorized

**Documentation** (Task 10.4):
- [ ] All violations documented in this report
- [ ] Violations categorized by severity
- [ ] WCAG criteria identified for each violation
- [ ] Remediation steps documented
- [ ] Screenshots added where helpful
- [ ] Summary statistics updated

**Manual Testing** (Tasks 10.5-10.10):
- [ ] Keyboard navigation tested on all pages
- [ ] Screen reader testing completed
- [ ] Color contrast verified
- [ ] Focus indicators checked
- [ ] Form accessibility verified
- [ ] ARIA usage validated

**Remediation Planning** (Task 10.11):
- [ ] GitHub issues created for all violations
- [ ] Issues prioritized by severity
- [ ] Effort estimates added
- [ ] Timeline established
- [ ] Owners assigned

**Validation** (Task 10.12):
- [ ] Critical issues fixed
- [ ] Serious issues fixed
- [ ] Re-audit completed
- [ ] Fixes verified with tools
- [ ] Documentation updated

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/resources/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [Deque University](https://dequeuniversity.com/)
