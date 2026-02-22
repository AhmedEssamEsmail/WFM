#!/usr/bin/env tsx
/**
 * Coverage Dashboard Script
 *
 * Generates a visual dashboard showing coverage progress, gaps, and trends.
 * Helps developers track progress toward the 70% coverage target.
 *
 * Usage:
 *   npm run coverage:dashboard
 *   tsx scripts/coverage-dashboard.ts [--baseline <path>]
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadThresholdsFromConfig } from '../src/test/testSuiteManager';
import { identifyGaps, prioritizeFiles } from '../src/test/coverageAnalyzer';

interface CoverageSummary {
  total: {
    lines: { pct: number; covered: number; total: number };
    statements: { pct: number; covered: number; total: number };
    functions: { pct: number; covered: number; total: number };
    branches: { pct: number; covered: number; total: number };
  };
  [key: string]: unknown;
}

/**
 * Generate ASCII progress bar
 */
function generateProgressBar(percentage: number, width: number = 40): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  // Color based on percentage
  let color = '\x1b[31m'; // Red
  if (percentage >= 80)
    color = '\x1b[32m'; // Green
  else if (percentage >= 70)
    color = '\x1b[33m'; // Yellow
  else if (percentage >= 50) color = '\x1b[36m'; // Cyan

  return `${color}${bar}\x1b[0m ${percentage.toFixed(1)}%`;
}

/**
 * Generate coverage badge emoji
 */
function generateBadge(percentage: number): string {
  if (percentage >= 80) return '🟢';
  if (percentage >= 70) return '🟡';
  if (percentage >= 50) return '🟠';
  return '🔴';
}

/**
 * Display header with title
 */
function displayHeader(title: string): void {
  const width = 80;
  const padding = Math.floor((width - title.length - 2) / 2);
  console.log('\n' + '═'.repeat(width));
  console.log(
    '║' + ' '.repeat(padding) + title + ' '.repeat(width - padding - title.length - 2) + '║'
  );
  console.log('═'.repeat(width) + '\n');
}

/**
 * Display overall coverage metrics
 */
function displayOverallMetrics(coverage: CoverageSummary, target: number): void {
  displayHeader('📊 OVERALL COVERAGE');

  const { lines, statements, functions, branches } = coverage.total;
  const avgCoverage = (lines.pct + statements.pct + functions.pct + branches.pct) / 4;

  console.log(`${generateBadge(avgCoverage)} Average Coverage: ${avgCoverage.toFixed(2)}%`);
  console.log(`🎯 Target: ${target}%`);
  console.log(`📈 Progress: ${generateProgressBar(avgCoverage)}`);
  console.log();

  console.log('Detailed Metrics:');
  console.log(
    `  Lines:      ${generateProgressBar(lines.pct, 30)} (${lines.covered}/${lines.total})`
  );
  console.log(
    `  Statements: ${generateProgressBar(statements.pct, 30)} (${statements.covered}/${statements.total})`
  );
  console.log(
    `  Functions:  ${generateProgressBar(functions.pct, 30)} (${functions.covered}/${functions.total})`
  );
  console.log(
    `  Branches:   ${generateProgressBar(branches.pct, 30)} (${branches.covered}/${branches.total})`
  );
}

/**
 * Display category coverage breakdown
 */
function displayCategoryBreakdown(coverage: CoverageSummary, target: number): void {
  displayHeader('📁 COVERAGE BY CATEGORY');

  const categories = {
    Services: 'src/services/',
    Components: 'src/components/',
    Utils: 'src/utils/',
    Contexts: 'src/contexts/',
    Validation: 'src/validation/',
    Hooks: 'src/hooks/',
    Lib: 'src/lib/',
  };

  const categoryData: Array<{ name: string; pct: number; files: number }> = [];

  for (const [category, pathPrefix] of Object.entries(categories)) {
    // Normalize path separators for cross-platform compatibility
    const categoryFiles = Object.keys(coverage).filter((key) => {
      if (key === 'total') return false;
      // Normalize the file path and check if it includes the category path
      const normalizedKey = key.replace(/\\/g, '/');
      return normalizedKey.includes(pathPrefix);
    });

    if (categoryFiles.length === 0) continue;

    let totalLines = 0;
    let coveredLines = 0;

    for (const file of categoryFiles) {
      const fileCoverage = coverage[file];
      totalLines += fileCoverage.lines.total;
      coveredLines += fileCoverage.lines.covered;
    }

    const categoryPct = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
    categoryData.push({ name: category, pct: categoryPct, files: categoryFiles.length });
  }

  // Sort by coverage percentage
  categoryData.sort((a, b) => b.pct - a.pct);

  if (categoryData.length === 0) {
    console.log('No category data available\n');
    return;
  }

  for (const { name, pct, files } of categoryData) {
    const status = pct >= target ? '✅' : '⚠️ ';
    console.log(`${status} ${name.padEnd(15)} ${generateProgressBar(pct, 30)} (${files} files)`);
  }
}

/**
 * Display files below target with priority
 */
function displayGapsWithPriority(coverage: CoverageSummary, target: number): void {
  displayHeader('⚠️  FILES BELOW TARGET');

  // Convert coverage summary to format expected by identifyGaps
  const report = convertToReport(coverage);
  const gaps = identifyGaps(report, target);

  if (gaps.length === 0) {
    console.log('🎉 All files meet the coverage target!\n');
    return;
  }

  const prioritized = prioritizeFiles(gaps);

  // Group by priority
  const byPriority = {
    P0: prioritized.filter((f) => f.priority === 'P0'),
    P1: prioritized.filter((f) => f.priority === 'P1'),
    P2: prioritized.filter((f) => f.priority === 'P2'),
    P3: prioritized.filter((f) => f.priority === 'P3'),
  };

  console.log('Priority Breakdown:');
  console.log(`  🔴 P0 (Critical): ${byPriority.P0.length} files`);
  console.log(`  🟠 P1 (High):     ${byPriority.P1.length} files`);
  console.log(`  🟡 P2 (Medium):   ${byPriority.P2.length} files`);
  console.log(`  🟢 P3 (Low):      ${byPriority.P3.length} files`);
  console.log();

  // Display top 15 files
  console.log('Top 15 Files Needing Tests:\n');

  prioritized.slice(0, 15).forEach((file, index) => {
    const gap = gaps.find((g) => g.file === file.file)!;
    const priorityIcon = {
      P0: '🔴',
      P1: '🟠',
      P2: '🟡',
      P3: '🟢',
    }[file.priority];

    console.log(`${index + 1}. ${priorityIcon} ${file.file}`);
    console.log(`   Coverage: ${generateProgressBar(gap.currentCoverage, 25)}`);
    console.log(
      `   Gap: ${(target - gap.currentCoverage).toFixed(1)}% | Uncovered: ${gap.uncoveredLines} lines | Est. tests: ${file.estimatedTests}`
    );
    console.log();
  });

  if (prioritized.length > 15) {
    console.log(`... and ${prioritized.length - 15} more files\n`);
  }
}

/**
 * Display coverage trends over time
 */
function displayTrends(baseline: CoverageSummary, current: CoverageSummary): void {
  displayHeader('📈 COVERAGE TRENDS');

  const baselineAvg = calculateAverageCoverage(baseline);
  const currentAvg = calculateAverageCoverage(current);
  const delta = currentAvg - baselineAvg;

  // Display delta
  let deltaIcon = '➡️ ';
  let deltaText = 'No change';
  let deltaColor = '\x1b[37m'; // White

  if (delta > 0) {
    deltaIcon = '📈';
    deltaText = `Increased by ${delta.toFixed(2)}%`;
    deltaColor = '\x1b[32m'; // Green
  } else if (delta < 0) {
    deltaIcon = '📉';
    deltaText = `Decreased by ${Math.abs(delta).toFixed(2)}%`;
    deltaColor = '\x1b[31m'; // Red
  }

  console.log(`${deltaIcon} ${deltaColor}${deltaText}\x1b[0m\n`);

  // Display metric changes
  console.log('Metric Changes:');
  displayMetricChange('Lines', baseline.total.lines.pct, current.total.lines.pct);
  displayMetricChange('Statements', baseline.total.statements.pct, current.total.statements.pct);
  displayMetricChange('Functions', baseline.total.functions.pct, current.total.functions.pct);
  displayMetricChange('Branches', baseline.total.branches.pct, current.total.branches.pct);
  console.log();

  // Display file changes
  const { improved, regressed, newFiles } = analyzeFileChanges(baseline, current);

  console.log(`✨ Improved Files: ${improved.length}`);
  console.log(`⚠️  Regressed Files: ${regressed.length}`);
  console.log(`🆕 New Files: ${newFiles.length}`);
  console.log();

  // Show top improved files
  if (improved.length > 0) {
    console.log('Top 5 Improved Files:');
    improved.slice(0, 5).forEach(({ file, from, to }) => {
      const change = to - from;
      console.log(`  📈 ${file}`);
      console.log(`     ${from.toFixed(1)}% → ${to.toFixed(1)}% (+${change.toFixed(1)}%)`);
    });
    console.log();
  }

  // Show regressed files (all of them, as this is critical)
  if (regressed.length > 0) {
    console.log('⚠️  Regressed Files:');
    regressed.forEach(({ file, from, to }) => {
      const change = to - from;
      console.log(`  📉 ${file}`);
      console.log(`     ${from.toFixed(1)}% → ${to.toFixed(1)}% (${change.toFixed(1)}%)`);
    });
    console.log();
  }
}

/**
 * Display metric change with arrow
 */
function displayMetricChange(name: string, baseline: number, current: number): void {
  const delta = current - baseline;
  let arrow = '→';
  let color = '\x1b[37m'; // White

  if (delta > 0) {
    arrow = '↗';
    color = '\x1b[32m'; // Green
  } else if (delta < 0) {
    arrow = '↘';
    color = '\x1b[31m'; // Red
  }

  console.log(
    `  ${name.padEnd(12)} ${baseline.toFixed(2)}% ${color}${arrow}\x1b[0m ${current.toFixed(2)}% (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%)`
  );
}

/**
 * Calculate average coverage
 */
function calculateAverageCoverage(coverage: CoverageSummary): number {
  const { lines, statements, functions, branches } = coverage.total;
  return (lines.pct + statements.pct + functions.pct + branches.pct) / 4;
}

/**
 * Analyze file changes between baseline and current
 */
function analyzeFileChanges(
  baseline: CoverageSummary,
  current: CoverageSummary
): {
  improved: Array<{ file: string; from: number; to: number }>;
  regressed: Array<{ file: string; from: number; to: number }>;
  newFiles: string[];
} {
  const improved: Array<{ file: string; from: number; to: number }> = [];
  const regressed: Array<{ file: string; from: number; to: number }> = [];
  const newFiles: string[] = [];

  for (const file of Object.keys(current)) {
    if (file === 'total') continue;

    const currentPct = current[file].lines.pct;

    if (baseline[file]) {
      const baselinePct = baseline[file].lines.pct;

      if (currentPct > baselinePct + 0.1) {
        improved.push({ file, from: baselinePct, to: currentPct });
      } else if (currentPct < baselinePct - 0.1) {
        regressed.push({ file, from: baselinePct, to: currentPct });
      }
    } else {
      newFiles.push(file);
    }
  }

  // Sort by change magnitude
  improved.sort((a, b) => b.to - b.from - (a.to - a.from));
  regressed.sort((a, b) => a.to - a.from - (b.to - b.from));

  return { improved, regressed, newFiles };
}

/**
 * Convert coverage summary to report format
 */
function convertToReport(coverage: CoverageSummary): {
  timestamp: Date;
  commit: string;
  overall: unknown;
  byFile: Map<string, unknown>;
  byCategory: Map<string, unknown>;
  uncoveredLines: unknown[];
} {
  const byFile = new Map();
  const uncoveredLines: unknown[] = [];

  for (const [file, fileCoverage] of Object.entries(coverage)) {
    if (file === 'total') continue;

    byFile.set(file, {
      lines: fileCoverage.lines,
      statements: fileCoverage.statements,
      functions: fileCoverage.functions,
      branches: fileCoverage.branches,
    });
  }

  return {
    timestamp: new Date(),
    commit: 'current',
    overall: {
      lines: coverage.total.lines,
      statements: coverage.total.statements,
      functions: coverage.total.functions,
      branches: coverage.total.branches,
    },
    byFile,
    byCategory: new Map(),
    uncoveredLines,
  };
}

/**
 * Load coverage summary from JSON file
 */
function loadCoverageSummary(filePath: string): CoverageSummary {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Display summary and next steps
 */
function displaySummary(coverage: CoverageSummary, target: number, gaps: number): void {
  displayHeader('📋 SUMMARY & NEXT STEPS');

  const avgCoverage = calculateAverageCoverage(coverage);
  const remaining = Math.max(0, target - avgCoverage);

  console.log(`Current Coverage: ${avgCoverage.toFixed(2)}%`);
  console.log(`Target Coverage:  ${target}%`);
  console.log(`Remaining Gap:    ${remaining.toFixed(2)}%`);
  console.log(`Files Below Target: ${gaps}`);
  console.log();

  if (avgCoverage >= target) {
    console.log('🎉 Congratulations! You have reached the coverage target!');
    console.log();
    console.log('Next Steps:');
    console.log('  1. Maintain coverage by running tests regularly');
    console.log('  2. Ensure new code has adequate test coverage');
    console.log('  3. Consider increasing the target for critical paths');
  } else {
    console.log('💡 Next Steps:');
    console.log('  1. Focus on P0 (Critical) files first');
    console.log('  2. Run: npm run analyze-coverage for detailed suggestions');
    console.log('  3. Write tests for high-priority files');
    console.log('  4. Run: npm run test:coverage to verify improvements');
    console.log('  5. Track progress with: npm run coverage:dashboard');
  }

  console.log();
}

/**
 * Main function
 */
async function main() {
  console.clear();

  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage file not found. Run tests with coverage first:');
    console.error('   npm run test:coverage');
    process.exit(1);
  }

  try {
    // Load current coverage
    const coverage = loadCoverageSummary(coveragePath);
    const thresholds = loadThresholdsFromConfig();
    const target = thresholds.overall;

    // Display overall metrics
    displayOverallMetrics(coverage, target);

    // Display category breakdown
    displayCategoryBreakdown(coverage, target);

    // Display gaps with priority
    displayGapsWithPriority(coverage, target);

    // Display trends if baseline provided
    const baselineArg = process.argv.indexOf('--baseline');
    if (baselineArg !== -1 && process.argv[baselineArg + 1]) {
      const baselinePath = process.argv[baselineArg + 1];
      if (fs.existsSync(baselinePath)) {
        const baseline = loadCoverageSummary(baselinePath);
        displayTrends(baseline, coverage);
      }
    }

    // Count gaps
    const report = convertToReport(coverage);
    const gaps = identifyGaps(report, target);

    // Display summary
    displaySummary(coverage, target, gaps.length);
  } catch (error) {
    console.error('❌ Error generating dashboard:', error);
    process.exit(1);
  }
}

main();
