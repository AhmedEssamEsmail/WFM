/**
 * Coverage Analyzer
 *
 * Analyzes coverage gaps and prioritizes testing efforts.
 * Provides test suggestions and tracks progress over time.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

import fs from 'fs';
import path from 'path';
import { CoverageReport, CoverageMetrics } from './testSuiteManager';
import { minimatch } from 'minimatch';

/**
 * Priority levels for testing
 */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * Coverage gap information
 */
export interface CoverageGap {
  file: string;
  category: string;
  currentCoverage: number;
  targetCoverage: number;
  uncoveredLines: number;
  priority: Priority;
}

/**
 * Prioritized file with testing recommendations
 */
export interface PrioritizedFile {
  file: string;
  priority: Priority;
  reason: string;
  estimatedTests: number;
  impact: number;
}

/**
 * Test suggestion for uncovered code
 */
export interface TestSuggestion {
  type: 'unit' | 'integration' | 'property';
  description: string;
  template: string;
  uncoveredLines: number[];
}

/**
 * Progress tracking information
 */
export interface ProgressReport {
  delta: number;
  improvedFiles: string[];
  regressedFiles: string[];
  filesReachedTarget: number;
  summary: string;
}

/**
 * Priority configuration
 */
export interface PriorityConfig {
  p0: string[];
  p1: string[];
  p2: string[];
  p3: string[];
}

/**
 * Identify files with coverage below target threshold.
 *
 * Preconditions:
 * - report contains valid coverage data
 * - target is between 0 and 100
 * - All files in report have valid metrics
 *
 * Postconditions:
 * - Returns array of gaps sorted by priority
 * - Each gap has valid priority assignment
 * - Gaps only include files below target coverage
 *
 * Loop Invariants:
 * - All processed files have valid coverage metrics
 * - Gap priority is correctly calculated for each file
 *
 * @param report Current coverage report
 * @param target Target coverage percentage
 * @returns Array of coverage gaps sorted by priority
 */
export function identifyGaps(report: CoverageReport, target: number): CoverageGap[] {
  // Validate preconditions
  if (target < 0 || target > 100) {
    throw new Error(`Invalid target coverage: ${target}. Must be between 0 and 100.`);
  }

  if (report.overall.lines.pct < 0) {
    throw new Error('Invalid coverage report: overall coverage is negative');
  }

  const gaps: CoverageGap[] = [];
  const priorityConfig = loadPriorityConfig();

  // Identify files below target
  for (const [filePath, metrics] of report.byFile) {
    // Validate loop invariant: metrics are valid
    if (metrics.lines.pct < 0 || metrics.lines.pct > 100) {
      throw new Error(`Invalid coverage percentage for ${filePath}: ${metrics.lines.pct}`);
    }

    if (metrics.lines.pct < target) {
      const category = categorizeFile(filePath);
      const priority = calculatePriority(filePath, priorityConfig);
      const uncoveredLines = report.uncoveredLines
        .filter((line) => line.file === filePath)
        .map((line) => line.line);

      gaps.push({
        file: filePath,
        category,
        currentCoverage: metrics.lines.pct,
        targetCoverage: target,
        uncoveredLines: uncoveredLines.length,
        priority,
      });
    }
  }

  // Sort by priority (P0 > P1 > P2 > P3)
  const sortedGaps = sortByPriority(gaps);

  // Validate postconditions
  for (const gap of sortedGaps) {
    if (!['P0', 'P1', 'P2', 'P3'].includes(gap.priority)) {
      throw new Error(`Invalid priority for ${gap.file}: ${gap.priority}`);
    }
  }

  return sortedGaps;
}

/**
 * Prioritize files for testing based on priority and impact.
 *
 * Preconditions:
 * - gaps is non-empty array
 * - Each gap has valid priority field
 * - Each gap has valid file path
 *
 * Postconditions:
 * - Returns array sorted by priority (P0 first)
 * - All input gaps are represented in output
 * - Each file has estimated test count
 * - Impact score is calculated for each file
 *
 * Loop Invariants:
 * - All processed gaps maintain their priority
 * - Sorting order is preserved
 *
 * @param gaps Array of coverage gaps
 * @returns Array of prioritized files with recommendations
 */
export function prioritizeFiles(gaps: CoverageGap[]): PrioritizedFile[] {
  const prioritized: PrioritizedFile[] = [];

  for (const gap of gaps) {
    // Validate precondition: valid priority
    if (!['P0', 'P1', 'P2', 'P3'].includes(gap.priority)) {
      throw new Error(`Invalid priority for ${gap.file}: ${gap.priority}`);
    }

    // Calculate estimated tests needed
    const coverageDelta = gap.targetCoverage - gap.currentCoverage;
    const estimatedTests = Math.max(1, Math.ceil(gap.uncoveredLines / 10)); // Rough estimate: 1 test per 10 lines, minimum 1

    // Calculate impact score (higher is more impactful)
    const impact = calculateImpact(gap);

    // Generate reason based on priority and category
    const reason = generatePriorityReason(gap);

    prioritized.push({
      file: gap.file,
      priority: gap.priority,
      reason,
      estimatedTests,
      impact,
    });
  }

  // Sort by priority first, then by impact within same priority
  prioritized.sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.impact - a.impact; // Higher impact first
  });

  // Validate postcondition: all gaps represented
  if (prioritized.length !== gaps.length) {
    throw new Error('Not all gaps were prioritized');
  }

  return prioritized;
}

/**
 * Suggest appropriate test types for a file with coverage gaps.
 *
 * Preconditions:
 * - file path is valid and exists
 * - file has coverage gaps
 *
 * Postconditions:
 * - Returns array of test suggestions
 * - Each suggestion has valid type
 * - Suggestions are appropriate for file type
 *
 * @param file Path to file needing tests
 * @returns Array of test suggestions
 */
export function suggestTests(file: string): TestSuggestion[] {
  const suggestions: TestSuggestion[] = [];
  const category = categorizeFile(file);

  // Determine appropriate test types based on file category
  if (category === 'services') {
    // Services need unit tests with mocks
    suggestions.push({
      type: 'unit',
      description: 'Test service methods with mocked Supabase client',
      template: generateServiceTestTemplate(file),
      uncoveredLines: [],
    });

    // Services with complex logic need property tests
    if (hasComplexLogic(file)) {
      suggestions.push({
        type: 'property',
        description: 'Test business logic properties with fast-check',
        template: generatePropertyTestTemplate(file),
        uncoveredLines: [],
      });
    }

    // Critical services need integration tests
    if (isCriticalPath(file)) {
      suggestions.push({
        type: 'integration',
        description: 'Test complete workflow with real Supabase instance',
        template: generateIntegrationTestTemplate(file),
        uncoveredLines: [],
      });
    }
  } else if (category === 'validation') {
    // Validation schemas need unit tests
    suggestions.push({
      type: 'unit',
      description: 'Test validation schemas with valid and invalid inputs',
      template: generateValidationTestTemplate(file),
      uncoveredLines: [],
    });

    // Validation can benefit from property tests
    suggestions.push({
      type: 'property',
      description: 'Test validation consistency with generated inputs',
      template: generatePropertyTestTemplate(file),
      uncoveredLines: [],
    });
  } else if (category === 'utils') {
    // Utils need unit tests
    suggestions.push({
      type: 'unit',
      description: 'Test utility functions with various inputs',
      template: generateUtilTestTemplate(file),
      uncoveredLines: [],
    });
  } else if (category === 'contexts') {
    // Context providers need unit tests
    suggestions.push({
      type: 'unit',
      description: 'Test context provider state management',
      template: generateContextTestTemplate(file),
      uncoveredLines: [],
    });
  } else if (category === 'components') {
    // Components need unit tests
    suggestions.push({
      type: 'unit',
      description: 'Test component rendering and interactions',
      template: generateComponentTestTemplate(file),
      uncoveredLines: [],
    });
  }

  return suggestions;
}

/**
 * Track coverage progress between baseline and current reports.
 *
 * Preconditions:
 * - baseline and current are valid coverage reports
 * - baseline timestamp is before current timestamp
 *
 * Postconditions:
 * - Returns progress report with delta
 * - Delta is calculated as current - baseline
 * - Improved and regressed files are identified
 * - Files reached target count is accurate
 *
 * @param baseline Baseline coverage report
 * @param current Current coverage report
 * @param target Target coverage percentage (default: 70)
 * @returns Progress report with delta and file changes
 */
export function trackProgress(
  baseline: CoverageReport,
  current: CoverageReport,
  target: number = 70
): ProgressReport {
  // Calculate overall delta
  const delta = current.overall.lines.pct - baseline.overall.lines.pct;

  const improvedFiles: string[] = [];
  const regressedFiles: string[] = [];
  let filesReachedTarget = 0;

  // Compare per-file coverage
  for (const [filePath, currentMetrics] of current.byFile) {
    const baselineMetrics = baseline.byFile.get(filePath);

    if (baselineMetrics) {
      const fileDelta = currentMetrics.lines.pct - baselineMetrics.lines.pct;

      if (fileDelta > 0) {
        improvedFiles.push(filePath);
      } else if (fileDelta < 0) {
        regressedFiles.push(filePath);
      }

      // Check if file reached target
      if (baselineMetrics.lines.pct < target && currentMetrics.lines.pct >= target) {
        filesReachedTarget++;
      }
    } else {
      // New file in current report
      if (currentMetrics.lines.pct >= target) {
        filesReachedTarget++;
      }
    }
  }

  const summary = generateProgressSummary(
    delta,
    improvedFiles.length,
    regressedFiles.length,
    filesReachedTarget
  );

  return {
    delta,
    improvedFiles,
    regressedFiles,
    filesReachedTarget,
    summary,
  };
}

/**
 * Categorize a file based on its path.
 */
function categorizeFile(filePath: string): string {
  if (filePath.includes('/services/')) return 'services';
  if (filePath.includes('/components/')) return 'components';
  if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'utils';
  if (filePath.includes('/contexts/')) return 'contexts';
  if (filePath.includes('/hooks/')) return 'hooks';
  if (filePath.includes('/pages/')) return 'pages';
  if (filePath.includes('/validation/')) return 'validation';
  return 'other';
}

/**
 * Calculate priority for a file based on priority configuration.
 */
function calculatePriority(filePath: string, config: PriorityConfig): Priority {
  // Check P0 patterns
  for (const pattern of config.p0) {
    if (minimatch(filePath, pattern)) {
      return 'P0';
    }
  }

  // Check P1 patterns
  for (const pattern of config.p1) {
    if (minimatch(filePath, pattern)) {
      return 'P1';
    }
  }

  // Check P2 patterns
  for (const pattern of config.p2) {
    if (minimatch(filePath, pattern)) {
      return 'P2';
    }
  }

  // Check P3 patterns
  for (const pattern of config.p3) {
    if (minimatch(filePath, pattern)) {
      return 'P3';
    }
  }

  // Default to P3 if no pattern matches
  return 'P3';
}

/**
 * Sort coverage gaps by priority.
 */
function sortByPriority(gaps: CoverageGap[]): CoverageGap[] {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Calculate impact score for a coverage gap.
 */
function calculateImpact(gap: CoverageGap): number {
  // Impact is based on:
  // 1. Coverage delta (how far from target)
  // 2. Number of uncovered lines
  // 3. Category criticality

  const coverageDelta = Math.max(1, gap.targetCoverage - gap.currentCoverage);
  const categoryWeight = getCategoryWeight(gap.category);
  const uncoveredLines = Math.max(1, gap.uncoveredLines);

  return coverageDelta * uncoveredLines * categoryWeight;
}

/**
 * Get weight for a category (higher = more critical).
 */
function getCategoryWeight(category: string): number {
  const weights: Record<string, number> = {
    services: 3,
    validation: 3,
    utils: 2,
    contexts: 2,
    components: 1,
    hooks: 1,
    pages: 1,
    other: 1,
  };
  return weights[category] || 1;
}

/**
 * Generate reason for priority assignment.
 */
function generatePriorityReason(gap: CoverageGap): string {
  const reasons: Record<Priority, string> = {
    P0: `Critical ${gap.category} file with ${gap.currentCoverage.toFixed(1)}% coverage`,
    P1: `High priority ${gap.category} file with ${gap.currentCoverage.toFixed(1)}% coverage`,
    P2: `Medium priority ${gap.category} file with ${gap.currentCoverage.toFixed(1)}% coverage`,
    P3: `Low priority ${gap.category} file with ${gap.currentCoverage.toFixed(1)}% coverage`,
  };
  return reasons[gap.priority];
}

/**
 * Check if file has complex logic (heuristic).
 */
function hasComplexLogic(file: string): boolean {
  // Heuristic: files with "Service" in name likely have business logic
  return file.includes('Service') || file.includes('service');
}

/**
 * Check if file is on critical path.
 */
function isCriticalPath(file: string): boolean {
  const config = loadTestConfig();
  const criticalPaths = config.criticalPaths || [];
  return criticalPaths.some((pattern: string) => minimatch(file, pattern));
}

/**
 * Generate progress summary message.
 */
function generateProgressSummary(
  delta: number,
  improved: number,
  regressed: number,
  reachedTarget: number
): string {
  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}%` : `${delta.toFixed(2)}%`;
  return `Coverage changed by ${deltaStr}. ${improved} files improved, ${regressed} regressed, ${reachedTarget} reached target.`;
}

/**
 * Load priority configuration from test.config.json.
 */
function loadPriorityConfig(): PriorityConfig {
  const config = loadTestConfig();
  return config.priorities;
}

/**
 * Load test configuration.
 */
function loadTestConfig(): any {
  const configPath = path.join(process.cwd(), 'test.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('test.config.json not found');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// Test template generators

function generateServiceTestTemplate(file: string): string {
  const fileName = path.basename(file, '.ts');
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ${fileName} from './${fileName}';

describe('${fileName}', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
  });

  it('should handle success case', async () => {
    // TODO: Implement test
  });

  it('should handle error case', async () => {
    // TODO: Implement test
  });
});
`;
}

function generatePropertyTestTemplate(file: string): string {
  const fileName = path.basename(file, '.ts');
  return `import { describe, it } from 'vitest';
import fc from 'fast-check';
import * as ${fileName} from './${fileName}';

describe('${fileName} properties', () => {
  it('should maintain invariants', () => {
    fc.assert(
      fc.property(
        fc.record({
          // TODO: Define property test inputs
        }),
        (data) => {
          // TODO: Implement property test
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
`;
}

function generateIntegrationTestTemplate(file: string): string {
  const fileName = path.basename(file, '.ts');
  return `import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as ${fileName} from './${fileName}';

describe('${fileName} integration', () => {
  beforeEach(async () => {
    // TODO: Seed test data
  });

  afterEach(async () => {
    // TODO: Cleanup test data
  });

  it('should complete workflow end-to-end', async () => {
    // TODO: Implement integration test
  });
});
`;
}

function generateValidationTestTemplate(file: string): string {
  const fileName = path.basename(file, '.ts');
  return `import { describe, it, expect } from 'vitest';
import * as ${fileName} from './${fileName}';

describe('${fileName}', () => {
  it('should accept valid input', () => {
    // TODO: Test with valid data
  });

  it('should reject invalid input', () => {
    // TODO: Test with invalid data
  });

  it('should handle boundary conditions', () => {
    // TODO: Test edge cases
  });
});
`;
}

function generateUtilTestTemplate(file: string): string {
  const fileName = path.basename(file, '.ts');
  return `import { describe, it, expect } from 'vitest';
import * as ${fileName} from './${fileName}';

describe('${fileName}', () => {
  it('should handle typical input', () => {
    // TODO: Implement test
  });

  it('should handle edge cases', () => {
    // TODO: Test edge cases
  });
});
`;
}

function generateContextTestTemplate(file: string): string {
  const fileName = path.basename(file, '.tsx');
  return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${fileName} } from './${fileName}';

describe('${fileName}', () => {
  it('should provide context values', () => {
    // TODO: Implement test
  });

  it('should update context on state change', () => {
    // TODO: Implement test
  });
});
`;
}

function generateComponentTestTemplate(file: string): string {
  const fileName = path.basename(file, '.tsx');
  return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${fileName} } from './${fileName}';

describe('${fileName}', () => {
  it('should render correctly', () => {
    // TODO: Implement test
  });

  it('should handle user interactions', () => {
    // TODO: Implement test
  });
});
`;
}
