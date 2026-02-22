#!/usr/bin/env tsx
/**
 * Coverage Gap Report Script
 *
 * Generates a detailed gap report that helps developers understand exactly what needs to be tested.
 * Identifies files below 70% coverage, sorts by priority, estimates tests needed, and provides
 * specific actionable recommendations.
 *
 * Usage:
 *   npm run coverage:gap-report
 *   tsx scripts/coverage-gap-report.ts [--format <json|text>] [--output <path>]
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadThresholdsFromConfig,
  CoverageReport,
  CoverageMetrics,
} from '../src/test/testSuiteManager';
import { identifyGaps, prioritizeFiles, suggestTests } from '../src/test/coverageAnalyzer';

interface CoverageSummary {
  total: {
    lines: { pct: number; covered: number; total: number };
    statements: { pct: number; covered: number; total: number };
    functions: { pct: number; covered: number; total: number };
    branches: { pct: number; covered: number; total: number };
  };
  [key: string]: {
    lines: { pct: number; covered: number; total: number };
    statements: { pct: number; covered: number; total: number };
    functions: { pct: number; covered: number; total: number };
    branches: { pct: number; covered: number; total: number };
  };
}

interface GapReportEntry {
  file: string;
  priority: string;
  currentCoverage: number;
  targetCoverage: number;
  gap: number;
  uncoveredLines: number;
  estimatedTests: number;
  impact: number;
  reason: string;
  recommendations: Array<{
    type: string;
    description: string;
  }>;
}

interface GapReport {
  summary: {
    totalFiles: number;
    filesBelow70: number;
    byPriority: {
      P0: number;
      P1: number;
      P2: number;
      P3: number;
    };
    estimatedTotalTests: number;
  };
  gaps: GapReportEntry[];
  generatedAt: string;
}

/**
 * Convert coverage summary to report format
 */
function convertToReport(coverage: CoverageSummary): CoverageReport {
  const byFile = new Map();

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
    overall: {
      lines: coverage.total.lines,
      statements: coverage.total.statements,
      functions: coverage.total.functions,
      branches: coverage.total.branches,
    },
    byFile,
    byCategory: new Map<string, CoverageMetrics>(),
    uncoveredLines: [],
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
 * Generate gap report
 */
function generateGapReport(coverage: CoverageSummary, target: number): GapReport {
  // Convert to report format
  const report = convertToReport(coverage);

  // Identify gaps
  const gaps = identifyGaps(report, target);

  // Prioritize files
  const prioritized = prioritizeFiles(gaps);

  // Count by priority
  const byPriority = {
    P0: prioritized.filter((f) => f.priority === 'P0').length,
    P1: prioritized.filter((f) => f.priority === 'P1').length,
    P2: prioritized.filter((f) => f.priority === 'P2').length,
    P3: prioritized.filter((f) => f.priority === 'P3').length,
  };

  // Calculate total estimated tests
  const estimatedTotalTests = prioritized.reduce((sum, f) => sum + f.estimatedTests, 0);

  // Generate detailed entries
  const gapEntries: GapReportEntry[] = prioritized.map((file) => {
    const gap = gaps.find((g) => g.file === file.file)!;
    const suggestions = suggestTests(file.file);

    return {
      file: file.file,
      priority: file.priority,
      currentCoverage: gap.currentCoverage,
      targetCoverage: gap.targetCoverage,
      gap: gap.targetCoverage - gap.currentCoverage,
      uncoveredLines: gap.uncoveredLines,
      estimatedTests: file.estimatedTests,
      impact: file.impact,
      reason: file.reason,
      recommendations: suggestions.map((s) => ({
        type: s.type,
        description: s.description,
      })),
    };
  });

  return {
    summary: {
      totalFiles: report.byFile.size,
      filesBelow70: gaps.length,
      byPriority,
      estimatedTotalTests,
    },
    gaps: gapEntries,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Display gap report in text format
 */
function displayTextReport(gapReport: GapReport): void {
  console.log('\n' + '═'.repeat(80));
  console.log('║' + ' '.repeat(25) + 'COVERAGE GAP REPORT' + ' '.repeat(36) + '║');
  console.log('═'.repeat(80) + '\n');

  // Summary
  console.log('📊 SUMMARY\n');
  console.log(`Total Files:           ${gapReport.summary.totalFiles}`);
  console.log(`Files Below 70%:       ${gapReport.summary.filesBelow70}`);
  console.log(`Estimated Total Tests: ${gapReport.summary.estimatedTotalTests}`);
  console.log();

  console.log('Priority Breakdown:');
  console.log(`  🔴 P0 (Critical): ${gapReport.summary.byPriority.P0} files`);
  console.log(`  🟠 P1 (High):     ${gapReport.summary.byPriority.P1} files`);
  console.log(`  🟡 P2 (Medium):   ${gapReport.summary.byPriority.P2} files`);
  console.log(`  🟢 P3 (Low):      ${gapReport.summary.byPriority.P3} files`);
  console.log();

  if (gapReport.gaps.length === 0) {
    console.log('🎉 All files meet the coverage target!\n');
    return;
  }

  // Detailed gaps
  console.log('─'.repeat(80));
  console.log('📋 DETAILED GAP ANALYSIS\n');

  gapReport.gaps.forEach((entry, index) => {
    const priorityIcon =
      {
        P0: '🔴',
        P1: '🟠',
        P2: '🟡',
        P3: '🟢',
      }[entry.priority] || '⚪';

    console.log(`${index + 1}. ${priorityIcon} ${entry.file}`);
    console.log(`   Priority: ${entry.priority} - ${entry.reason}`);
    console.log();

    // Coverage metrics
    console.log(`   Coverage Metrics:`);
    console.log(`     Current:  ${entry.currentCoverage.toFixed(1)}%`);
    console.log(`     Target:   ${entry.targetCoverage.toFixed(1)}%`);
    console.log(`     Gap:      ${entry.gap.toFixed(1)}%`);
    console.log();

    // Test estimates
    console.log(`   Test Estimates:`);
    console.log(`     Uncovered Lines:  ${entry.uncoveredLines}`);
    console.log(`     Estimated Tests:  ${entry.estimatedTests}`);
    console.log(`     Impact Score:     ${entry.impact.toFixed(0)}`);
    console.log();

    // Recommendations
    if (entry.recommendations.length > 0) {
      console.log(`   Recommendations:`);
      entry.recommendations.forEach((rec, recIndex) => {
        const typeIcon =
          {
            unit: '🧪',
            integration: '🔗',
            property: '🎲',
          }[rec.type] || '📝';

        console.log(`     ${recIndex + 1}. ${typeIcon} ${rec.type.toUpperCase()} TEST`);
        console.log(`        ${rec.description}`);
      });
      console.log();
    }

    // Action items
    console.log(`   Action Items:`);
    console.log(`     1. Review uncovered code in ${entry.file}`);
    console.log(`     2. Write ${entry.estimatedTests} test(s) covering the gaps`);
    console.log(`     3. Run: npm run test:coverage to verify improvements`);
    console.log();

    console.log('─'.repeat(80));
    console.log();
  });

  // Next steps
  console.log('💡 NEXT STEPS\n');
  console.log('1. Start with P0 (Critical) files - these are the highest priority');
  console.log('2. For each file:');
  console.log('   a. Review the uncovered code');
  console.log('   b. Follow the recommendations to write appropriate tests');
  console.log('   c. Run tests to verify coverage improvements');
  console.log('3. Use the test generator for quick test scaffolding:');
  console.log('   npm run generate:service-test <service-file>');
  console.log('4. Track progress with:');
  console.log('   npm run coverage:dashboard');
  console.log();

  console.log(`Generated at: ${new Date(gapReport.generatedAt).toLocaleString()}`);
  console.log();
}

/**
 * Save gap report as JSON
 */
function saveJsonReport(gapReport: GapReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(gapReport, null, 2), 'utf8');
  console.log(`✅ Gap report saved to: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const formatIndex = args.indexOf('--format');
  const outputIndex = args.indexOf('--output');

  const format = formatIndex !== -1 ? args[formatIndex + 1] : 'text';
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    console.error('❌ Coverage file not found. Run tests with coverage first:');
    console.error('   npm run test:coverage');
    process.exit(1);
  }

  try {
    // Load coverage and thresholds
    const coverage = loadCoverageSummary(coveragePath);
    const thresholds = loadThresholdsFromConfig();
    const target = thresholds.overall;

    // Generate gap report
    const gapReport = generateGapReport(coverage, target);

    // Output based on format
    if (format === 'json') {
      const jsonPath = outputPath || path.join(process.cwd(), 'coverage', 'gap-report.json');
      saveJsonReport(gapReport, jsonPath);
      console.log('\n📊 Gap report generated successfully!');
      console.log(`   Files below target: ${gapReport.summary.filesBelow70}`);
      console.log(`   Estimated tests needed: ${gapReport.summary.estimatedTotalTests}`);
    } else {
      displayTextReport(gapReport);

      // Also save JSON if output path specified
      if (outputPath) {
        saveJsonReport(gapReport, outputPath);
      }
    }
  } catch (error) {
    console.error('❌ Error generating gap report:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
