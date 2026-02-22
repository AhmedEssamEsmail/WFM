/**
 * Tests for Coverage Analyzer
 *
 * Validates gap identification, file prioritization, test suggestions, and progress tracking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  identifyGaps,
  prioritizeFiles,
  suggestTests,
  trackProgress,
  CoverageGap,
  Priority,
} from './coverageAnalyzer';
import { CoverageReport, CoverageMetrics } from './testSuiteManager';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn((path: string) => {
      if (path.includes('test.config.json')) {
        return JSON.stringify({
          thresholds: {
            overall: 70,
            services: 70,
            components: 70,
            utils: 70,
            criticalPaths: 90,
            newCode: 80,
          },
          priorities: {
            p0: ['src/services/**/*.ts', 'src/lib/validations/**/*.ts'],
            p1: ['src/lib/utils/**/*.ts', 'src/contexts/**/*.tsx'],
            p2: ['src/components/**/*.tsx'],
            p3: ['src/pages/**/*.tsx'],
          },
          criticalPaths: ['src/services/authService.ts', 'src/services/leaveRequestService.ts'],
        });
      }
      return '';
    }),
  },
}));

describe('Coverage Analyzer', () => {
  let mockReport: CoverageReport;

  beforeEach(() => {
    // Create a mock coverage report
    const createMetrics = (pct: number): CoverageMetrics => ({
      lines: { covered: pct, total: 100, pct },
      functions: { covered: pct, total: 100, pct },
      branches: { covered: pct, total: 100, pct },
      statements: { covered: pct, total: 100, pct },
    });

    mockReport = {
      timestamp: new Date(),
      overall: createMetrics(50),
      byFile: new Map([
        ['src/services/authService.ts', createMetrics(30)],
        ['src/services/leaveRequestService.ts', createMetrics(40)],
        ['src/lib/utils/dateUtils.ts', createMetrics(60)],
        ['src/components/Button.tsx', createMetrics(80)],
        ['src/pages/Dashboard.tsx', createMetrics(50)],
      ]),
      byCategory: new Map([
        ['services', createMetrics(35)],
        ['utils', createMetrics(60)],
        ['components', createMetrics(80)],
        ['pages', createMetrics(50)],
      ]),
      uncoveredLines: [
        { file: 'src/services/authService.ts', line: 10, code: 'const user = await login()' },
        { file: 'src/services/authService.ts', line: 15, code: 'return user' },
        {
          file: 'src/services/leaveRequestService.ts',
          line: 20,
          code: 'const request = await create()',
        },
      ],
    };
  });

  describe('identifyGaps', () => {
    it('should identify files below target coverage', () => {
      const gaps = identifyGaps(mockReport, 70);

      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps.every((gap) => gap.currentCoverage < 70)).toBe(true);
    });

    it('should assign correct priority to files', () => {
      const gaps = identifyGaps(mockReport, 70);

      const authServiceGap = gaps.find((g) => g.file === 'src/services/authService.ts');
      expect(authServiceGap?.priority).toBe('P0');

      const utilsGap = gaps.find((g) => g.file === 'src/lib/utils/dateUtils.ts');
      expect(utilsGap?.priority).toBe('P1');

      const pageGap = gaps.find((g) => g.file === 'src/pages/Dashboard.tsx');
      expect(pageGap?.priority).toBe('P3');
    });

    it('should sort gaps by priority (P0 > P1 > P2 > P3)', () => {
      const gaps = identifyGaps(mockReport, 70);

      for (let i = 0; i < gaps.length - 1; i++) {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        expect(priorityOrder[gaps[i].priority]).toBeLessThanOrEqual(
          priorityOrder[gaps[i + 1].priority]
        );
      }
    });

    it('should calculate uncovered lines count', () => {
      const gaps = identifyGaps(mockReport, 70);

      const authServiceGap = gaps.find((g) => g.file === 'src/services/authService.ts');
      expect(authServiceGap?.uncoveredLines).toBe(2);
    });

    it('should throw error for invalid target', () => {
      expect(() => identifyGaps(mockReport, -10)).toThrow('Invalid target coverage');
      expect(() => identifyGaps(mockReport, 150)).toThrow('Invalid target coverage');
    });

    it('should not include files above target', () => {
      const gaps = identifyGaps(mockReport, 70);

      const buttonGap = gaps.find((g) => g.file === 'src/components/Button.tsx');
      expect(buttonGap).toBeUndefined();
    });

    it('should categorize files correctly', () => {
      const gaps = identifyGaps(mockReport, 70);

      const authServiceGap = gaps.find((g) => g.file === 'src/services/authService.ts');
      expect(authServiceGap?.category).toBe('services');

      const utilsGap = gaps.find((g) => g.file === 'src/lib/utils/dateUtils.ts');
      expect(utilsGap?.category).toBe('utils');
    });
  });

  describe('prioritizeFiles', () => {
    it('should return prioritized files with all required fields', () => {
      const gaps = identifyGaps(mockReport, 70);
      const prioritized = prioritizeFiles(gaps);

      expect(prioritized.length).toBe(gaps.length);
      prioritized.forEach((file) => {
        expect(file).toHaveProperty('file');
        expect(file).toHaveProperty('priority');
        expect(file).toHaveProperty('reason');
        expect(file).toHaveProperty('estimatedTests');
        expect(file).toHaveProperty('impact');
      });
    });

    it('should sort by priority first, then by impact', () => {
      const gaps = identifyGaps(mockReport, 70);
      const prioritized = prioritizeFiles(gaps);

      // Check priority ordering
      for (let i = 0; i < prioritized.length - 1; i++) {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        const currentPriority = priorityOrder[prioritized[i].priority];
        const nextPriority = priorityOrder[prioritized[i + 1].priority];

        expect(currentPriority).toBeLessThanOrEqual(nextPriority);

        // Within same priority, higher impact should come first
        if (currentPriority === nextPriority) {
          expect(prioritized[i].impact).toBeGreaterThanOrEqual(prioritized[i + 1].impact);
        }
      }
    });

    it('should estimate tests needed', () => {
      const gaps = identifyGaps(mockReport, 70);
      const prioritized = prioritizeFiles(gaps);

      prioritized.forEach((file) => {
        expect(file.estimatedTests).toBeGreaterThan(0);
        expect(Number.isInteger(file.estimatedTests)).toBe(true);
      });
    });

    it('should calculate impact score', () => {
      const gaps = identifyGaps(mockReport, 70);
      const prioritized = prioritizeFiles(gaps);

      prioritized.forEach((file) => {
        expect(file.impact).toBeGreaterThan(0);
      });
    });

    it('should generate descriptive reasons', () => {
      const gaps = identifyGaps(mockReport, 70);
      const prioritized = prioritizeFiles(gaps);

      prioritized.forEach((file) => {
        expect(file.reason).toBeTruthy();
        expect(file.reason.length).toBeGreaterThan(0);
      });
    });

    it('should throw error for invalid priority', () => {
      const invalidGaps: CoverageGap[] = [
        {
          file: 'test.ts',
          category: 'services',
          currentCoverage: 50,
          targetCoverage: 70,
          uncoveredLines: 10,
          priority: 'INVALID' as Priority,
        },
      ];

      expect(() => prioritizeFiles(invalidGaps)).toThrow('Invalid priority');
    });
  });

  describe('suggestTests', () => {
    it('should suggest unit tests for service files', () => {
      const suggestions = suggestTests('src/services/authService.ts');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.type === 'unit')).toBe(true);
    });

    it('should suggest property tests for services with complex logic', () => {
      const suggestions = suggestTests('src/services/authService.ts');

      expect(suggestions.some((s) => s.type === 'property')).toBe(true);
    });

    it('should suggest integration tests for critical paths', () => {
      const suggestions = suggestTests('src/services/authService.ts');

      expect(suggestions.some((s) => s.type === 'integration')).toBe(true);
    });

    it('should suggest validation tests for validation files', () => {
      const suggestions = suggestTests('src/lib/validations/userSchema.ts');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.type === 'unit')).toBe(true);
    });

    it('should suggest util tests for utility files', () => {
      const suggestions = suggestTests('src/lib/utils/dateUtils.ts');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.type === 'unit')).toBe(true);
    });

    it('should suggest context tests for context providers', () => {
      const suggestions = suggestTests('src/contexts/AuthContext.tsx');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.type === 'unit')).toBe(true);
    });

    it('should suggest component tests for components', () => {
      const suggestions = suggestTests('src/components/Button.tsx');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.type === 'unit')).toBe(true);
    });

    it('should include test templates', () => {
      const suggestions = suggestTests('src/services/authService.ts');

      suggestions.forEach((suggestion) => {
        expect(suggestion.template).toBeTruthy();
        expect(suggestion.template.length).toBeGreaterThan(0);
      });
    });

    it('should include descriptions', () => {
      const suggestions = suggestTests('src/services/authService.ts');

      suggestions.forEach((suggestion) => {
        expect(suggestion.description).toBeTruthy();
        expect(suggestion.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('trackProgress', () => {
    it('should calculate coverage delta correctly', () => {
      const baseline = {
        ...mockReport,
        overall: { ...mockReport.overall, lines: { ...mockReport.overall.lines, pct: 40 } },
      };
      const current = {
        ...mockReport,
        overall: { ...mockReport.overall, lines: { ...mockReport.overall.lines, pct: 50 } },
      };

      const progress = trackProgress(baseline, current);

      expect(progress.delta).toBe(10);
    });

    it('should identify improved files', () => {
      const createMetrics = (pct: number): CoverageMetrics => ({
        lines: { covered: pct, total: 100, pct },
        functions: { covered: pct, total: 100, pct },
        branches: { covered: pct, total: 100, pct },
        statements: { covered: pct, total: 100, pct },
      });

      const baseline: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(30)],
          ['src/lib/utils/dateUtils.ts', createMetrics(60)],
        ]),
      };

      const current: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(50)],
          ['src/lib/utils/dateUtils.ts', createMetrics(60)],
        ]),
      };

      const progress = trackProgress(baseline, current);

      expect(progress.improvedFiles).toContain('src/services/authService.ts');
      expect(progress.improvedFiles).not.toContain('src/lib/utils/dateUtils.ts');
    });

    it('should identify regressed files', () => {
      const createMetrics = (pct: number): CoverageMetrics => ({
        lines: { covered: pct, total: 100, pct },
        functions: { covered: pct, total: 100, pct },
        branches: { covered: pct, total: 100, pct },
        statements: { covered: pct, total: 100, pct },
      });

      const baseline: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(50)],
          ['src/lib/utils/dateUtils.ts', createMetrics(60)],
        ]),
      };

      const current: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(30)],
          ['src/lib/utils/dateUtils.ts', createMetrics(60)],
        ]),
      };

      const progress = trackProgress(baseline, current);

      expect(progress.regressedFiles).toContain('src/services/authService.ts');
      expect(progress.regressedFiles).not.toContain('src/lib/utils/dateUtils.ts');
    });

    it('should count files that reached target', () => {
      const createMetrics = (pct: number): CoverageMetrics => ({
        lines: { covered: pct, total: 100, pct },
        functions: { covered: pct, total: 100, pct },
        branches: { covered: pct, total: 100, pct },
        statements: { covered: pct, total: 100, pct },
      });

      const baseline: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(60)],
          ['src/lib/utils/dateUtils.ts', createMetrics(50)],
        ]),
      };

      const current: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(75)],
          ['src/lib/utils/dateUtils.ts', createMetrics(55)],
        ]),
      };

      const progress = trackProgress(baseline, current, 70);

      expect(progress.filesReachedTarget).toBe(1);
    });

    it('should generate progress summary', () => {
      const baseline = { ...mockReport };
      const current = { ...mockReport };

      const progress = trackProgress(baseline, current);

      expect(progress.summary).toBeTruthy();
      expect(progress.summary.length).toBeGreaterThan(0);
    });

    it('should handle negative delta', () => {
      const baseline = {
        ...mockReport,
        overall: { ...mockReport.overall, lines: { ...mockReport.overall.lines, pct: 50 } },
      };
      const current = {
        ...mockReport,
        overall: { ...mockReport.overall, lines: { ...mockReport.overall.lines, pct: 40 } },
      };

      const progress = trackProgress(baseline, current);

      expect(progress.delta).toBe(-10);
    });

    it('should handle new files in current report', () => {
      const createMetrics = (pct: number): CoverageMetrics => ({
        lines: { covered: pct, total: 100, pct },
        functions: { covered: pct, total: 100, pct },
        branches: { covered: pct, total: 100, pct },
        statements: { covered: pct, total: 100, pct },
      });

      const baseline: CoverageReport = {
        ...mockReport,
        byFile: new Map([['src/services/authService.ts', createMetrics(30)]]),
      };

      const current: CoverageReport = {
        ...mockReport,
        byFile: new Map([
          ['src/services/authService.ts', createMetrics(30)],
          ['src/services/newService.ts', createMetrics(80)],
        ]),
      };

      const progress = trackProgress(baseline, current, 70);

      expect(progress.filesReachedTarget).toBe(1);
    });
  });
});
