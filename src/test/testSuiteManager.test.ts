/**
 * Tests for Test Suite Manager
 *
 * Validates coverage report generation, threshold validation, and report formats.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateThresholds,
  loadThresholdsFromConfig,
  type CoverageReport,
  type CoverageThresholds,
  type CoverageMetrics,
} from './testSuiteManager';

describe('Test Suite Manager', () => {
  describe('validateThresholds', () => {
    let mockReport: CoverageReport;

    beforeEach(() => {
      // Create a mock coverage report
      const mockMetrics: CoverageMetrics = {
        lines: { covered: 75, total: 100, pct: 75 },
        functions: { covered: 80, total: 100, pct: 80 },
        branches: { covered: 70, total: 100, pct: 70 },
        statements: { covered: 75, total: 100, pct: 75 },
      };

      mockReport = {
        timestamp: new Date(),
        overall: mockMetrics,
        byFile: new Map(),
        byCategory: new Map([
          ['services', { ...mockMetrics, lines: { covered: 65, total: 100, pct: 65 } }],
          ['components', { ...mockMetrics, lines: { covered: 80, total: 100, pct: 80 } }],
          ['utils', { ...mockMetrics, lines: { covered: 72, total: 100, pct: 72 } }],
        ]),
        uncoveredLines: [],
      };
    });

    it('should pass when all thresholds are met', () => {
      const thresholds: CoverageThresholds = {
        overall: 70,
        services: 60,
        components: 70,
        utils: 70,
      };

      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toContain('All coverage thresholds met');
    });

    it('should fail when overall threshold is not met', () => {
      const thresholds: CoverageThresholds = {
        overall: 80,
      };

      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        category: 'overall',
        current: 75,
        target: 80,
        delta: -5,
      });
    });

    it('should fail when category threshold is not met', () => {
      const thresholds: CoverageThresholds = {
        overall: 70,
        services: 70,
      };

      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        category: 'services',
        current: 65,
        target: 70,
        delta: -5,
      });
    });

    it('should report multiple violations', () => {
      const thresholds: CoverageThresholds = {
        overall: 80,
        services: 70,
        components: 85,
      };

      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(3);
      expect(result.summary).toContain('3 violation(s)');
    });

    it('should throw error for invalid threshold values', () => {
      const invalidThresholds: CoverageThresholds = {
        overall: 150,
      };

      expect(() => validateThresholds(mockReport, invalidThresholds)).toThrow(
        'Invalid threshold value'
      );
    });

    it('should throw error for negative threshold values', () => {
      const invalidThresholds: CoverageThresholds = {
        overall: -10,
      };

      expect(() => validateThresholds(mockReport, invalidThresholds)).toThrow(
        'Invalid threshold value'
      );
    });

    it('should handle missing category metrics gracefully', () => {
      const thresholds: CoverageThresholds = {
        overall: 70,
        criticalPaths: 90,
      };

      // criticalPaths category doesn't exist in mockReport
      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should validate all threshold categories', () => {
      const thresholds: CoverageThresholds = {
        overall: 70,
        services: 60,
        components: 70,
        utils: 70,
        criticalPaths: 90,
        newCode: 80,
      };

      const result = validateThresholds(mockReport, thresholds);

      expect(result.passed).toBe(true);
    });
  });

  describe('loadThresholdsFromConfig', () => {
    it('should load thresholds from test.config.json', () => {
      const thresholds = loadThresholdsFromConfig();

      expect(thresholds).toBeDefined();
      expect(thresholds.overall).toBe(70);
      expect(thresholds.services).toBe(70);
      expect(thresholds.components).toBe(70);
      expect(thresholds.utils).toBe(70);
      expect(thresholds.criticalPaths).toBe(90);
      expect(thresholds.newCode).toBe(80);
    });

    it('should validate loaded thresholds are within valid range', () => {
      const thresholds = loadThresholdsFromConfig();

      const validateRange = (value: number | undefined) => {
        if (value !== undefined) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      };

      validateRange(thresholds.overall);
      validateRange(thresholds.services);
      validateRange(thresholds.components);
      validateRange(thresholds.utils);
      validateRange(thresholds.criticalPaths);
      validateRange(thresholds.newCode);
    });
  });

  describe('Coverage Report Structure', () => {
    it('should have valid CoverageMetrics structure', () => {
      const metrics: CoverageMetrics = {
        lines: { covered: 75, total: 100, pct: 75 },
        functions: { covered: 80, total: 100, pct: 80 },
        branches: { covered: 70, total: 100, pct: 70 },
        statements: { covered: 75, total: 100, pct: 75 },
      };

      expect(metrics.lines.pct).toBeGreaterThanOrEqual(0);
      expect(metrics.lines.pct).toBeLessThanOrEqual(100);
      expect(metrics.functions.pct).toBeGreaterThanOrEqual(0);
      expect(metrics.functions.pct).toBeLessThanOrEqual(100);
      expect(metrics.branches.pct).toBeGreaterThanOrEqual(0);
      expect(metrics.branches.pct).toBeLessThanOrEqual(100);
      expect(metrics.statements.pct).toBeGreaterThanOrEqual(0);
      expect(metrics.statements.pct).toBeLessThanOrEqual(100);
    });

    it('should calculate percentage correctly', () => {
      const metrics: CoverageMetrics = {
        lines: { covered: 50, total: 100, pct: 50 },
        functions: { covered: 25, total: 50, pct: 50 },
        branches: { covered: 10, total: 20, pct: 50 },
        statements: { covered: 75, total: 150, pct: 50 },
      };

      expect(metrics.lines.pct).toBe((metrics.lines.covered / metrics.lines.total) * 100);
      expect(metrics.functions.pct).toBe(
        (metrics.functions.covered / metrics.functions.total) * 100
      );
      expect(metrics.branches.pct).toBe((metrics.branches.covered / metrics.branches.total) * 100);
      expect(metrics.statements.pct).toBe(
        (metrics.statements.covered / metrics.statements.total) * 100
      );
    });
  });

  describe('Threshold Validation Edge Cases', () => {
    it('should handle zero coverage', () => {
      const zeroMetrics: CoverageMetrics = {
        lines: { covered: 0, total: 100, pct: 0 },
        functions: { covered: 0, total: 100, pct: 0 },
        branches: { covered: 0, total: 100, pct: 0 },
        statements: { covered: 0, total: 100, pct: 0 },
      };

      const report: CoverageReport = {
        timestamp: new Date(),
        overall: zeroMetrics,
        byFile: new Map(),
        byCategory: new Map(),
        uncoveredLines: [],
      };

      const thresholds: CoverageThresholds = {
        overall: 70,
      };

      const result = validateThresholds(report, thresholds);

      expect(result.passed).toBe(false);
      expect(result.violations[0].current).toBe(0);
    });

    it('should handle 100% coverage', () => {
      const perfectMetrics: CoverageMetrics = {
        lines: { covered: 100, total: 100, pct: 100 },
        functions: { covered: 100, total: 100, pct: 100 },
        branches: { covered: 100, total: 100, pct: 100 },
        statements: { covered: 100, total: 100, pct: 100 },
      };

      const report: CoverageReport = {
        timestamp: new Date(),
        overall: perfectMetrics,
        byFile: new Map(),
        byCategory: new Map(),
        uncoveredLines: [],
      };

      const thresholds: CoverageThresholds = {
        overall: 70,
      };

      const result = validateThresholds(report, thresholds);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should handle exact threshold match', () => {
      const exactMetrics: CoverageMetrics = {
        lines: { covered: 70, total: 100, pct: 70 },
        functions: { covered: 70, total: 100, pct: 70 },
        branches: { covered: 70, total: 100, pct: 70 },
        statements: { covered: 70, total: 100, pct: 70 },
      };

      const report: CoverageReport = {
        timestamp: new Date(),
        overall: exactMetrics,
        byFile: new Map(),
        byCategory: new Map(),
        uncoveredLines: [],
      };

      const thresholds: CoverageThresholds = {
        overall: 70,
      };

      const result = validateThresholds(report, thresholds);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
