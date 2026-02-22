#!/usr/bin/env tsx
/**
 * Coverage Validation Script
 *
 * Validates coverage against configured thresholds and calculates delta.
 * Used in CI/CD pipeline to enforce coverage requirements.
 *
 * Usage:
 *   tsx scripts/validate-coverage.ts [--baseline <path>]
 *
 * Exit codes:
 *   0 - All thresholds met
 *   1 - One or more thresholds not met
 *   2 - Coverage decreased by more than 1%
 */

import * as fs from 'fs';
import * as path from 'path';

interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
  [key: string]: unknown;
}

interface CoverageThresholds {
  overall: number;
  services: number;
  components: number;
  utils: number;
  criticalPaths: number;
  newCode: number;
}

const THRESHOLDS: CoverageThresholds = {
  overall: 70,
  services: 70,
  components: 70,
  utils: 70,
  criticalPaths: 90,
  newCode: 80,
};

const MAX_COVERAGE_DECREASE = 1.0; // Maximum allowed coverage decrease in percentage points

/**
 * Load coverage summary from JSON file
 */
function loadCoverageSummary(filePath: string): CoverageSummary {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Validate overall coverage threshold
 */
function validateOverallThreshold(coverage: CoverageSummary): boolean {
  const { lines, statements, functions, branches } = coverage.total;
  const avgCoverage = (lines.pct + statements.pct + functions.pct + branches.pct) / 4;

  console.log(`\n📊 Overall Coverage: ${avgCoverage.toFixed(2)}%`);
  console.log(`   Target: ${THRESHOLDS.overall}%`);

  if (avgCoverage < THRESHOLDS.overall) {
    console.log(`   ❌ FAILED: Coverage is below threshold`);
    return false;
  }

  console.log(`   ✅ PASSED`);
  return true;
}

/**
 * Validate category-specific coverage
 */
function validateCategoryThresholds(coverage: CoverageSummary): boolean {
  const categories = {
    services: 'src/services/',
    components: 'src/components/',
    utils: 'src/utils/',
  };

  let allPassed = true;

  for (const [category, pathPrefix] of Object.entries(categories)) {
    const categoryFiles = Object.keys(coverage).filter((key) => key.startsWith(pathPrefix));

    if (categoryFiles.length === 0) {
      console.log(`\n⚠️  ${category}: No files found`);
      continue;
    }

    let totalLines = 0;
    let coveredLines = 0;

    for (const file of categoryFiles) {
      const fileCoverage = coverage[file];
      totalLines += fileCoverage.lines.total;
      coveredLines += fileCoverage.lines.covered;
    }

    const categoryPct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    const threshold = THRESHOLDS[category as keyof CoverageThresholds];

    console.log(`\n📁 ${category}: ${categoryPct.toFixed(2)}%`);
    console.log(`   Target: ${threshold}%`);
    console.log(`   Files: ${categoryFiles.length}`);

    if (categoryPct < threshold) {
      console.log(`   ❌ FAILED: Coverage is below threshold`);
      allPassed = false;
    } else {
      console.log(`   ✅ PASSED`);
    }
  }

  return allPassed;
}

/**
 * Calculate coverage delta between baseline and current
 */
function calculateCoverageDelta(baseline: CoverageSummary, current: CoverageSummary): number {
  const baselineAvg =
    (baseline.total.lines.pct +
      baseline.total.statements.pct +
      baseline.total.functions.pct +
      baseline.total.branches.pct) /
    4;

  const currentAvg =
    (current.total.lines.pct +
      current.total.statements.pct +
      current.total.functions.pct +
      current.total.branches.pct) /
    4;

  return currentAvg - baselineAvg;
}

/**
 * Validate coverage delta
 */
function validateCoverageDelta(baselinePath: string, currentCoverage: CoverageSummary): boolean {
  if (!fs.existsSync(baselinePath)) {
    console.log(`\n⚠️  No baseline coverage found at ${baselinePath}`);
    console.log(`   Skipping delta validation`);
    return true;
  }

  const baseline = loadCoverageSummary(baselinePath);
  const delta = calculateCoverageDelta(baseline, currentCoverage);

  console.log(`\n📈 Coverage Delta: ${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`);

  if (delta < -MAX_COVERAGE_DECREASE) {
    console.log(`   ❌ FAILED: Coverage decreased by more than ${MAX_COVERAGE_DECREASE}%`);
    return false;
  }

  if (delta > 0) {
    console.log(`   ✅ Coverage improved!`);
  } else if (delta === 0) {
    console.log(`   ✅ Coverage maintained`);
  } else {
    console.log(`   ✅ Coverage decrease within acceptable range`);
  }

  return true;
}

/**
 * Generate coverage report for improved/regressed files
 */
function generateFileChanges(baseline: CoverageSummary, current: CoverageSummary): void {
  const improved: string[] = [];
  const regressed: string[] = [];

  for (const file of Object.keys(current)) {
    if (file === 'total') continue;

    const currentPct = current[file].lines.pct;
    const baselinePct = baseline[file]?.lines.pct ?? 0;

    if (currentPct > baselinePct) {
      improved.push(`${file}: ${baselinePct.toFixed(1)}% → ${currentPct.toFixed(1)}%`);
    } else if (currentPct < baselinePct) {
      regressed.push(`${file}: ${baselinePct.toFixed(1)}% → ${currentPct.toFixed(1)}%`);
    }
  }

  if (improved.length > 0) {
    console.log(`\n✨ Improved Files (${improved.length}):`);
    improved.slice(0, 10).forEach((file) => console.log(`   ${file}`));
    if (improved.length > 10) {
      console.log(`   ... and ${improved.length - 10} more`);
    }
  }

  if (regressed.length > 0) {
    console.log(`\n⚠️  Regressed Files (${regressed.length}):`);
    regressed.slice(0, 10).forEach((file) => console.log(`   ${file}`));
    if (regressed.length > 10) {
      console.log(`   ... and ${regressed.length - 10} more`);
    }
  }
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Validating Test Coverage\n');
  console.log('='.repeat(50));

  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error(`\n❌ Coverage file not found: ${coveragePath}`);
    console.error('   Run "npm run test:coverage" first');
    process.exit(1);
  }

  const coverage = loadCoverageSummary(coveragePath);

  // Validate thresholds
  const overallPassed = validateOverallThreshold(coverage);
  const categoriesPassed = validateCategoryThresholds(coverage);

  // Validate delta if baseline provided
  const baselineArg = process.argv.indexOf('--baseline');
  let deltaPassed = true;

  if (baselineArg !== -1 && process.argv[baselineArg + 1]) {
    const baselinePath = process.argv[baselineArg + 1];
    deltaPassed = validateCoverageDelta(baselinePath, coverage);

    if (fs.existsSync(baselinePath)) {
      const baseline = loadCoverageSummary(baselinePath);
      generateFileChanges(baseline, coverage);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Validation Summary:');
  console.log(`   Overall Threshold: ${overallPassed ? '✅' : '❌'}`);
  console.log(`   Category Thresholds: ${categoriesPassed ? '✅' : '❌'}`);
  console.log(`   Coverage Delta: ${deltaPassed ? '✅' : '❌'}`);

  if (overallPassed && categoriesPassed && deltaPassed) {
    console.log('\n✅ All coverage requirements met!');
    process.exit(0);
  } else {
    console.log('\n❌ Coverage validation failed');
    process.exit(1);
  }
}

main();
