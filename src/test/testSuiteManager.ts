/**
 * Test Suite Manager
 *
 * Orchestrates test execution, coverage collection, and reporting.
 * Validates coverage against configured thresholds.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Coverage metrics for a specific scope (overall, file, or category)
 */
export interface CoverageMetrics {
  lines: { covered: number; total: number; pct: number };
  functions: { covered: number; total: number; pct: number };
  branches: { covered: number; total: number; pct: number };
  statements: { covered: number; total: number; pct: number };
}

/**
 * Information about an uncovered line of code
 */
export interface UncoveredLine {
  file: string;
  line: number;
  code: string;
}

/**
 * Complete coverage report with overall, per-file, and per-category metrics
 */
export interface CoverageReport {
  timestamp: Date;
  overall: CoverageMetrics;
  byFile: Map<string, CoverageMetrics>;
  byCategory: Map<string, CoverageMetrics>;
  uncoveredLines: UncoveredLine[];
}

/**
 * Coverage thresholds configuration
 */
export interface CoverageThresholds {
  overall: number;
  services?: number;
  components?: number;
  utils?: number;
  criticalPaths?: number;
  newCode?: number;
}

/**
 * Threshold violation details
 */
export interface ThresholdViolation {
  category: string;
  current: number;
  target: number;
  delta: number;
}

/**
 * Result of threshold validation
 */
export interface ValidationResult {
  passed: boolean;
  violations: ThresholdViolation[];
  summary: string;
}

/**
 * Options for test execution
 */
export interface TestOptions {
  pattern?: string;
  watch?: boolean;
  coverage?: boolean;
  bail?: boolean;
}

/**
 * Test execution results
 */
export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: CoverageReport;
}

/**
 * Generate a comprehensive coverage report by executing tests with coverage enabled.
 *
 * Preconditions:
 * - Vitest is configured with coverage provider
 * - Test files exist and are executable
 * - Coverage configuration is valid
 *
 * Postconditions:
 * - Returns valid CoverageReport object
 * - Report contains overall and per-file metrics
 * - All coverage percentages are between 0 and 100
 * - Report timestamp is current
 *
 * @returns Promise resolving to a CoverageReport
 * @throws Error if test execution fails or coverage data cannot be read
 */
export async function generateCoverageReport(): Promise<CoverageReport> {
  const startTime = Date.now();

  try {
    // Execute tests with coverage enabled
    // Using --run to ensure tests complete (not watch mode)
    // Using --reporter=json to get structured output
    execSync('npm run test:coverage -- --run --reporter=json', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error) {
    // Tests may fail but we still want coverage data
    // Only throw if coverage data is not generated
    console.warn('Some tests failed, but continuing with coverage analysis');
  }

  // Read coverage data from JSON report
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');

  if (!fs.existsSync(coveragePath)) {
    throw new Error('Coverage report not found. Ensure tests ran with coverage enabled.');
  }

  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

  // Parse coverage data and build report
  const report: CoverageReport = {
    timestamp: new Date(),
    overall: calculateOverallMetrics(coverageData),
    byFile: calculateFileMetrics(coverageData),
    byCategory: calculateCategoryMetrics(coverageData),
    uncoveredLines: extractUncoveredLines(coverageData),
  };

  const duration = Date.now() - startTime;

  // Requirement 1.6: Report generation should complete within 10 seconds
  if (duration > 10000) {
    console.warn(`Coverage report generation took ${duration}ms (target: <10000ms)`);
  }

  // Validate postconditions
  validateCoverageReport(report);

  return report;
}

/**
 * Validate coverage against configured thresholds.
 *
 * Preconditions:
 * - report contains valid coverage data
 * - thresholds contains valid percentage values (0-100)
 * - All threshold categories are defined
 *
 * Postconditions:
 * - Returns validation result with pass/fail status
 * - Lists all violations if any exist
 * - Calculates delta from thresholds
 * - No mutations to input parameters
 *
 * @param report Coverage report to validate
 * @param thresholds Threshold configuration
 * @returns ValidationResult indicating pass/fail and any violations
 */
export function validateThresholds(
  report: CoverageReport,
  thresholds: CoverageThresholds
): ValidationResult {
  // Validate preconditions
  validateThresholdsConfig(thresholds);

  const violations: ThresholdViolation[] = [];

  // Check overall threshold
  if (thresholds.overall !== undefined) {
    const current = report.overall.lines.pct;
    if (current < thresholds.overall) {
      violations.push({
        category: 'overall',
        current,
        target: thresholds.overall,
        delta: current - thresholds.overall,
      });
    }
  }

  // Check category-specific thresholds
  const categoryChecks: Array<{ key: keyof CoverageThresholds; category: string }> = [
    { key: 'services', category: 'services' },
    { key: 'components', category: 'components' },
    { key: 'utils', category: 'utils' },
    { key: 'criticalPaths', category: 'criticalPaths' },
  ];

  for (const { key, category } of categoryChecks) {
    const threshold = thresholds[key];
    if (threshold !== undefined) {
      const metrics = report.byCategory.get(category);
      if (metrics) {
        const current = metrics.lines.pct;
        if (current < threshold) {
          violations.push({
            category,
            current,
            target: threshold,
            delta: current - threshold,
          });
        }
      }
    }
  }

  const passed = violations.length === 0;
  const summary = passed
    ? `All coverage thresholds met. Overall coverage: ${report.overall.lines.pct.toFixed(2)}%`
    : `Coverage validation failed with ${violations.length} violation(s)`;

  return {
    passed,
    violations,
    summary,
  };
}

/**
 * Calculate overall coverage metrics from raw coverage data.
 */
function calculateOverallMetrics(coverageData: any): CoverageMetrics {
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalStatements = 0;
  let coveredStatements = 0;

  for (const filePath in coverageData) {
    const fileData = coverageData[filePath];

    // Lines
    const lines = fileData.s || {};
    totalStatements += Object.keys(lines).length;
    coveredStatements += Object.values(lines).filter((count: any) => count > 0).length;

    // Functions
    const functions = fileData.f || {};
    totalFunctions += Object.keys(functions).length;
    coveredFunctions += Object.values(functions).filter((count: any) => count > 0).length;

    // Branches
    const branches = fileData.b || {};
    for (const branchId in branches) {
      const branchArray = branches[branchId];
      totalBranches += branchArray.length;
      coveredBranches += branchArray.filter((count: number) => count > 0).length;
    }

    // Line coverage (from statementMap)
    const statementMap = fileData.statementMap || {};
    totalLines += Object.keys(statementMap).length;
    for (const stmtId in statementMap) {
      if (lines[stmtId] > 0) {
        coveredLines++;
      }
    }
  }

  return {
    lines: {
      covered: coveredLines,
      total: totalLines,
      pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
    },
    functions: {
      covered: coveredFunctions,
      total: totalFunctions,
      pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
    },
    branches: {
      covered: coveredBranches,
      total: totalBranches,
      pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
    },
    statements: {
      covered: coveredStatements,
      total: totalStatements,
      pct: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
    },
  };
}

/**
 * Calculate per-file coverage metrics.
 */
function calculateFileMetrics(coverageData: any): Map<string, CoverageMetrics> {
  const fileMetrics = new Map<string, CoverageMetrics>();

  for (const filePath in coverageData) {
    const fileData = coverageData[filePath];

    const lines = fileData.s || {};
    const functions = fileData.f || {};
    const branches = fileData.b || {};
    const statementMap = fileData.statementMap || {};

    const totalLines = Object.keys(statementMap).length;
    let coveredLines = 0;
    for (const stmtId in statementMap) {
      if (lines[stmtId] > 0) {
        coveredLines++;
      }
    }

    const totalFunctions = Object.keys(functions).length;
    const coveredFunctions = Object.values(functions).filter((count: any) => count > 0).length;

    let totalBranches = 0;
    let coveredBranches = 0;
    for (const branchId in branches) {
      const branchArray = branches[branchId];
      totalBranches += branchArray.length;
      coveredBranches += branchArray.filter((count: number) => count > 0).length;
    }

    const totalStatements = Object.keys(lines).length;
    const coveredStatements = Object.values(lines).filter((count: any) => count > 0).length;

    fileMetrics.set(filePath, {
      lines: {
        covered: coveredLines,
        total: totalLines,
        pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      },
      functions: {
        covered: coveredFunctions,
        total: totalFunctions,
        pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      },
      branches: {
        covered: coveredBranches,
        total: totalBranches,
        pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      },
      statements: {
        covered: coveredStatements,
        total: totalStatements,
        pct: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      },
    });
  }

  return fileMetrics;
}

/**
 * Calculate per-category coverage metrics based on file paths.
 */
function calculateCategoryMetrics(coverageData: any): Map<string, CoverageMetrics> {
  const categories = new Map<string, any[]>();

  // Categorize files
  for (const filePath in coverageData) {
    const category = categorizeFile(filePath);
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(coverageData[filePath]);
  }

  // Calculate metrics for each category
  const categoryMetrics = new Map<string, CoverageMetrics>();

  for (const [category, files] of categories) {
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalStatements = 0;
    let coveredStatements = 0;

    for (const fileData of files) {
      const lines = fileData.s || {};
      const functions = fileData.f || {};
      const branches = fileData.b || {};
      const statementMap = fileData.statementMap || {};

      totalStatements += Object.keys(lines).length;
      coveredStatements += Object.values(lines).filter((count: any) => count > 0).length;

      totalFunctions += Object.keys(functions).length;
      coveredFunctions += Object.values(functions).filter((count: any) => count > 0).length;

      for (const branchId in branches) {
        const branchArray = branches[branchId];
        totalBranches += branchArray.length;
        coveredBranches += branchArray.filter((count: number) => count > 0).length;
      }

      totalLines += Object.keys(statementMap).length;
      for (const stmtId in statementMap) {
        if (lines[stmtId] > 0) {
          coveredLines++;
        }
      }
    }

    categoryMetrics.set(category, {
      lines: {
        covered: coveredLines,
        total: totalLines,
        pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
      },
      functions: {
        covered: coveredFunctions,
        total: totalFunctions,
        pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0,
      },
      branches: {
        covered: coveredBranches,
        total: totalBranches,
        pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
      },
      statements: {
        covered: coveredStatements,
        total: totalStatements,
        pct: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0,
      },
    });
  }

  return categoryMetrics;
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
 * Extract uncovered lines from coverage data.
 */
function extractUncoveredLines(coverageData: any): UncoveredLine[] {
  const uncoveredLines: UncoveredLine[] = [];

  for (const filePath in coverageData) {
    const fileData = coverageData[filePath];
    const lines = fileData.s || {};
    const statementMap = fileData.statementMap || {};

    // Read source file to get code content
    let sourceLines: string[] = [];
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        sourceLines = fs.readFileSync(fullPath, 'utf-8').split('\n');
      }
    } catch (error) {
      // Skip if file cannot be read
      continue;
    }

    for (const stmtId in statementMap) {
      if (lines[stmtId] === 0) {
        const location = statementMap[stmtId];
        const lineNumber = location.start.line;
        const code = sourceLines[lineNumber - 1] || '';

        uncoveredLines.push({
          file: filePath,
          line: lineNumber,
          code: code.trim(),
        });
      }
    }
  }

  return uncoveredLines;
}

/**
 * Validate that a coverage report meets postconditions.
 */
function validateCoverageReport(report: CoverageReport): void {
  // All coverage percentages must be between 0 and 100
  const validateMetrics = (metrics: CoverageMetrics, context: string) => {
    if (metrics.lines.pct < 0 || metrics.lines.pct > 100) {
      throw new Error(`Invalid line coverage percentage in ${context}: ${metrics.lines.pct}`);
    }
    if (metrics.functions.pct < 0 || metrics.functions.pct > 100) {
      throw new Error(
        `Invalid function coverage percentage in ${context}: ${metrics.functions.pct}`
      );
    }
    if (metrics.branches.pct < 0 || metrics.branches.pct > 100) {
      throw new Error(`Invalid branch coverage percentage in ${context}: ${metrics.branches.pct}`);
    }
    if (metrics.statements.pct < 0 || metrics.statements.pct > 100) {
      throw new Error(
        `Invalid statement coverage percentage in ${context}: ${metrics.statements.pct}`
      );
    }
  };

  validateMetrics(report.overall, 'overall');

  for (const [file, metrics] of report.byFile) {
    validateMetrics(metrics, `file ${file}`);
  }

  for (const [category, metrics] of report.byCategory) {
    validateMetrics(metrics, `category ${category}`);
  }
}

/**
 * Validate that thresholds configuration is valid.
 */
function validateThresholdsConfig(thresholds: CoverageThresholds): void {
  const validateThreshold = (value: number | undefined, name: string) => {
    if (value !== undefined && (value < 0 || value > 100)) {
      throw new Error(`Invalid threshold value for ${name}: ${value}. Must be between 0 and 100.`);
    }
  };

  validateThreshold(thresholds.overall, 'overall');
  validateThreshold(thresholds.services, 'services');
  validateThreshold(thresholds.components, 'components');
  validateThreshold(thresholds.utils, 'utils');
  validateThreshold(thresholds.criticalPaths, 'criticalPaths');
  validateThreshold(thresholds.newCode, 'newCode');
}

/**
 * Load thresholds from test.config.json.
 */
export function loadThresholdsFromConfig(): CoverageThresholds {
  const configPath = path.join(process.cwd(), 'test.config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('test.config.json not found');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.thresholds;
}
