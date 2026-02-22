/**
 * Property-Based Tests: Architecture Violations - Bug Condition Exploration
 * Bugfix Spec: architecture-violations-fix
 *
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the architecture violations exist.
 *
 * This test validates that page components follow the service layer pattern
 * instead of making direct Supabase client calls.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Property 1: Fault Condition - Direct Supabase Import Detection
 *
 * For any page component that needs to perform database operations,
 * the code SHOULD use service layer methods from src/services/
 * instead of direct Supabase client calls.
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * EXPECTED OUTCOME: This test FAILS on unfixed code (proving violations exist)
 *
 * Scoped to 4 known violating files:
 * - src/pages/LeaveRequests/LeaveBalances.tsx
 * - src/pages/LeaveRequests/CreateLeaveRequest.tsx
 * - src/pages/SwapRequests/CreateSwapRequest.tsx
 * - src/pages/Schedule/ScheduleUpload.tsx
 */
describe('Architecture Violations - Bug Condition Exploration', () => {
  // The 4 files known to have architecture violations
  const violatingFiles = [
    'src/pages/LeaveRequests/LeaveBalances.tsx',
    'src/pages/LeaveRequests/CreateLeaveRequest.tsx',
    'src/pages/SwapRequests/CreateSwapRequest.tsx',
    'src/pages/Schedule/ScheduleUpload.tsx',
  ];

  /**
   * Helper function to check if a file contains direct Supabase imports
   */
  function hasDirectSupabaseImport(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8');
      // Check for direct import of supabase from lib/supabase
      const importPattern = /import\s+{\s*supabase\s*}\s+from\s+['"].*\/lib\/supabase['"]/;
      return importPattern.test(content);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Helper function to find direct Supabase database calls in a file
   */
  function findDirectSupabaseCalls(filePath: string): Array<{ line: number; call: string }> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const violations: Array<{ line: number; call: string }> = [];

      // Patterns for direct Supabase calls
      const callPatterns = [
        /supabase\.from\([^)]+\)\.select\(/,
        /supabase\.from\([^)]+\)\.insert\(/,
        /supabase\.from\([^)]+\)\.update\(/,
        /supabase\.from\([^)]+\)\.delete\(/,
        /supabase\.from\([^)]+\)\.upsert\(/,
      ];

      lines.forEach((line, index) => {
        for (const pattern of callPatterns) {
          if (pattern.test(line)) {
            violations.push({
              line: index + 1,
              call: line.trim(),
            });
          }
        }
      });

      return violations;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  it('Property 1: Page components should NOT contain direct Supabase imports', () => {
    fc.assert(
      fc.property(fc.constantFrom(...violatingFiles), (filePath) => {
        // Check if file has direct Supabase import
        const hasImport = hasDirectSupabaseImport(filePath);

        // EXPECTED: This should FAIL on unfixed code
        // When it fails, it proves the architecture violations exist
        expect(hasImport).toBe(false);

        // If we reach here without failing, log for debugging
        if (hasImport) {
          console.log(`\n❌ VIOLATION FOUND: ${filePath}`);
          console.log(
            '   Contains direct Supabase import: import { supabase } from "../../lib/supabase"'
          );
        }
      }),
      { numRuns: violatingFiles.length }
    );
  });

  it('Property 1: Page components should NOT contain direct Supabase database calls', () => {
    fc.assert(
      fc.property(fc.constantFrom(...violatingFiles), (filePath) => {
        // Find all direct Supabase calls
        const violations = findDirectSupabaseCalls(filePath);

        // EXPECTED: This should FAIL on unfixed code
        // When it fails, it documents the specific violations
        expect(violations.length).toBe(0);

        // If we reach here without failing, log violations for documentation
        if (violations.length > 0) {
          console.log(`\n❌ VIOLATIONS FOUND in ${filePath}:`);
          violations.forEach(({ line, call }) => {
            console.log(`   Line ${line}: ${call}`);
          });
          console.log(`   Total violations: ${violations.length}`);
        }
      }),
      { numRuns: violatingFiles.length }
    );
  });

  /**
   * Comprehensive violation report test
   * This test documents ALL violations across all files
   */
  it('Property 1: Comprehensive architecture violation report', () => {
    const allViolations: Record<
      string,
      { hasImport: boolean; calls: Array<{ line: number; call: string }> }
    > = {};

    violatingFiles.forEach((filePath) => {
      const hasImport = hasDirectSupabaseImport(filePath);
      const calls = findDirectSupabaseCalls(filePath);

      allViolations[filePath] = {
        hasImport,
        calls,
      };
    });

    // Count total violations
    const filesWithImports = Object.values(allViolations).filter((v) => v.hasImport).length;
    const totalCalls = Object.values(allViolations).reduce((sum, v) => sum + v.calls.length, 0);

    // Log comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('ARCHITECTURE VIOLATION REPORT - Bug Condition Exploration');
    console.log('='.repeat(80));
    console.log(
      `\nFiles with direct Supabase imports: ${filesWithImports}/${violatingFiles.length}`
    );
    console.log(`Total direct database calls found: ${totalCalls}\n`);

    Object.entries(allViolations).forEach(([filePath, { hasImport, calls }]) => {
      console.log(`\n📄 ${filePath}`);
      console.log(`   Direct import: ${hasImport ? '❌ YES' : '✅ NO'}`);
      console.log(`   Direct calls: ${calls.length}`);

      if (calls.length > 0) {
        console.log('   Violations:');
        calls.forEach(({ line, call }) => {
          console.log(
            `     • Line ${line}: ${call.substring(0, 80)}${call.length > 80 ? '...' : ''}`
          );
        });
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('EXPECTED: This test should FAIL on unfixed code');
    console.log('Failure confirms the architecture violations exist');
    console.log('='.repeat(80) + '\n');

    // EXPECTED: This assertion should FAIL on unfixed code
    expect(filesWithImports).toBe(0);
    expect(totalCalls).toBe(0);
  });
});
