#!/usr/bin/env tsx
/**
 * Find slow tests in the test suite
 * Usage: tsx scripts/find-slow-tests.ts
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

console.log('🔍 Analyzing test performance...\n');

try {
  // Run tests with verbose output
  const output = execSync('npx vitest run --reporter=verbose', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer
  });

  // Parse test durations
  const testPattern = /✓\s+(.+?)\s+\((\d+)ms\)/g;
  const tests: Array<{ name: string; duration: number }> = [];

  let match;
  while ((match = testPattern.exec(output)) !== null) {
    tests.push({
      name: match[1],
      duration: parseInt(match[2], 10),
    });
  }

  // Sort by duration (slowest first)
  tests.sort((a, b) => b.duration - a.duration);

  // Get top 20 slowest tests
  const slowTests = tests.slice(0, 20);

  console.log('📊 Top 20 Slowest Tests:\n');
  console.log('Rank | Duration | Test Name');
  console.log('-'.repeat(80));

  slowTests.forEach((test, index) => {
    console.log(
      `${(index + 1).toString().padStart(4)} | ${test.duration.toString().padStart(8)}ms | ${test.name}`
    );
  });

  // Calculate statistics
  const totalTests = tests.length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
  const avgDuration = totalDuration / totalTests;
  const slowTestsThreshold = avgDuration * 3; // 3x average
  const slowTestsCount = tests.filter((t) => t.duration > slowTestsThreshold).length;

  console.log('\n📈 Statistics:');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Slow tests (>3x avg): ${slowTestsCount}`);
  console.log(`Slowest test: ${slowTests[0]?.duration}ms`);

  // Save to file
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalTests,
      totalDuration,
      avgDuration,
      slowTestsCount,
    },
    slowTests,
  };

  writeFileSync('slow-tests-report.json', JSON.stringify(report, null, 2));
  console.log('\n✅ Report saved to slow-tests-report.json');
} catch (error) {
  console.error('❌ Error analyzing tests:', error);
  process.exit(1);
}
