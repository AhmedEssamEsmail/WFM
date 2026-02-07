# Pre-Commit Verification Script
# Run this before committing changes

Write-Host "🔍 Starting Pre-Commit Verification..." -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Function to print status
function Print-Status {
    param($Message, $Status)
    if ($Status -eq "PASS") {
        Write-Host "✅ $Message" -ForegroundColor Green
    } elseif ($Status -eq "FAIL") {
        Write-Host "❌ $Message" -ForegroundColor Red
        $script:ErrorCount++
    } elseif ($Status -eq "WARN") {
        Write-Host "⚠️  $Message" -ForegroundColor Yellow
        $script:WarningCount++
    } else {
        Write-Host "ℹ️  $Message" -ForegroundColor Blue
    }
}

# 1. Check Node and npm versions
Write-Host "📦 Checking Environment..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Print-Status "Node.js version: $nodeVersion" "PASS"
} catch {
    Print-Status "Node.js not found" "FAIL"
}

try {
    $npmVersion = npm --version
    Print-Status "npm version: $npmVersion" "PASS"
} catch {
    Print-Status "npm not found" "FAIL"
}

Write-Host ""

# 2. Install dependencies if needed
Write-Host "📥 Checking Dependencies..." -ForegroundColor Cyan
if (!(Test-Path "node_modules")) {
    Print-Status "node_modules not found, running npm install..." "WARN"
    npm install
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Dependencies installed successfully" "PASS"
    } else {
        Print-Status "Failed to install dependencies" "FAIL"
    }
} else {
    Print-Status "Dependencies already installed" "PASS"
}

Write-Host ""

# 3. Run TypeScript compilation check
Write-Host "🔨 Running TypeScript Compilation..." -ForegroundColor Cyan
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Print-Status "TypeScript compilation successful" "PASS"
} else {
    Print-Status "TypeScript compilation failed" "FAIL"
    Write-Host "   Run 'npm run build' to see detailed errors" -ForegroundColor Yellow
}

Write-Host ""

# 4. Run linter
Write-Host "🔍 Running ESLint..." -ForegroundColor Cyan
npm run lint 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Print-Status "ESLint passed with no errors" "PASS"
} else {
    Print-Status "ESLint found issues" "WARN"
    Write-Host "   Run 'npm run lint' to see detailed errors" -ForegroundColor Yellow
}

Write-Host ""

# 5. Run tests
Write-Host "🧪 Running Tests..." -ForegroundColor Cyan
npm test -- --run 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Print-Status "All tests passed" "PASS"
} else {
    Print-Status "Some tests failed" "FAIL"
    Write-Host "   Run 'npm test' to see detailed results" -ForegroundColor Yellow
}

Write-Host ""

# 6. Check for console statements (excluding allowed files)
Write-Host "🔎 Checking for Console Statements..." -ForegroundColor Cyan
$consoleStatements = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern "console\.(log|error|warn)" -Exclude "*errorHandler.ts", "*ErrorBoundary.tsx" | Measure-Object
if ($consoleStatements.Count -eq 0) {
    Print-Status "No console statements found (excluding allowed files)" "PASS"
} else {
    Print-Status "Found $($consoleStatements.Count) console statements" "WARN"
    Write-Host "   These should be replaced with proper error handling" -ForegroundColor Yellow
}

Write-Host ""

# 7. Check bundle size
Write-Host "📊 Checking Bundle Size..." -ForegroundColor Cyan
if (Test-Path "dist") {
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    if ($distSize -lt 1) {
        Print-Status "Bundle size: $([math]::Round($distSize, 2)) MB" "PASS"
    } else {
        Print-Status "Bundle size: $([math]::Round($distSize, 2)) MB (Warning: > 1 MB)" "WARN"
    }
} else {
    Print-Status "dist folder not found (run 'npm run build' first)" "WARN"
}

Write-Host ""

# 8. Check for TypeScript 'any' types
Write-Host "🔍 Checking for 'any' Types..." -ForegroundColor Cyan
$anyTypes = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern ": any\b|<any>" | Measure-Object
if ($anyTypes.Count -eq 0) {
    Print-Status "No 'any' types found" "PASS"
} else {
    Print-Status "Found $($anyTypes.Count) 'any' types" "WARN"
    Write-Host "   Consider replacing with proper types or 'unknown'" -ForegroundColor Yellow
}

Write-Host ""

# 9. Check for TODO/FIXME comments
Write-Host "📝 Checking for TODO/FIXME Comments..." -ForegroundColor Cyan
$todos = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern "TODO|FIXME" | Measure-Object
if ($todos.Count -eq 0) {
    Print-Status "No TODO/FIXME comments found" "PASS"
} else {
    Print-Status "Found $($todos.Count) TODO/FIXME comments" "WARN"
}

Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "   Ready to commit and push" -ForegroundColor Green
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠️  PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "   Errors: $ErrorCount" -ForegroundColor Green
    Write-Host "   Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   You can commit, but consider addressing warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "   Errors: $ErrorCount" -ForegroundColor Red
    Write-Host "   Warnings: $WarningCount" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Please fix errors before committing" -ForegroundColor Red
    exit 1
}
