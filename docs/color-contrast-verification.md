# Color Contrast Verification Process

## Overview

This document provides a comprehensive guide for verifying color contrast in the WFM application. Adequate color contrast is essential for users with low vision, color blindness, and users viewing the application in different lighting conditions.

**WCAG Criteria**: 1.4.3 Contrast (Minimum), 1.4.6 Contrast (Enhanced), 1.4.11 Non-text Contrast

## WCAG 2.1 Level AA Requirements

### Text Contrast

| Text Type | Minimum Ratio | WCAG Level |
|-----------|---------------|------------|
| Normal text (< 18pt or < 14pt bold) | 4.5:1 | AA |
| Large text (≥ 18pt or ≥ 14pt bold) | 3:1 | AA |
| Normal text (enhanced) | 7:1 | AAA |
| Large text (enhanced) | 4.5:1 | AAA |

### Non-Text Contrast

| Element Type | Minimum Ratio | WCAG Level |
|--------------|---------------|------------|
| UI components (buttons, form fields) | 3:1 | AA |
| Graphical objects (icons, charts) | 3:1 | AA |
| Focus indicators | 3:1 | AA |
| Active/hover states | 3:1 | AA |

## Tools for Testing

### Browser DevTools (Recommended)

**Chrome DevTools**:
1. Right-click element → Inspect
2. In Styles panel, click color swatch
3. View contrast ratio in color picker
4. Green checkmark = passes WCAG AA
5. Red X = fails WCAG AA

**Firefox DevTools**:
1. Right-click element → Inspect
2. In Rules panel, click color swatch
3. View contrast ratio in color picker
4. Shows AA and AAA compliance

### Online Tools

**WebAIM Contrast Checker**:
- URL: https://webaim.org/resources/contrastchecker/
- Enter foreground and background colors
- Shows pass/fail for AA and AAA
- Provides suggestions for passing colors

**Coolors Contrast Checker**:
- URL: https://coolors.co/contrast-checker
- Visual interface
- Real-time updates
- Color palette generation

**Contrast Ratio Calculator**:
- URL: https://contrast-ratio.com/
- Simple interface
- Shows exact ratio
- Pass/fail indicators

### Browser Extensions

**axe DevTools**:
- Automatically checks contrast
- Highlights violations
- Provides remediation guidance

**WAVE**:
- Visual feedback on contrast issues
- Shows all text elements
- Color-codes violations

## Testing Process

### Step 1: Identify Elements to Test

**Text Elements**:
- [ ] Headings (H1-H6)
- [ ] Body text
- [ ] Link text
- [ ] Button text
- [ ] Form labels
- [ ] Form input text
- [ ] Placeholder text
- [ ] Error messages
- [ ] Success messages
- [ ] Warning messages
- [ ] Table text
- [ ] List text
- [ ] Navigation text
- [ ] Footer text

**UI Components**:
- [ ] Button borders
- [ ] Form field borders
- [ ] Focus indicators
- [ ] Icons (if they convey meaning)
- [ ] Status indicators
- [ ] Progress bars
- [ ] Badges
- [ ] Tags
- [ ] Dividers

**Interactive States**:
- [ ] Hover states
- [ ] Focus states
- [ ] Active states
- [ ] Disabled states
- [ ] Selected states

### Step 2: Test Each Element

For each element:

1. **Identify colors**:
   - Foreground color (text or icon)
   - Background color

2. **Calculate ratio**:
   - Use browser DevTools or online tool
   - Note the exact ratio

3. **Check compliance**:
   - Normal text: ≥ 4.5:1
   - Large text: ≥ 3:1
   - UI components: ≥ 3:1

4. **Document results**:
   - Element description
   - Colors used
   - Ratio calculated
   - Pass/fail status
   - Remediation needed (if fails)

### Step 3: Test Different States

**Default State**:
- Test normal appearance
- Most common state

**Hover State**:
- Hover over element
- Check contrast of hover colors

**Focus State**:
- Tab to element
- Check focus indicator contrast

**Active State**:
- Click/press element
- Check active state colors

**Disabled State**:
- Check disabled elements
- Note: Disabled elements exempt from contrast requirements

**Selected State**:
- Select element (checkbox, radio, etc.)
- Check selected state colors

### Step 4: Test in Different Contexts

**Light Mode**:
- Test all elements in light theme
- Most common viewing mode

**Dark Mode** (if applicable):
- Test all elements in dark theme
- Ensure contrast maintained

**Different Backgrounds**:
- Test text on various backgrounds
- Check overlays and modals
- Verify transparent backgrounds

## Common Scenarios

### Scenario 1: Body Text

**Element**: Paragraph text  
**Requirement**: 4.5:1 minimum

**Test**:
```
1. Inspect paragraph element
2. Note text color (e.g., #333333)
3. Note background color (e.g., #FFFFFF)
4. Check ratio in DevTools
5. Verify ≥ 4.5:1
```

**Example**:
- Foreground: #333333
- Background: #FFFFFF
- Ratio: 12.63:1
- Result: ✅ Pass (exceeds 4.5:1)

### Scenario 2: Link Text

**Element**: Hyperlink  
**Requirement**: 4.5:1 minimum (against background)

**Test**:
```
1. Inspect link element
2. Note link color (e.g., #0066CC)
3. Note background color (e.g., #FFFFFF)
4. Check ratio
5. Verify ≥ 4.5:1
```

**Additional Check**:
- Links must be distinguishable from surrounding text
- Either by color + another indicator (underline, icon)
- Or by 3:1 contrast ratio between link and surrounding text

**Example**:
- Link color: #0066CC
- Background: #FFFFFF
- Ratio: 7.22:1
- Result: ✅ Pass

### Scenario 3: Button Text

**Element**: Button  
**Requirement**: 4.5:1 minimum (text vs button background)

**Test**:
```
1. Inspect button
2. Note text color (e.g., #FFFFFF)
3. Note button background (e.g., #0066CC)
4. Check ratio
5. Verify ≥ 4.5:1
```

**Also Check**:
- Button border vs page background (3:1 minimum)
- Hover state colors
- Focus indicator

**Example**:
- Text: #FFFFFF
- Button background: #0066CC
- Ratio: 7.22:1
- Result: ✅ Pass

### Scenario 4: Form Input

**Element**: Text input field  
**Requirement**: 
- Text: 4.5:1 vs input background
- Border: 3:1 vs page background

**Test**:
```
1. Inspect input field
2. Check text color vs input background
3. Check border color vs page background
4. Check placeholder text (if used)
5. Check focus state
```

**Example**:
- Input text: #000000
- Input background: #FFFFFF
- Text ratio: 21:1 ✅
- Border: #CCCCCC
- Page background: #FFFFFF
- Border ratio: 1.6:1 ❌ Fail (needs ≥ 3:1)

### Scenario 5: Icon Button

**Element**: Button with icon only  
**Requirement**: 3:1 minimum (icon vs background)

**Test**:
```
1. Inspect icon button
2. Note icon color
3. Note background color
4. Check ratio
5. Verify ≥ 3:1
```

**Example**:
- Icon: #666666
- Background: #FFFFFF
- Ratio: 5.74:1
- Result: ✅ Pass (exceeds 3:1)

### Scenario 6: Status Badge

**Element**: Status indicator (Approved, Pending, etc.)  
**Requirement**: 
- Text: 4.5:1 vs badge background
- Badge: 3:1 vs page background (if border/icon)

**Test**:
```
1. Inspect status badge
2. Check text vs badge background
3. Check badge vs page background
4. Verify status not conveyed by color alone
```

**Example**:
- Text: #FFFFFF
- Badge background: #28A745 (green)
- Text ratio: 4.52:1 ✅
- Badge vs page: 3.12:1 ✅
- Has text label: ✅ (not color-only)

## Documentation Template

### Contrast Test Results

| Element | Location | Foreground | Background | Ratio | Required | Pass/Fail | Notes |
|---------|----------|------------|------------|-------|----------|-----------|-------|
| Body text | All pages | #333333 | #FFFFFF | 12.63:1 | 4.5:1 | ✅ Pass | |
| Link text | All pages | #0066CC | #FFFFFF | 7.22:1 | 4.5:1 | ✅ Pass | |
| Button text | Primary button | #FFFFFF | #0066CC | 7.22:1 | 4.5:1 | ✅ Pass | |
| Input border | Form fields | #CCCCCC | #FFFFFF | 1.6:1 | 3:1 | ❌ Fail | Needs darker border |

### Issue Documentation

```markdown
## Contrast Issue: [Element Name]

**Location**: [Page/component]  
**Element**: [Description]  
**Severity**: [Critical/Serious/Moderate]  
**WCAG Criterion**: 1.4.3 Contrast (Minimum)

### Current Colors
- Foreground: [color code]
- Background: [color code]
- Ratio: [X.XX:1]
- Required: [4.5:1 or 3:1]

### Problem
[Description of the contrast issue]

### Impact
[How this affects users]

### Recommended Fix
- Option 1: Change foreground to [color] (ratio: X.XX:1)
- Option 2: Change background to [color] (ratio: X.XX:1)
- Option 3: [Alternative solution]

### Code Change
```css
/* Current */
.element {
  color: #CCCCCC;
  background: #FFFFFF;
}

/* Proposed */
.element {
  color: #666666;
  background: #FFFFFF;
}
```

### Verification
- [ ] Colors updated
- [ ] Ratio verified ≥ required
- [ ] Visual appearance acceptable
- [ ] Tested in light/dark mode
- [ ] No other elements affected
```

## Common Issues and Solutions

### Issue: Light Gray Text

**Problem**: Light gray text (#999999) on white background  
**Ratio**: 2.85:1  
**Required**: 4.5:1  
**Result**: ❌ Fail

**Solutions**:
- Darken text to #666666 (ratio: 5.74:1) ✅
- Darken text to #595959 (ratio: 7:1) ✅
- Use #767676 for minimum AA (ratio: 4.54:1) ✅

### Issue: Low Contrast Button Border

**Problem**: Light border (#DDDDDD) on white background  
**Ratio**: 1.3:1  
**Required**: 3:1  
**Result**: ❌ Fail

**Solutions**:
- Darken border to #959595 (ratio: 3.04:1) ✅
- Add box-shadow for additional definition
- Increase border width for better visibility

### Issue: Placeholder Text

**Problem**: Placeholder text too light  
**Ratio**: 2.5:1  
**Required**: 4.5:1  
**Result**: ❌ Fail

**Solutions**:
- Darken placeholder color
- Use label instead of placeholder
- Combine label + placeholder

**Note**: Placeholder text should not be the only label!

### Issue: Link Color

**Problem**: Blue link (#3399FF) on white background  
**Ratio**: 4.2:1  
**Required**: 4.5:1  
**Result**: ❌ Fail (close but not enough)

**Solutions**:
- Darken to #0066CC (ratio: 7.22:1) ✅
- Darken to #0056B3 (ratio: 8.59:1) ✅
- Add underline (helps but doesn't fix contrast)

### Issue: Disabled Button

**Problem**: Disabled button has low contrast  
**Ratio**: 2:1  
**Required**: N/A (disabled elements exempt)  
**Result**: ⚠️ Acceptable (but consider improving)

**Note**: While disabled elements are exempt from WCAG contrast requirements, improving their contrast helps all users understand the interface better.

## Color Palette Recommendations

### Text Colors (on white background)

| Color | Hex | Ratio | Use Case |
|-------|-----|-------|----------|
| Black | #000000 | 21:1 | Headings, emphasis |
| Dark gray | #333333 | 12.63:1 | Body text |
| Medium gray | #666666 | 5.74:1 | Secondary text |
| Light gray | #767676 | 4.54:1 | Minimum for AA |

### Link Colors (on white background)

| Color | Hex | Ratio | Use Case |
|-------|-----|-------|----------|
| Dark blue | #0056B3 | 8.59:1 | Primary links |
| Medium blue | #0066CC | 7.22:1 | Standard links |
| Blue | #0077ED | 5.88:1 | Lighter links |

### Button Colors

**Primary Button**:
- Background: #0066CC
- Text: #FFFFFF
- Ratio: 7.22:1 ✅

**Secondary Button**:
- Background: #6C757D
- Text: #FFFFFF
- Ratio: 4.54:1 ✅

**Success Button**:
- Background: #28A745
- Text: #FFFFFF
- Ratio: 4.52:1 ✅

**Danger Button**:
- Background: #DC3545
- Text: #FFFFFF
- Ratio: 5.78:1 ✅

### Status Colors

**Success** (Green):
- Background: #28A745
- Text: #FFFFFF
- Ratio: 4.52:1 ✅

**Warning** (Yellow):
- Background: #FFC107
- Text: #000000
- Ratio: 11.7:1 ✅

**Error** (Red):
- Background: #DC3545
- Text: #FFFFFF
- Ratio: 5.78:1 ✅

**Info** (Blue):
- Background: #17A2B8
- Text: #FFFFFF
- Ratio: 4.52:1 ✅

## Testing Checklist

### Text Elements
- [ ] H1 headings
- [ ] H2 headings
- [ ] H3-H6 headings
- [ ] Body text
- [ ] Link text (default)
- [ ] Link text (hover)
- [ ] Link text (visited)
- [ ] Button text
- [ ] Form labels
- [ ] Form input text
- [ ] Placeholder text
- [ ] Error messages
- [ ] Success messages
- [ ] Warning messages
- [ ] Info messages
- [ ] Table headers
- [ ] Table cells
- [ ] Navigation text
- [ ] Footer text

### UI Components
- [ ] Button borders
- [ ] Form field borders
- [ ] Focus indicators
- [ ] Icons (meaningful)
- [ ] Status badges
- [ ] Progress bars
- [ ] Dividers
- [ ] Tooltips
- [ ] Modal borders
- [ ] Card borders

### Interactive States
- [ ] Hover states
- [ ] Focus states
- [ ] Active states
- [ ] Selected states
- [ ] Disabled states (optional)

### Different Contexts
- [ ] Light mode
- [ ] Dark mode (if applicable)
- [ ] On colored backgrounds
- [ ] In modals/overlays
- [ ] On images (if text over images)

## Best Practices

### Do's

✅ **Use sufficient contrast**
- Aim for 4.5:1 for normal text
- Aim for 3:1 for large text and UI components
- Consider 7:1 for enhanced accessibility (AAA)

✅ **Test in context**
- Check actual rendered colors
- Test on different screens
- Test in different lighting conditions

✅ **Provide alternatives**
- Don't rely on color alone
- Use text labels
- Use icons or patterns

✅ **Document your palette**
- Create a color system
- Document contrast ratios
- Share with design team

✅ **Test early and often**
- Check contrast during design
- Verify in development
- Re-test after changes

### Don'ts

❌ **Don't use color alone**
```tsx
// Bad - status conveyed by color only
<span className="text-green">Approved</span>

// Good - status has text label
<span className="badge badge-success">Approved</span>
```

❌ **Don't assume light gray is readable**
```css
/* Bad - likely fails contrast */
.secondary-text {
  color: #999999;
}

/* Good - meets contrast requirements */
.secondary-text {
  color: #666666;
}
```

❌ **Don't forget interactive states**
```css
/* Bad - only checking default state */
.button {
  color: #FFFFFF;
  background: #0066CC;
}

/* Good - checking all states */
.button {
  color: #FFFFFF;
  background: #0066CC;
}
.button:hover {
  background: #0056B3; /* Still has good contrast */
}
.button:focus {
  outline: 2px solid #0066CC; /* 3:1 vs white background */
}
```

❌ **Don't ignore borders and icons**
```css
/* Bad - border too light */
.input {
  border: 1px solid #DDDDDD; /* 1.3:1 - fails */
}

/* Good - border has sufficient contrast */
.input {
  border: 1px solid #959595; /* 3.04:1 - passes */
}
```

## Resources

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)
- [Color Safe](http://colorsafe.co/)
- [Accessible Colors](https://accessible-colors.com/)

### Guidelines
- [WCAG 2.1 - Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [WCAG 2.1 - Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast)
- [WebAIM - Contrast and Color](https://webaim.org/articles/contrast/)

### Color Palettes
- [Accessible Color Palette Builder](https://toolness.github.io/accessible-color-matrix/)
- [Colorable](https://colorable.jxnblk.com/)
- [Contrast Grid](https://contrast-grid.eightshapes.com/)

## Next Steps

1. **Test all elements** following this guide
2. **Document all issues** in contrast test results table
3. **Create GitHub issues** for failures
4. **Work with design team** to fix issues
5. **Re-test after fixes**
6. **Add to design system** - document approved colors
7. **Add to CI/CD** - automated contrast checking where possible

## Summary

Color contrast verification is essential for ensuring that all users can read and interact with the WFM application. By following this guide and testing all text and UI components, you can ensure WCAG 2.1 Level AA compliance.

**Key Takeaways**:
- Normal text needs 4.5:1 contrast ratio
- Large text and UI components need 3:1 ratio
- Test all states (default, hover, focus, active)
- Use browser DevTools for quick testing
- Document all issues and fixes
- Don't rely on color alone to convey information

For questions or issues, refer to the resources section or consult with the development team.
