#!/usr/bin/env tsx
/**
 * Coverage Report CLI
 *
 * Generates coverage reports and validates against thresholds.
 *
 * Usage:
 *   npm run coverage:report
 *   npm run coverage:validate
 */

import {
  generateCoverageReport,
  validateThresholds,
  loadThresholdsFromConfig,
  type CoverageReport,
} from '../src/test/testSuiteManager';

/**
 * Format coverage metrics for display
 */
function formatMetrics(metrics: {
  lines: { pct: number };
  functions: { pct: number };
  branches: { pct: number };
  statements: { pct: number };
}): string {
  return `Lines: ${metrics.lines.pct.toFixed(2)}% | Functions: ${metrics.functions.pct.toFixed(2)}% | Branches: ${metrics.branches.pct.toFixed(2)}% | Statements: ${metrics.statements.pct.toFixed(2)}%`;
}

/**
 * Display coverage report in text format
 */
function displayReport(report: CoverageReport): void {
  console.log('\n=== Coverage Report ===');
  console.log(`Generated: ${report.timestamp.toISOString()}\n`);

  console.log('Overall Coverage:');
  console.log(`  ${formatMetrics(report.overall)}\n`);

  console.log('Coverage by Category:');
  for (const [category, metrics] of report.byCategory) {
    console.log(`  ${category.padEnd(15)}: ${formatMetrics(metrics)}`);
  }

  console.log(`\nTotal Uncovered Lines: ${report.uncoveredLines.length}`);

  if (report.uncoveredLines.length > 0 && report.uncoveredLines.length <= 20) {
    console.log('\nSample Uncovered Lines:');
    report.uncoveredLines.slice(0, 10).forEach((line) => {
      console.log(`  ${line.file}:${line.line} - ${line.code.substring(0, 60)}`);
    });
  }
}

/**
 * Display validation results
 */
function displayValidation(report: CoverageReport): void {
  const thresholds = loadThresholdsFromConfig();
  const result = validateThresholds(report, thresholds);

  console.log('\n=== Threshold Validation ===\n');
  console.log(result.summary);

  if (!result.passed) {
    console.log('\nViolations:');
    for (const violation of result.violations) {
      console.log(
        `  ❌ ${violation.category}: ${violation.current.toFixed(2)}% (target: ${violation.target}%, delta: ${violation.delta.toFixed(2)}%)`
      );
    }
    process.exit(1);
  } else {
    console.log('\n✅ All thresholds met!');
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'report';

  try {
    console.log('Generating coverage report...');
    const report = await generateCoverageReport();

    if (command === 'report') {
      displayReport(report);
    } else if (command === 'validate') {
      displayValidation(report);
    } else {
      console.error(`Unknown command: ${command}`);
      console.log('Usage: npm run coverage:report [report|validate]');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
