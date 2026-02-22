#!/usr/bin/env tsx
/**
 * Coverage Analysis Script
 *
 * Analyzes coverage gaps and provides prioritized recommendations for testing.
 *
 * Usage:
 *   npm run analyze-coverage
 */

import { generateCoverageReport, loadThresholdsFromConfig } from '../src/test/testSuiteManager';
import { identifyGaps, prioritizeFiles, suggestTests } from '../src/test/coverageAnalyzer';

async function main() {
  console.log('🔍 Analyzing test coverage...\n');

  try {
    // Generate coverage report
    console.log('📊 Generating coverage report...');
    const report = await generateCoverageReport();

    console.log(`\n✅ Coverage report generated`);
    console.log(`   Overall coverage: ${report.overall.lines.pct.toFixed(2)}%`);
    console.log(`   Files analyzed: ${report.byFile.size}`);
    console.log(`   Uncovered lines: ${report.uncoveredLines.length}`);

    // Load thresholds
    const thresholds = loadThresholdsFromConfig();
    console.log(`\n🎯 Target coverage: ${thresholds.overall}%`);

    // Identify gaps
    console.log('\n🔎 Identifying coverage gaps...');
    const gaps = identifyGaps(report, thresholds.overall);

    if (gaps.length === 0) {
      console.log('\n🎉 All files meet the coverage target!');
      return;
    }

    console.log(`\n⚠️  Found ${gaps.length} files below target coverage`);

    // Prioritize files
    const prioritized = prioritizeFiles(gaps);

    // Group by priority
    const byPriority = {
      P0: prioritized.filter((f) => f.priority === 'P0'),
      P1: prioritized.filter((f) => f.priority === 'P1'),
      P2: prioritized.filter((f) => f.priority === 'P2'),
      P3: prioritized.filter((f) => f.priority === 'P3'),
    };

    console.log('\n📋 Priority Breakdown:');
    console.log(`   P0 (Critical): ${byPriority.P0.length} files`);
    console.log(`   P1 (High):     ${byPriority.P1.length} files`);
    console.log(`   P2 (Medium):   ${byPriority.P2.length} files`);
    console.log(`   P3 (Low):      ${byPriority.P3.length} files`);

    // Show top 10 priority files
    console.log('\n🎯 Top 10 Priority Files:\n');

    prioritized.slice(0, 10).forEach((file, index) => {
      const gap = gaps.find((g) => g.file === file.file)!;
      console.log(`${index + 1}. ${file.file}`);
      console.log(`   Priority: ${file.priority}`);
      console.log(
        `   Coverage: ${gap.currentCoverage.toFixed(1)}% (target: ${gap.targetCoverage}%)`
      );
      console.log(`   Uncovered lines: ${gap.uncoveredLines}`);
      console.log(`   Estimated tests: ${file.estimatedTests}`);
      console.log(`   Impact score: ${file.impact.toFixed(0)}`);
      console.log(`   Reason: ${file.reason}`);
      console.log('');
    });

    // Show test suggestions for top file
    if (prioritized.length > 0) {
      const topFile = prioritized[0];
      console.log(`\n💡 Test Suggestions for ${topFile.file}:\n`);

      const suggestions = suggestTests(topFile.file);
      suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion.type.toUpperCase()} TEST`);
        console.log(`   ${suggestion.description}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n📈 Summary:');
    console.log(`   Total files needing tests: ${gaps.length}`);
    console.log(
      `   Estimated total tests: ${prioritized.reduce((sum, f) => sum + f.estimatedTests, 0)}`
    );
    console.log(`   Coverage gap: ${(thresholds.overall - report.overall.lines.pct).toFixed(2)}%`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Focus on P0 (Critical) files first');
    console.log('   2. Use test suggestions to create test files');
    console.log('   3. Run tests and verify coverage improvement');
    console.log('   4. Track progress with trackProgress() function');
  } catch (error) {
    console.error('\n❌ Error analyzing coverage:', error);
    process.exit(1);
  }
}

main();
