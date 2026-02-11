# Accessibility Testing Tools Setup Guide

This guide provides step-by-step instructions for installing and configuring accessibility testing tools for the WFM application. These tools are essential for ensuring WCAG 2.1 Level AA compliance.

## Overview

We use three primary tools for accessibility testing:

1. **axe DevTools** - Automated accessibility testing browser extension
2. **NVDA Screen Reader** - Free, open-source screen reader for manual testing
3. **eslint-plugin-jsx-a11y** - Accessibility linter for React/JSX code

## 1. axe DevTools Browser Extension

axe DevTools is a powerful browser extension that automatically scans web pages for accessibility issues and provides detailed reports with remediation guidance.

### Installation

#### Chrome/Edge
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
2. Click "Add to Chrome" or "Add to Edge"
3. Confirm the installation when prompted
4. The axe DevTools icon will appear in your browser toolbar

#### Firefox
1. Visit the [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
2. Click "Add to Firefox"
3. Confirm the installation when prompted
4. The axe DevTools icon will appear in your browser toolbar

### Usage

1. **Open Developer Tools**: Press `F12` or right-click and select "Inspect"
2. **Navigate to axe DevTools tab**: Look for the "axe DevTools" tab in the developer tools panel
3. **Run a scan**:
   - Click the "Scan ALL of my page" button
   - Wait for the scan to complete (usually 2-5 seconds)
4. **Review results**:
   - Issues are categorized by severity: Critical, Serious, Moderate, Minor
   - Each issue includes:
     - Description of the problem
     - WCAG success criteria violated
     - Affected elements (highlighted in the page)
     - Remediation guidance
     - Code snippets showing the issue

### Best Practices

- **Scan every page**: Run axe DevTools on all major pages and user flows
- **Fix critical issues first**: Prioritize by severity (Critical → Serious → Moderate → Minor)
- **Re-scan after fixes**: Verify that fixes resolve the issues without introducing new ones
- **Export reports**: Use the export feature to save results for documentation

### Key Features

- **Intelligent Guided Tests**: Step-by-step guidance for manual testing
- **Element Highlighting**: Visual indicators show exactly where issues occur
- **Best Practice Rules**: Checks beyond WCAG requirements
- **Export Options**: Save results as CSV, JSON, or HTML

## 2. NVDA Screen Reader

NVDA (NonVisual Desktop Access) is a free, open-source screen reader for Windows. It's the most popular free screen reader and is widely used for accessibility testing.

### System Requirements

- **Operating System**: Windows 7 SP1 or later (Windows 10/11 recommended)
- **RAM**: 512 MB minimum (1 GB recommended)
- **Disk Space**: 100 MB
- **Audio**: Sound card and speakers/headphones

### Installation

1. **Download NVDA**:
   - Visit [https://www.nvaccess.org/download/](https://www.nvaccess.org/download/)
   - Click "Download" to get the latest stable version
   - The file will be named something like `nvda_2024.1.exe`

2. **Run the installer**:
   - Double-click the downloaded file
   - Click "Yes" if prompted by User Account Control
   - Select your preferred language
   - Read and accept the license agreement

3. **Choose installation type**:
   - **Install NVDA on this computer** (recommended for regular testing)
   - Create portable copy (for USB drive usage)
   - Continue directly (temporary use without installation)

4. **Complete installation**:
   - Choose installation location (default is recommended)
   - Select whether to create desktop shortcut
   - Select whether to start NVDA after installation
   - Click "Install"

5. **Initial setup**:
   - NVDA will start speaking immediately after installation
   - Follow the welcome dialog to configure basic settings
   - Choose keyboard layout (laptop or desktop)
   - Select whether NVDA should start automatically

### Basic Usage

#### Starting and Stopping NVDA

- **Start**: Press `Ctrl + Alt + N` or use the desktop shortcut
- **Stop**: Press `NVDA + Q` (then press Enter to confirm)
  - NVDA key is typically `Insert` or `CapsLock` (configurable)

#### Essential Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Stop/Start reading | `Ctrl` |
| Read next line | `Down Arrow` |
| Read previous line | `Up Arrow` |
| Read next word | `Ctrl + Right Arrow` |
| Read previous word | `Ctrl + Left Arrow` |
| Read next character | `Right Arrow` |
| Read previous character | `Left Arrow` |
| Read current line | `NVDA + Up Arrow` |
| Read all from cursor | `NVDA + Down Arrow` |
| Navigate to next heading | `H` |
| Navigate to next link | `K` |
| Navigate to next button | `B` |
| Navigate to next form field | `F` |
| List all links | `NVDA + F7` |
| List all headings | `NVDA + F7` (then select Headings) |
| Toggle browse/focus mode | `NVDA + Space` |

#### Testing Web Applications

1. **Open your browser** (Chrome, Firefox, or Edge)
2. **Start NVDA** if not already running
3. **Navigate to your application**
4. **Test navigation**:
   - Use `Tab` to move through interactive elements
   - Use `H` to jump between headings
   - Use `K` to jump between links
   - Use `B` to jump between buttons
   - Use `F` to jump between form fields

5. **Test forms**:
   - Verify labels are announced for each field
   - Verify required fields are indicated
   - Verify error messages are announced
   - Verify instructions are provided

6. **Test dynamic content**:
   - Verify ARIA live regions announce updates
   - Verify modal dialogs are announced
   - Verify loading states are communicated

### Testing Checklist

When testing with NVDA, verify:

- [ ] All text content is read aloud
- [ ] All images have meaningful alt text (or are marked decorative)
- [ ] All form fields have associated labels
- [ ] All buttons and links have descriptive text
- [ ] Heading hierarchy is logical (H1 → H2 → H3, no skipping)
- [ ] Navigation landmarks are announced (navigation, main, footer)
- [ ] Error messages are announced immediately
- [ ] Loading states are communicated
- [ ] Modal dialogs trap focus and announce properly
- [ ] Tables have proper headers and structure
- [ ] Lists are announced as lists
- [ ] Dynamic content updates are announced

### Common Issues and Solutions

**Issue**: NVDA speaks too fast or too slow
- **Solution**: Press `NVDA + Ctrl + Up/Down Arrow` to adjust speech rate

**Issue**: NVDA is reading too much information
- **Solution**: Adjust verbosity in NVDA settings (`NVDA + Ctrl + V`)

**Issue**: Can't hear NVDA
- **Solution**: Check volume mixer, ensure NVDA isn't muted

**Issue**: NVDA conflicts with application shortcuts
- **Solution**: Use `NVDA + Space` to toggle between browse and focus mode

### Alternative: JAWS Screen Reader

JAWS (Job Access With Speech) is a commercial screen reader that's widely used in enterprise environments. While NVDA is sufficient for most testing, JAWS may be required for comprehensive testing.

- **Website**: [https://www.freedomscientific.com/products/software/jaws/](https://www.freedomscientific.com/products/software/jaws/)
- **Cost**: $95/year (home license) or $1,295 (professional license)
- **Free Trial**: 40-minute sessions available without purchase
- **Note**: JAWS is more feature-rich but has a steeper learning curve than NVDA

## 3. Accessibility Linter (eslint-plugin-jsx-a11y)

The `eslint-plugin-jsx-a11y` package provides static analysis of JSX code to catch accessibility issues during development.

### Installation

The linter is already installed in this project as part of the ESLint configuration. To verify:

```bash
npm list eslint-plugin-jsx-a11y
```

You should see output like:
```
wfm-app@0.0.0
└── eslint-plugin-jsx-a11y@6.8.0
```

### Configuration

The linter is configured in `.eslintrc.cjs` with recommended rules:

```javascript
module.exports = {
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // Accessibility rules are enabled by default
    // Customize specific rules here if needed
  }
}
```

### Usage

#### During Development

The linter runs automatically as you code if you have ESLint integration in your editor:

- **VS Code**: Install the "ESLint" extension
- **WebStorm/IntelliJ**: ESLint is built-in
- **Vim/Neovim**: Use ALE or coc-eslint

#### Manual Linting

Run ESLint manually to check all files:

```bash
# Check all files
npm run lint

# Check specific file
npx eslint src/pages/Dashboard.tsx

# Auto-fix issues where possible
npm run lint -- --fix
```

### Common Rules

The linter checks for issues like:

- **Missing alt text**: `<img>` elements must have alt attributes
- **Invalid ARIA**: ARIA attributes must be valid and used correctly
- **Keyboard accessibility**: Interactive elements must be keyboard accessible
- **Form labels**: Form inputs must have associated labels
- **Heading hierarchy**: Headings should be in logical order
- **Link text**: Links must have descriptive text (not "click here")
- **Color contrast**: Warns about potential contrast issues
- **Focus management**: Interactive elements must be focusable

### Example Violations and Fixes

#### Missing Alt Text
```jsx
// ❌ Bad
<img src="logo.png" />

// ✅ Good
<img src="logo.png" alt="Company Logo" />

// ✅ Good (decorative image)
<img src="decoration.png" alt="" role="presentation" />
```

#### Missing Form Label
```jsx
// ❌ Bad
<input type="text" placeholder="Enter name" />

// ✅ Good
<label htmlFor="name">Name</label>
<input type="text" id="name" placeholder="Enter name" />

// ✅ Good (using aria-label)
<input type="text" aria-label="Name" placeholder="Enter name" />
```

#### Non-interactive Element with Click Handler
```jsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>

// ✅ Good (if div is necessary)
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

#### Invalid ARIA
```jsx
// ❌ Bad
<div aria-role="button">Click me</div>

// ✅ Good
<div role="button" tabIndex={0}>Click me</div>
```

## 4. Additional Tools (Optional)

### Lighthouse (Built into Chrome DevTools)

Lighthouse includes an accessibility audit as part of its performance testing.

**Usage**:
1. Open Chrome DevTools (`F12`)
2. Navigate to the "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"

**Benefits**:
- Integrated with Chrome
- Provides performance and SEO audits too
- Generates shareable HTML reports

### Color Contrast Analyzers

#### WebAIM Contrast Checker
- **URL**: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
- **Usage**: Enter foreground and background colors to check contrast ratio
- **Requirement**: 4.5:1 for normal text, 3:1 for large text (WCAG AA)

#### Chrome DevTools Color Picker
- **Usage**: Inspect element → Styles panel → Click color swatch
- **Feature**: Shows contrast ratio and WCAG compliance directly in DevTools

### Browser Extensions

#### WAVE (Web Accessibility Evaluation Tool)
- **Chrome**: [WAVE Extension](https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh)
- **Firefox**: [WAVE Extension](https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/)
- **Features**: Visual feedback, detailed reporting, export options

#### Accessibility Insights
- **Chrome**: [Accessibility Insights](https://chrome.google.com/webstore/detail/accessibility-insights-fo/pbjjkligggfmakdaogkfomddhfmpjeni)
- **Features**: Automated checks, guided manual tests, tab stops visualization

## 5. Testing Workflow

### Recommended Testing Process

1. **During Development**:
   - Use ESLint to catch issues as you code
   - Fix linting errors before committing

2. **Before PR**:
   - Run `npm run lint` to ensure no accessibility errors
   - Manually test with keyboard navigation
   - Run axe DevTools on affected pages

3. **During Code Review**:
   - Reviewer should check for accessibility considerations
   - Verify ARIA attributes are used correctly
   - Verify semantic HTML is used

4. **Before Release**:
   - Run comprehensive axe DevTools scan on all pages
   - Perform NVDA testing on critical user flows
   - Document any known issues with remediation plan

### Testing Priorities

**High Priority** (Test on every change):
- Forms and form validation
- Navigation and routing
- Modal dialogs and overlays
- Error messages and notifications

**Medium Priority** (Test weekly):
- Dashboard and data tables
- Settings and configuration pages
- User profile and account pages

**Low Priority** (Test before major releases):
- Static content pages
- Documentation pages
- Footer and legal pages

## 6. Documentation and Reporting

### Recording Test Results

Use the provided templates:

- **Audit Results**: `docs/accessibility-audit.md`
- **Remediation Plan**: `docs/accessibility-remediation.md`

### Issue Tracking

When you find accessibility issues:

1. **Document in audit report**:
   - Page/component affected
   - Issue description
   - WCAG criteria violated
   - Severity (Critical/High/Medium/Low)

2. **Create GitHub issue**:
   - Use the accessibility issue template
   - Include screenshots or recordings
   - Link to WCAG documentation
   - Assign priority and milestone

3. **Track remediation**:
   - Update remediation plan with fix status
   - Re-test after fixes
   - Document any workarounds or limitations

## 7. Resources and Training

### Official Documentation

- **WCAG 2.1**: [https://www.w3.org/WAI/WCAG21/quickref/](https://www.w3.org/WAI/WCAG21/quickref/)
- **ARIA Authoring Practices**: [https://www.w3.org/WAI/ARIA/apg/](https://www.w3.org/WAI/ARIA/apg/)
- **MDN Accessibility**: [https://developer.mozilla.org/en-US/docs/Web/Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Training Resources

- **WebAIM**: [https://webaim.org/articles/](https://webaim.org/articles/)
- **Deque University**: [https://dequeuniversity.com/](https://dequeuniversity.com/)
- **A11ycasts (YouTube)**: [https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

### Community

- **WebAIM Mailing List**: [https://webaim.org/discussion/](https://webaim.org/discussion/)
- **A11y Slack**: [https://web-a11y.slack.com/](https://web-a11y.slack.com/)
- **Stack Overflow**: Tag questions with `accessibility` or `wcag`

## 8. Troubleshooting

### axe DevTools Issues

**Problem**: Extension not appearing in DevTools
- **Solution**: Restart browser, check extension is enabled in browser settings

**Problem**: Scan not completing
- **Solution**: Try scanning smaller sections, check browser console for errors

**Problem**: False positives in results
- **Solution**: Review carefully, some issues may be valid but not obvious

### NVDA Issues

**Problem**: NVDA not starting
- **Solution**: Check if another screen reader is running, restart computer

**Problem**: NVDA reading too much
- **Solution**: Adjust verbosity settings, use `Ctrl` to stop reading

**Problem**: Can't navigate with keyboard
- **Solution**: Ensure you're in browse mode (`NVDA + Space` to toggle)

### Linter Issues

**Problem**: Too many linting errors
- **Solution**: Fix incrementally, use `--fix` flag for auto-fixable issues

**Problem**: False positives from linter
- **Solution**: Add ESLint disable comments with justification (use sparingly)

**Problem**: Linter not running in editor
- **Solution**: Check ESLint extension is installed and enabled

## Summary

You now have all the tools needed for comprehensive accessibility testing:

1. ✅ **axe DevTools** - Automated scanning and detailed reports
2. ✅ **NVDA** - Manual screen reader testing
3. ✅ **ESLint Plugin** - Static analysis during development

**Next Steps**:
1. Install axe DevTools browser extension
2. Install NVDA screen reader (Windows) or VoiceOver (Mac)
3. Verify ESLint is configured correctly
4. Review the testing workflow
5. Begin accessibility audit (Task 10.3)

For questions or issues with tool setup, please reach out to the development team or consult the resources section above.
