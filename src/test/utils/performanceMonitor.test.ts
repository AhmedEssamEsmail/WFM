/**
 * Tests for Performance Monitor
 * Validates performance tracking utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startPerformanceTracking,
  stopPerformanceTracking,
  getPerformanceMetrics,
  getAllPerformanceMetrics,
  clearPerformanceMetrics,
  generatePerformanceReport,
} from './performanceMonitor';

describe('Performance Monitor', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  describe('startPerformanceTracking', () => {
    it('should start tracking for a test suite', () => {
      startPerformanceTracking('TestSuite');
      const metrics = getPerformanceMetrics('TestSuite');

      expect(metrics).toBeDefined();
      expect(metrics?.suiteName).toBe('TestSuite');
      expect(metrics?.startTime).toBeGreaterThan(0);
      expect(metrics?.endTime).toBeUndefined();
    });
  });

  describe('stopPerformanceTracking', () => {
    it('should stop tracking and calculate duration', async () => {
      startPerformanceTracking('TestSuite');

      // Wait a bit to ensure measurable duration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = stopPerformanceTracking('TestSuite', 5);

      expect(result).toBeDefined();
      expect(result?.duration).toBeGreaterThan(0);
      expect(result?.testCount).toBe(5);
      expect(result?.endTime).toBeGreaterThan(result!.startTime);
    });

    it('should warn if tracking was not started', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      stopPerformanceTracking('NonExistentSuite');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No performance tracking started')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return metrics for a tracked suite', () => {
      startPerformanceTracking('TestSuite');
      const metrics = getPerformanceMetrics('TestSuite');

      expect(metrics).toBeDefined();
      expect(metrics?.suiteName).toBe('TestSuite');
    });

    it('should return undefined for untracked suite', () => {
      const metrics = getPerformanceMetrics('NonExistent');
      expect(metrics).toBeUndefined();
    });
  });

  describe('getAllPerformanceMetrics', () => {
    it('should return all tracked metrics', () => {
      startPerformanceTracking('Suite1');
      startPerformanceTracking('Suite2');
      startPerformanceTracking('Suite3');

      const allMetrics = getAllPerformanceMetrics();

      expect(allMetrics).toHaveLength(3);
      expect(allMetrics.map((m) => m.suiteName)).toContain('Suite1');
      expect(allMetrics.map((m) => m.suiteName)).toContain('Suite2');
      expect(allMetrics.map((m) => m.suiteName)).toContain('Suite3');
    });

    it('should return empty array when no metrics tracked', () => {
      const allMetrics = getAllPerformanceMetrics();
      expect(allMetrics).toEqual([]);
    });
  });

  describe('clearPerformanceMetrics', () => {
    it('should clear all tracked metrics', () => {
      startPerformanceTracking('Suite1');
      startPerformanceTracking('Suite2');

      expect(getAllPerformanceMetrics()).toHaveLength(2);

      clearPerformanceMetrics();

      expect(getAllPerformanceMetrics()).toHaveLength(0);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate report with metrics', async () => {
      startPerformanceTracking('Suite1');
      await new Promise((resolve) => setTimeout(resolve, 10));
      stopPerformanceTracking('Suite1', 10);

      startPerformanceTracking('Suite2');
      await new Promise((resolve) => setTimeout(resolve, 10));
      stopPerformanceTracking('Suite2', 5);

      const report = generatePerformanceReport();

      expect(report).toContain('Test Suite Performance Report');
      expect(report).toContain('Suite1');
      expect(report).toContain('Suite2');
      expect(report).toContain('Total Duration');
      expect(report).toContain('Total Tests');
    });

    it('should return message when no metrics available', () => {
      const report = generatePerformanceReport();
      expect(report).toBe('No performance metrics available');
    });
  });
});
