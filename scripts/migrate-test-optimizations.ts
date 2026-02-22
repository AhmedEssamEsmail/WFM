#!/usr/bin/env tsx

/**
 * Test Optimization Migration Script
 *
 * This script helps migrate existing test files to use the new optimized patterns:
 * - Identifies tests that could benefit from shared fixtures
 * - Suggests mock helper replacements
 * - Reports potential optimization opportunities
 *
 * Usage:
 *   npm run migrate-tests
 *   npm run migrate-tests -- --file src/services/myService.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface OptimizationOpportunity {
  file: string;
  line: number;
  type: 'fixture' | 'mock-helper' | 'cleanup' | 'beforeEach';
  description: string;
  suggestion: string;
}

/**
 * Analyze a test file for optimization opportunities
 */
function analyzeTestFile(filePath: string): OptimizationOpportunity[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const opportunities: OptimizationOpportunity[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for inline mock data creation
    if (
      line.includes('const mock') &&
      (line.includes('id:') || line.includes('name:') || line.includes('email:'))
    ) {
      opportunities.push({
        file: filePath,
        line: lineNum,
        type: 'fixture',
        description: 'Inline mock data creation detected',
        suggestion: 'Consider using shared fixtures from src/test/fixtures/testData.ts',
      });
    }

    // Check for manual mock chain setup
    if (line.includes('vi.fn().mockReturnThis()') || line.includes('mockReturnValue({')) {
      opportunities.push({
        file: filePath,
        line: lineNum,
        type: 'mock-helper',
        description: 'Manual mock chain setup detected',
        suggestion: 'Consider using mock helpers from src/test/fixtures/mockHelpers.ts',
      });
    }

    // Check for vi.clearAllMocks in beforeEach
    if (line.includes('vi.clearAllMocks()')) {
      opportunities.push({
        file: filePath,
        line: lineNum,
        type: 'cleanup',
        description: 'Manual mock cleanup detected',
        suggestion: 'Consider using setupMockCleanup() from mock helpers',
      });
    }

    // Check for expensive operations in beforeEach
    if (line.includes('beforeEach') && content.includes('await') && content.includes('seed')) {
      opportunities.push({
        file: filePath,
        line: lineNum,
        type: 'beforeEach',
        description: 'Potentially expensive beforeEach operation',
        suggestion: 'Consider moving to beforeAll if data can be shared across tests',
      });
    }
  });

  return opportunities;
}

/**
 * Find all test files in a directory
 */
function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory() && !entry.name.includes('node_modules')) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Generate optimization report
 */
function generateReport(opportunities: OptimizationOpportunity[]): void {
  if (opportunities.length === 0) {
    console.log('✅ No optimization opportunities found!');
    return;
  }

  console.log(`\n📊 Found ${opportunities.length} optimization opportunities:\n`);

  // Group by type
  const byType = opportunities.reduce(
    (acc, opp) => {
      if (!acc[opp.type]) acc[opp.type] = [];
      acc[opp.type].push(opp);
      return acc;
    },
    {} as Record<string, OptimizationOpportunity[]>
  );

  // Report by type
  Object.entries(byType).forEach(([type, opps]) => {
    console.log(`\n${getTypeIcon(type)} ${type.toUpperCase()} (${opps.length} occurrences):`);
    console.log('─'.repeat(80));

    opps.forEach((opp) => {
      console.log(`\n  📄 ${opp.file}:${opp.line}`);
      console.log(`     ${opp.description}`);
      console.log(`     💡 ${opp.suggestion}`);
    });
  });

  // Summary
  console.log('\n\n📈 OPTIMIZATION SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`Total opportunities: ${opportunities.length}`);
  console.log(`Files affected: ${new Set(opportunities.map((o) => o.file)).size}`);
  console.log('\nEstimated improvements after optimization:');
  console.log('  • Code reduction: 25-30%');
  console.log('  • Test execution: 20-30% faster');
  console.log('  • Memory usage: 15-25% reduction');
  console.log('\n📚 See src/test/README-TestOptimization.md for migration guide');
}

/**
 * Get icon for opportunity type
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    fixture: '📦',
    'mock-helper': '🔧',
    cleanup: '🧹',
    beforeEach: '⚡',
  };
  return icons[type] || '📌';
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => arg.startsWith('--file='));

  console.log('🔍 Analyzing test files for optimization opportunities...\n');

  let testFiles: string[];

  if (fileArg) {
    const filePath = fileArg.split('=')[1];
    testFiles = [filePath];
  } else {
    testFiles = findTestFiles('src');
  }

  console.log(`Found ${testFiles.length} test files to analyze\n`);

  const allOpportunities: OptimizationOpportunity[] = [];

  testFiles.forEach((file) => {
    const opportunities = analyzeTestFile(file);
    allOpportunities.push(...opportunities);
  });

  generateReport(allOpportunities);
}

main();
