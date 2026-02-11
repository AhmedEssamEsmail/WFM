# Accessibility Audit Quick Reference Guide

This is a condensed guide for quickly running the accessibility audit. For detailed information, see `docs/accessibility-audit.md`.

## Prerequisites

1. ✅ Install axe DevTools browser extension
2. ✅ Install NVDA screen reader (Windows) or VoiceOver (Mac)
3. ✅ Start the application: `npm run dev`
4. ✅ Have test accounts ready (Agent, TL, WFM roles)

## Quick Audit Process

### For Each Page:

#### 1. Automated Scan (2-5 minutes)

```
1. Navigate to the page
2. Open DevTools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations
6. Export results: "Export" → Save as CSV
7. Name file: axe-audit-[page-name]-[date].csv
```

#### 2. Keyboard Navigation (3-5 minutes)

```
1. Reload page
2. Press Tab repeatedly
   ✓ Can you reach all interactive elements?
   ✓ Is the tab order logical?
   ✓ Are focus indicators visible?
3. Press Enter/Space on buttons and links
   ✓ Do they activate?
4. Press Escape on modals
   ✓ Do they close?
5. Document any issues
```

#### 3. Screen Reader Test (5-10 minutes)

```
1. Start NVDA (Ctrl+Alt+N)
2. Navigate to page
3. Press H repeatedly
   ✓ Are headings announced?
   ✓ Is hierarchy logical?
4. Press Tab repeatedly
   ✓ Are labels announced?
   ✓ Is purpose clear?
5. Test forms (if present)
   ✓ Are labels associated?
   ✓ Are errors announced?
6. Stop NVDA (NVDA+Q)
7. Document any issues
```

#### 4. Document Results (5 minutes)

```
1. Open docs/accessibility-audit.md
2. Find the page section
3. Check off completed items
4. Fill in violation count
5. Add issues to the table
6. Save document
```

## Pages to Audit (17 total)

### Core Pages (Priority 1)
- [ ] Dashboard (`/dashboard`)
- [ ] Login (`/login`)
- [ ] Swap Requests List (`/swap-requests`)
- [ ] Leave Requests List (`/leave-requests`)

### Form Pages (Priority 2)
- [ ] Create Swap Request (`/swap-requests/new`)
- [ ] Create Leave Request (`/leave-requests/new`)
- [ ] Settings (`/settings`)

### Detail Pages (Priority 3)
- [ ] Swap Request Detail (`/swap-requests/:id`)
- [ ] Leave Request Detail (`/leave-requests/:id`)
- [ ] Employee Detail (`/headcount/:id`)

### Additional Pages (Priority 4)
- [ ] Signup (`/signup`)
- [ ] Leave Balances (`/leave-balances`)
- [ ] Schedule (`/schedule`)
- [ ] Schedule Upload (`/schedule/upload`)
- [ ] Employee Directory (`/headcount`)
- [ ] Reports (`/reports`)
- [ ] Unauthorized (`/unauthorized`)

## Common Issues to Look For

### Critical Issues
- ❌ Forms cannot be submitted with keyboard
- ❌ Required content not accessible to screen readers
- ❌ Color contrast below 3:1 for UI components

### Serious Issues
- ⚠️ Missing form labels
- ⚠️ Incorrect heading hierarchy (H1 → H3, skipping H2)
- ⚠️ Missing alt text on informative images
- ⚠️ Color contrast below 4.5:1 for normal text

### Moderate Issues
- ⚠️ Redundant or conflicting ARIA
- ⚠️ Missing skip links
- ⚠️ Non-descriptive link text ("click here")
- ⚠️ Focus indicators not clearly visible

### Minor Issues
- ℹ️ Missing lang attribute
- ℹ️ Non-semantic HTML (divs instead of buttons)
- ℹ️ Decorative images with alt text

## Quick Keyboard Shortcuts

### NVDA
- `Ctrl+Alt+N` - Start NVDA
- `NVDA+Q` - Stop NVDA (NVDA = Insert or CapsLock)
- `H` - Next heading
- `K` - Next link
- `B` - Next button
- `F` - Next form field
- `T` - Next table
- `Ctrl` - Stop reading

### Browser
- `Tab` - Next interactive element
- `Shift+Tab` - Previous interactive element
- `Enter` - Activate link or button
- `Space` - Activate button or checkbox
- `Escape` - Close modal or dialog
- `Arrow keys` - Navigate within component

## Issue Documentation Template

```markdown
| ID | Severity | Issue | WCAG | Element | How to Fix |
|----|----------|-------|------|---------|------------|
| PAGE-001 | Serious | Button missing accessible name | 4.1.2 | `.icon-button` | Add aria-label="Close" |
```

## Time Estimates

- **Per Page**: 15-20 minutes
- **All 17 Pages**: 5-6 hours
- **Documentation**: 2-3 hours
- **Total**: 7-9 hours

## Tips for Efficiency

1. **Batch Similar Pages**: Audit all list pages together, all form pages together
2. **Use Templates**: Copy/paste issue format from previous pages
3. **Take Screenshots**: Capture issues for later reference
4. **Test Multiple States**: Empty vs populated, valid vs error states
5. **Focus on Critical**: Don't get stuck on minor issues during initial audit

## After Audit

1. **Update Summary Statistics** in `docs/accessibility-audit.md`
2. **Create GitHub Issues** for all violations
3. **Create Remediation Plan** in `docs/accessibility-remediation.md`
4. **Prioritize Fixes**: Critical → Serious → Moderate → Minor
5. **Schedule Work**: Add to sprint planning

## Questions?

- See detailed guide: `docs/accessibility-audit.md`
- See tool setup: `docs/accessibility-tools-setup.md`
- See WCAG reference: https://www.w3.org/WAI/WCAG21/quickref/
- Ask team for help!

## Progress Tracking

**Automated Audits**: ___/17 pages complete  
**Keyboard Testing**: ___/17 pages complete  
**Screen Reader Testing**: ___/17 pages complete  
**Documentation**: ___% complete  

**Estimated Completion Date**: ___________
