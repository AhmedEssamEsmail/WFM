# Manual Testing Checklist

## Pre-Deployment Testing Checklist

**Date**: February 7, 2026  
**Tester**: _______________  
**Environment**: Local Development

---

## ✅ TypeScript Compilation

- [x] All source files compile without errors
- [x] All test files compile without errors
- [x] Zero TypeScript diagnostics across 12 core files
- [x] Zero TypeScript diagnostics across 3 test files

**Status**: ✅ **PASSED** (Verified via getDiagnostics)

---

## 🧪 Unit Tests to Run

Once PowerShell execution policy is resolved, run:

```bash
npm test -- --run
```

### Expected Results:
- [ ] All 108+ tests pass
- [ ] Error handler tests (40+) pass
- [ ] Sanitization tests (30+) pass
- [ ] Utility tests (36) pass
- [ ] Component tests (2) pass
- [ ] Hook tests (1) pass

---

## 🔍 Manual Testing Scenarios

### 1. Comment System Testing

#### Test Case 1.1: System Comments
**Page**: Leave Request Detail / Swap Request Detail  
**Steps**:
1. Navigate to any leave or swap request detail page
2. Approve or reject a request
3. Observe the comment that gets created

**Expected**:
- [ ] Comment shows "System" as the commenter
- [ ] Background is gray (`bg-gray-100`)
- [ ] Text color is gray (`text-gray-700`)

#### Test Case 1.2: User Comments
**Page**: Leave Request Detail / Swap Request Detail  
**Steps**:
1. Navigate to any leave or swap request detail page
2. Add a manual comment in the comment box
3. Submit the comment

**Expected**:
- [ ] Comment shows actual user name
- [ ] Background is blue (`bg-blue-50`)
- [ ] Text color is blue (`text-blue-800`)

---

### 2. Error Handling Testing

#### Test Case 2.1: Database Error
**Page**: Any page with data operations  
**Steps**:
1. Disconnect from internet (simulate network failure)
2. Try to load a page or submit a form
3. Observe error handling

**Expected**:
- [ ] Toast notification appears with user-friendly message
- [ ] No console.error in production build
- [ ] Error is logged (check browser console in dev mode)
- [ ] Page doesn't crash

#### Test Case 2.2: Validation Error
**Page**: Create Leave Request / Create Swap Request  
**Steps**:
1. Try to submit a form with invalid data
2. Observe error handling

**Expected**:
- [ ] Validation error message appears
- [ ] Toast notification shows specific field error
- [ ] Form doesn't submit
- [ ] User can correct and resubmit

---

### 3. Input Sanitization Testing

#### Test Case 3.1: XSS Prevention in Comments
**Page**: Leave Request Detail / Swap Request Detail  
**Steps**:
1. Try to add a comment with: `<script>alert('xss')</script>Hello`
2. Submit the comment
3. Refresh the page and view the comment

**Expected**:
- [ ] Script tag is removed
- [ ] "Hello" text is visible
- [ ] No alert popup appears
- [ ] No script execution

#### Test Case 3.2: Safe HTML in Comments
**Page**: Leave Request Detail / Swap Request Detail  
**Steps**:
1. Try to add a comment with: `Hello <strong>world</strong>`
2. Submit the comment
3. View the comment

**Expected**:
- [ ] "Hello" appears in normal text
- [ ] "world" appears in bold
- [ ] HTML is properly sanitized

---

### 4. Security Headers Testing

#### Test Case 4.1: Security Headers Present
**Page**: Any page  
**Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Click on the main document request
5. Check Response Headers

**Expected Headers**:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Permissions-Policy: camera=(), microphone=(), geolocation=()
- [ ] Strict-Transport-Security: max-age=31536000; includeSubDomains
- [ ] Content-Security-Policy: (present with Supabase allowlist)

---

### 5. Error Handler Integration Testing

#### Test Case 5.1: Toast Integration
**Page**: Any page  
**Steps**:
1. Trigger an error (e.g., network failure)
2. Observe toast notification

**Expected**:
- [ ] Toast appears in top-right corner
- [ ] Toast has red background (error type)
- [ ] Toast shows user-friendly message
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Toast can be manually closed

#### Test Case 5.2: Error Logging
**Page**: Any page (Development mode)  
**Steps**:
1. Open browser console
2. Trigger an error
3. Check console output

**Expected**:
- [ ] Error is logged with "🔴 Error Handler" group
- [ ] Error details are shown
- [ ] Context information is included
- [ ] Stack trace is visible (if available)

---

### 6. Performance Testing

#### Test Case 6.1: Bundle Size
**Steps**:
1. Run `npm run build`
2. Check `dist/` folder size
3. Check gzipped size

**Expected**:
- [ ] Total bundle < 600 KB
- [ ] Gzipped bundle < 200 KB
- [ ] Code splitting working (multiple chunks)

#### Test Case 6.2: Page Load Time
**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Hard refresh (Ctrl+Shift+R)
4. Check load time

**Expected**:
- [ ] Initial load < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] Lazy-loaded pages load quickly

---

### 7. Regression Testing

#### Test Case 7.1: Existing Functionality
**Pages**: All pages  
**Steps**:
1. Navigate through all pages
2. Test all major features
3. Verify nothing is broken

**Expected**:
- [ ] Dashboard loads correctly
- [ ] Schedule page works
- [ ] Leave requests can be created
- [ ] Swap requests can be created
- [ ] Approvals work
- [ ] Settings can be changed
- [ ] Reports generate correctly

#### Test Case 7.2: Authentication Flow
**Steps**:
1. Log out
2. Try to access protected page
3. Log in
4. Access protected page

**Expected**:
- [ ] Redirects to login when not authenticated
- [ ] Login works correctly
- [ ] Redirects to dashboard after login
- [ ] Protected pages accessible after login

---

## 🚀 Build Testing

### Build Commands to Run:

```bash
# 1. Clean install dependencies
npm ci

# 2. Run linter
npm run lint

# 3. Run tests
npm test -- --run

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

### Expected Results:
- [ ] `npm ci` completes without errors
- [ ] `npm run lint` shows no errors
- [ ] `npm test` all tests pass
- [ ] `npm run build` completes successfully
- [ ] `npm run preview` serves the app correctly

---

## 📱 Browser Compatibility Testing

Test in the following browsers:

### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

### Safari (if available)
- [ ] All features work
- [ ] No console errors
- [ ] UI renders correctly

---

## 🔒 Security Testing

### XSS Attack Vectors to Test:

Try these payloads in comment fields:

1. `<img src=x onerror=alert("xss")>`
2. `<svg onload=alert("xss")>`
3. `<iframe src="javascript:alert('xss')">`
4. `<body onload=alert("xss")>`
5. `<input onfocus=alert("xss") autofocus>`

**Expected**: All should be sanitized, no alerts should appear

---

## 📊 Test Results Summary

### Overall Status: ⬜ Not Started / 🟡 In Progress / ✅ Complete

| Category | Status | Pass/Fail | Notes |
|----------|--------|-----------|-------|
| TypeScript Compilation | ✅ | PASS | 0 errors |
| Unit Tests | ⬜ | - | Pending npm access |
| Comment System | ⬜ | - | Manual testing needed |
| Error Handling | ⬜ | - | Manual testing needed |
| Input Sanitization | ⬜ | - | Manual testing needed |
| Security Headers | ⬜ | - | Manual testing needed |
| Performance | ⬜ | - | Build needed |
| Regression | ⬜ | - | Manual testing needed |
| Browser Compatibility | ⬜ | - | Manual testing needed |
| Security (XSS) | ⬜ | - | Manual testing needed |

---

## 🐛 Issues Found

### Issue Template:
```
**Issue #**: 
**Severity**: Critical / High / Medium / Low
**Component**: 
**Description**: 
**Steps to Reproduce**: 
**Expected**: 
**Actual**: 
**Fix Applied**: 
**Verified**: Yes / No
```

---

## ✅ Sign-Off

### Development Team
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated

**Signed**: _______________  
**Date**: _______________

### QA Team
- [ ] Manual testing complete
- [ ] No critical issues found
- [ ] Regression testing passed
- [ ] Security testing passed

**Signed**: _______________  
**Date**: _______________

### Deployment Team
- [ ] Build successful
- [ ] Preview tested
- [ ] Ready for deployment

**Signed**: _______________  
**Date**: _______________

---

## 📝 Notes

### Known Limitations:
1. PowerShell execution policy prevents running npm commands directly
2. Some console statements remain in non-critical files (to be addressed in Phase 3)
3. Test coverage at 30% (target 60% in Phase 3)

### Recommendations:
1. Enable PowerShell script execution for development: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
2. Run full test suite before deployment
3. Monitor error logs in production for first 24 hours
4. Schedule Phase 3 improvements for next sprint

---

**Last Updated**: February 7, 2026  
**Version**: 1.0  
**Status**: Ready for Manual Testing
