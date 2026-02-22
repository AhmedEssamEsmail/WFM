/**
 * Performance Monitoring Utilities for Test Suite
 *
 * Provides utilities to track and report test execution times
 * to ensure tests remain fast (< 30 seconds target)
 */

interface TestPerformanceMetrics {
  suiteName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  testCount?: number;
}

const performanceMetrics: Map<string, TestPerformanceMetrics> = new Map();

/**
 * Start tracking performance for a test suite
 * Call this in beforeAll or at the start of a test suite
 */
export function startPerformanceTracking(suiteName: string) {
  performanceMetrics.set(suiteName, {
    suiteName,
    startTime: performance.now(),
  });
}

/**
 * Stop tracking performance for a test suite
 * Call this in afterAll or at the end of a test suite
 */
export function stopPerformanceTracking(suiteName: string, testCount?: number) {
  const metrics = performanceMetrics.get(suiteName);
  if (!metrics) {
    console.warn(`No performance tracking started for suite: ${suiteName}`);
    return;
  }

  const endTime = performance.now();
  const duration = endTime - metrics.startTime;

  metrics.endTime = endTime;
  metrics.duration = duration;
  metrics.testCount = testCount;

  // Log performance metrics
  const durationSeconds = (duration / 1000).toFixed(2);
  const avgPerTest = testCount ? (duration / testCount).toFixed(2) : 'N/A';

  console.log(`\n📊 Performance Metrics for "${suiteName}":`);
  console.log(`   Duration: ${durationSeconds}s`);
  if (testCount) {
    console.log(`   Tests: ${testCount}`);
    console.log(`   Avg per test: ${avgPerTest}ms`);
  }

  // Warn if suite is slow (> 5 seconds)
  if (duration > 5000) {
    console.warn(`   ⚠️  Suite is slow (> 5s)`);
  }

  return metrics;
}

/**
 * Get performance metrics for a test suite
 */
export function getPerformanceMetrics(suiteName: string): TestPerformanceMetrics | undefined {
  return performanceMetrics.get(suiteName);
}

/**
 * Get all performance metrics
 */
export function getAllPerformanceMetrics(): TestPerformanceMetrics[] {
  return Array.from(performanceMetrics.values());
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics() {
  performanceMetrics.clear();
}

/**
 * Generate a performance report for all tracked suites
 */
export function generatePerformanceReport(): string {
  const metrics = getAllPerformanceMetrics();

  if (metrics.length === 0) {
    return 'No performance metrics available';
  }

  const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
  const totalTests = metrics.reduce((sum, m) => sum + (m.testCount || 0), 0);

  let report = '\n' + '='.repeat(60) + '\n';
  report += '📊 Test Suite Performance Report\n';
  report += '='.repeat(60) + '\n\n';

  metrics
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .forEach((m) => {
      const duration = ((m.duration || 0) / 1000).toFixed(2);
      const avgPerTest = m.testCount ? ((m.duration || 0) / m.testCount).toFixed(2) : 'N/A';

      report += `${m.suiteName}\n`;
      report += `  Duration: ${duration}s`;
      if (m.testCount) {
        report += ` | Tests: ${m.testCount} | Avg: ${avgPerTest}ms`;
      }
      report += '\n\n';
    });

  report += '='.repeat(60) + '\n';
  report += `Total Duration: ${(totalDuration / 1000).toFixed(2)}s\n`;
  report += `Total Tests: ${totalTests}\n`;
  report += `Average per Test: ${totalTests ? (totalDuration / totalTests).toFixed(2) : 'N/A'}ms\n`;
  report += '='.repeat(60) + '\n';

  return report;
}

/**
 * Helper to wrap a test suite with performance tracking
 * Usage: withPerformanceTracking('MySuite', () => { ... test suite ... })
 */
export function withPerformanceTracking(suiteName: string, testSuite: () => void) {
  startPerformanceTracking(suiteName);
  try {
    testSuite();
  } finally {
    stopPerformanceTracking(suiteName);
  }
}
