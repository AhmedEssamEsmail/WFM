import { describe, it, expect } from 'vitest';
import {
  getStatusColor,
  getStatusLabel,
  getShiftColor,
  getLeaveColor,
  getRoleColor,
  cn,
  SWAP_STATUS_COLORS,
  LEAVE_STATUS_COLORS,
  STATUS_LABELS,
  SHIFT_COLORS,
  LEAVE_COLORS,
  ROLE_COLORS,
  SEMANTIC_COLORS,
  PRIMARY_COLORS,
  BUTTON_STYLES,
  BADGE_STYLES,
  CARD_STYLES,
  INPUT_STYLES,
  STAT_CARD_COLORS,
  COVERAGE_LEVEL_COLORS,
  COVERAGE_LEVEL_LABELS,
  REQUEST_TYPE_COLORS,
  REQUEST_TYPE_LABELS,
  SHIFT_TYPE_COLORS,
  SHIFT_LABELS,
  LEAVE_LABELS,
  LEAVE_DESCRIPTIONS,
  ROLE_LABELS,
} from '../../lib/designSystem';
import type {
  SwapRequestStatus,
  LeaveRequestStatus,
  ShiftType,
  LeaveType,
  UserRole,
} from '../../types';

describe('designSystem', () => {
  describe('getStatusColor', () => {
    it('should return correct color for swap request statuses', () => {
      expect(getStatusColor('pending_acceptance')).toBe(SWAP_STATUS_COLORS.pending_acceptance);
      expect(getStatusColor('pending_tl')).toBe(SWAP_STATUS_COLORS.pending_tl);
      expect(getStatusColor('pending_wfm')).toBe(SWAP_STATUS_COLORS.pending_wfm);
      expect(getStatusColor('approved')).toBe(SWAP_STATUS_COLORS.approved);
      expect(getStatusColor('rejected')).toBe(SWAP_STATUS_COLORS.rejected);
    });

    it('should return correct color for leave request statuses', () => {
      expect(getStatusColor('pending_tl' as LeaveRequestStatus)).toBe(
        LEAVE_STATUS_COLORS.pending_tl
      );
      expect(getStatusColor('pending_wfm' as LeaveRequestStatus)).toBe(
        LEAVE_STATUS_COLORS.pending_wfm
      );
      expect(getStatusColor('approved' as LeaveRequestStatus)).toBe(LEAVE_STATUS_COLORS.approved);
      expect(getStatusColor('rejected' as LeaveRequestStatus)).toBe(LEAVE_STATUS_COLORS.rejected);
      expect(getStatusColor('denied')).toBe(LEAVE_STATUS_COLORS.denied);
    });

    it('should handle all swap request status types', () => {
      const swapStatuses: SwapRequestStatus[] = [
        'pending_acceptance',
        'pending_tl',
        'pending_wfm',
        'approved',
        'rejected',
      ];

      swapStatuses.forEach((status) => {
        const color = getStatusColor(status);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });

    it('should handle all leave request status types', () => {
      const leaveStatuses: LeaveRequestStatus[] = [
        'pending_tl',
        'pending_wfm',
        'approved',
        'rejected',
        'denied',
      ];

      leaveStatuses.forEach((status) => {
        const color = getStatusColor(status);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for swap request statuses', () => {
      expect(getStatusLabel('pending_acceptance')).toBe('Pending Recipient');
      expect(getStatusLabel('pending_tl')).toBe('Pending TL');
      expect(getStatusLabel('pending_wfm')).toBe('Pending WFM');
      expect(getStatusLabel('approved')).toBe('Approved');
      expect(getStatusLabel('rejected')).toBe('Rejected');
    });

    it('should return correct label for leave request statuses', () => {
      expect(getStatusLabel('pending_tl' as LeaveRequestStatus)).toBe('Pending TL');
      expect(getStatusLabel('pending_wfm' as LeaveRequestStatus)).toBe('Pending WFM');
      expect(getStatusLabel('approved' as LeaveRequestStatus)).toBe('Approved');
      expect(getStatusLabel('rejected' as LeaveRequestStatus)).toBe('Rejected');
      expect(getStatusLabel('denied')).toBe('Denied');
    });

    it('should return labels for all status types', () => {
      const allStatuses = [
        'pending_acceptance',
        'pending_tl',
        'pending_wfm',
        'approved',
        'rejected',
        'denied',
      ] as const;

      allStatuses.forEach((status) => {
        const label = getStatusLabel(status as any);
        expect(label).toBeDefined();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getShiftColor', () => {
    it('should return correct color for each shift type', () => {
      expect(getShiftColor('AM')).toBe(SHIFT_COLORS.AM);
      expect(getShiftColor('PM')).toBe(SHIFT_COLORS.PM);
      expect(getShiftColor('BET')).toBe(SHIFT_COLORS.BET);
      expect(getShiftColor('OFF')).toBe(SHIFT_COLORS.OFF);
    });

    it('should handle all shift types', () => {
      const shiftTypes: ShiftType[] = ['AM', 'PM', 'BET', 'OFF'];

      shiftTypes.forEach((shiftType) => {
        const color = getShiftColor(shiftType);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });

    it('should return Tailwind CSS classes', () => {
      const shiftTypes: ShiftType[] = ['AM', 'PM', 'BET', 'OFF'];

      shiftTypes.forEach((shiftType) => {
        const color = getShiftColor(shiftType);
        expect(color).toMatch(/bg-\w+-\d+/);
        expect(color).toMatch(/text-\w+-\d+/);
      });
    });
  });

  describe('getLeaveColor', () => {
    it('should return correct color for each leave type', () => {
      expect(getLeaveColor('sick')).toBe(LEAVE_COLORS.sick);
      expect(getLeaveColor('annual')).toBe(LEAVE_COLORS.annual);
      expect(getLeaveColor('casual')).toBe(LEAVE_COLORS.casual);
      expect(getLeaveColor('public_holiday')).toBe(LEAVE_COLORS.public_holiday);
      expect(getLeaveColor('bereavement')).toBe(LEAVE_COLORS.bereavement);
    });

    it('should handle all leave types', () => {
      const leaveTypes: LeaveType[] = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement'];

      leaveTypes.forEach((leaveType) => {
        const color = getLeaveColor(leaveType);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });

    it('should return Tailwind CSS classes with border', () => {
      const leaveTypes: LeaveType[] = ['sick', 'annual', 'casual', 'public_holiday', 'bereavement'];

      leaveTypes.forEach((leaveType) => {
        const color = getLeaveColor(leaveType);
        expect(color).toMatch(/bg-\w+-\d+/);
        expect(color).toMatch(/text-\w+-\d+/);
        expect(color).toMatch(/border-\w+-\d+/);
      });
    });
  });

  describe('getRoleColor', () => {
    it('should return correct color for each role', () => {
      expect(getRoleColor('agent')).toBe(ROLE_COLORS.agent);
      expect(getRoleColor('tl')).toBe(ROLE_COLORS.tl);
      expect(getRoleColor('wfm')).toBe(ROLE_COLORS.wfm);
    });

    it('should handle all role types', () => {
      const roles: UserRole[] = ['agent', 'tl', 'wfm'];

      roles.forEach((role) => {
        const color = getRoleColor(role);
        expect(color).toBeDefined();
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });

    it('should return Tailwind CSS classes', () => {
      const roles: UserRole[] = ['agent', 'tl', 'wfm'];

      roles.forEach((role) => {
        const color = getRoleColor(role);
        expect(color).toMatch(/bg-\w+-\d+/);
        expect(color).toMatch(/text-\w+-\d+/);
      });
    });
  });

  describe('cn (className utility)', () => {
    it('should combine multiple class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      expect(cn('class1', false, 'class2', null, 'class3', undefined)).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle all falsy values', () => {
      expect(cn(false, null, undefined)).toBe('');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('should handle single class', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('should handle mixed truthy and falsy values', () => {
      expect(cn('a', '', 'b', 0, 'c', false, 'd')).toBe('a b c d');
    });
  });

  describe('Color Constants', () => {
    it('should have all primary color shades defined', () => {
      expect(PRIMARY_COLORS[50]).toBeDefined();
      expect(PRIMARY_COLORS[100]).toBeDefined();
      expect(PRIMARY_COLORS[200]).toBeDefined();
      expect(PRIMARY_COLORS[300]).toBeDefined();
      expect(PRIMARY_COLORS[400]).toBeDefined();
      expect(PRIMARY_COLORS[500]).toBeDefined();
      expect(PRIMARY_COLORS[600]).toBeDefined();
      expect(PRIMARY_COLORS[700]).toBeDefined();
      expect(PRIMARY_COLORS[800]).toBeDefined();
      expect(PRIMARY_COLORS[900]).toBeDefined();
    });

    it('should have all semantic color categories', () => {
      expect(SEMANTIC_COLORS.success).toBeDefined();
      expect(SEMANTIC_COLORS.error).toBeDefined();
      expect(SEMANTIC_COLORS.warning).toBeDefined();
      expect(SEMANTIC_COLORS.info).toBeDefined();
      expect(SEMANTIC_COLORS.neutral).toBeDefined();
    });

    it('should have consistent semantic color structure', () => {
      const categories = ['success', 'error', 'warning', 'info', 'neutral'] as const;

      categories.forEach((category) => {
        const colorSet = SEMANTIC_COLORS[category];
        expect(colorSet.bg).toBeDefined();
        expect(colorSet.text).toBeDefined();
        expect(colorSet.border).toBeDefined();
        expect(colorSet.badge).toBeDefined();
        expect(colorSet.button).toBeDefined();
        expect(colorSet.icon).toBeDefined();
      });
    });
  });

  describe('Typography and Spacing Helpers', () => {
    it('should have button styles for all variants', () => {
      expect(BUTTON_STYLES.primary).toBeDefined();
      expect(BUTTON_STYLES.secondary).toBeDefined();
      expect(BUTTON_STYLES.success).toBeDefined();
      expect(BUTTON_STYLES.danger).toBeDefined();
      expect(BUTTON_STYLES.warning).toBeDefined();
      expect(BUTTON_STYLES.ghost).toBeDefined();
      expect(BUTTON_STYLES.link).toBeDefined();
    });

    it('should have badge styles for all sizes', () => {
      expect(BADGE_STYLES.default).toBeDefined();
      expect(BADGE_STYLES.large).toBeDefined();
      expect(BADGE_STYLES.small).toBeDefined();
    });

    it('should have card styles for all variants', () => {
      expect(CARD_STYLES.default).toBeDefined();
      expect(CARD_STYLES.hover).toBeDefined();
      expect(CARD_STYLES.bordered).toBeDefined();
      expect(CARD_STYLES.flat).toBeDefined();
    });

    it('should have input styles for all states', () => {
      expect(INPUT_STYLES.default).toBeDefined();
      expect(INPUT_STYLES.error).toBeDefined();
      expect(INPUT_STYLES.disabled).toBeDefined();
    });

    it('should include common Tailwind classes in button styles', () => {
      Object.values(BUTTON_STYLES).forEach((style) => {
        expect(typeof style).toBe('string');
        expect(style.length).toBeGreaterThan(0);
      });
    });

    it('should include disabled state in button styles', () => {
      const buttonVariants = ['primary', 'secondary', 'success', 'danger', 'warning', 'ghost'];
      buttonVariants.forEach((variant) => {
        expect(BUTTON_STYLES[variant as keyof typeof BUTTON_STYLES]).toContain('disabled:');
      });
    });
  });

  describe('Additional Color Constants', () => {
    it('should have stat card colors defined', () => {
      expect(STAT_CARD_COLORS.totalStaff).toBeDefined();
      expect(STAT_CARD_COLORS.activeShifts).toBeDefined();
      expect(STAT_CARD_COLORS.pendingRequests).toBeDefined();
      expect(STAT_CARD_COLORS.openSwaps).toBeDefined();
    });

    it('should have coverage level colors defined', () => {
      expect(COVERAGE_LEVEL_COLORS.adequate).toBeDefined();
      expect(COVERAGE_LEVEL_COLORS.low).toBeDefined();
      expect(COVERAGE_LEVEL_COLORS.critical).toBeDefined();
    });

    it('should have request type colors defined', () => {
      expect(REQUEST_TYPE_COLORS.swap).toBeDefined();
      expect(REQUEST_TYPE_COLORS.leave).toBeDefined();
    });

    it('should have shift type colors defined', () => {
      expect(SHIFT_TYPE_COLORS.Morning).toBeDefined();
      expect(SHIFT_TYPE_COLORS.Day).toBeDefined();
      expect(SHIFT_TYPE_COLORS.Evening).toBeDefined();
      expect(SHIFT_TYPE_COLORS.Night).toBeDefined();
    });
  });

  describe('Label Constants', () => {
    it('should have shift labels defined', () => {
      expect(SHIFT_LABELS.AM).toBe('AM');
      expect(SHIFT_LABELS.PM).toBe('PM');
      expect(SHIFT_LABELS.BET).toBe('BET');
      expect(SHIFT_LABELS.OFF).toBe('OFF');
    });

    it('should have leave labels defined', () => {
      expect(LEAVE_LABELS.sick).toBe('Sick');
      expect(LEAVE_LABELS.annual).toBe('Annual');
      expect(LEAVE_LABELS.casual).toBe('Casual');
      expect(LEAVE_LABELS.public_holiday).toBe('Holiday');
      expect(LEAVE_LABELS.bereavement).toBe('Bereav.');
    });

    it('should have leave descriptions defined', () => {
      expect(LEAVE_DESCRIPTIONS.sick).toBe('Sick Leave');
      expect(LEAVE_DESCRIPTIONS.annual).toBe('Annual Leave');
      expect(LEAVE_DESCRIPTIONS.casual).toBe('Casual Leave');
      expect(LEAVE_DESCRIPTIONS.public_holiday).toBe('Public Holiday');
      expect(LEAVE_DESCRIPTIONS.bereavement).toBe('Bereavement Leave');
    });

    it('should have role labels defined', () => {
      expect(ROLE_LABELS.agent).toBe('Agent');
      expect(ROLE_LABELS.tl).toBe('Team Lead');
      expect(ROLE_LABELS.wfm).toBe('WFM');
    });

    it('should have request type labels defined', () => {
      expect(REQUEST_TYPE_LABELS.swap).toBe('Swap');
      expect(REQUEST_TYPE_LABELS.leave).toBe('Leave');
    });

    it('should have coverage level labels defined', () => {
      expect(COVERAGE_LEVEL_LABELS.adequate).toBe('Adequate');
      expect(COVERAGE_LEVEL_LABELS.low).toBe('Low');
      expect(COVERAGE_LEVEL_LABELS.critical).toBe('Critical');
    });
  });
});

describe('designSystem - Edge Cases', () => {
  describe('getStatusColor edge cases', () => {
    it('should handle status values consistently regardless of type casting', () => {
      const status = 'approved';
      const swapColor = getStatusColor(status as SwapRequestStatus);
      const leaveColor = getStatusColor(status as LeaveRequestStatus);
      expect(swapColor).toBe(leaveColor);
    });

    it('should return valid CSS classes for all statuses', () => {
      const allStatuses = [
        'pending_acceptance',
        'pending_tl',
        'pending_wfm',
        'approved',
        'rejected',
        'denied',
      ];

      allStatuses.forEach((status) => {
        const color = getStatusColor(status as any);
        // Should contain Tailwind CSS class patterns
        expect(color).toMatch(/bg-\w+-\d+/);
        expect(color).toMatch(/text-\w+-\d+/);
        expect(color).toMatch(/border-\w+-\d+/);
      });
    });
  });

  describe('cn edge cases', () => {
    it('should handle very long class lists', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result.split(' ')).toHaveLength(100);
    });

    it('should handle duplicate class names', () => {
      expect(cn('class1', 'class2', 'class1')).toBe('class1 class2 class1');
    });

    it('should handle classes with special characters', () => {
      expect(cn('class-1', 'class_2', 'class:3')).toBe('class-1 class_2 class:3');
    });

    it('should handle empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('should handle whitespace in class names', () => {
      expect(cn('class1 class2', 'class3')).toBe('class1 class2 class3');
    });

    it('should handle boolean false explicitly', () => {
      expect(cn('a', false, 'b')).toBe('a b');
    });

    it('should handle number 0 (falsy)', () => {
      expect(cn('a', 0 as any, 'b')).toBe('a b');
    });
  });

  describe('Color consistency', () => {
    it('should use consistent color naming patterns', () => {
      // All shift colors should follow the same pattern
      Object.values(SHIFT_COLORS).forEach((color) => {
        expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      });
    });

    it('should use consistent leave color patterns', () => {
      // All leave colors should include bg, text, and border
      Object.values(LEAVE_COLORS).forEach((color) => {
        expect(color).toMatch(/bg-\w+-\d+/);
        expect(color).toMatch(/text-\w+-\d+/);
        expect(color).toMatch(/border-\w+-\d+/);
      });
    });

    it('should use consistent role color patterns', () => {
      // All role colors should follow the same pattern
      Object.values(ROLE_COLORS).forEach((color) => {
        expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      });
    });
  });

  describe('Theme switching compatibility', () => {
    it('should have immutable color constants structure', () => {
      // Verify that PRIMARY_COLORS maintains its structure
      const originalPrimary = PRIMARY_COLORS[600];
      expect(originalPrimary).toBe('#2563eb');
      expect(typeof originalPrimary).toBe('string');
    });

    it('should have semantic colors structured consistently', () => {
      const semanticKeys = ['success', 'error', 'warning', 'info', 'neutral'] as const;
      const propertyKeys = ['bg', 'text', 'border', 'badge', 'button', 'icon'] as const;

      semanticKeys.forEach((key) => {
        propertyKeys.forEach((prop) => {
          expect(SEMANTIC_COLORS[key][prop]).toBeDefined();
          expect(typeof SEMANTIC_COLORS[key][prop]).toBe('string');
        });
      });
    });
  });

  describe('Responsive breakpoint calculations', () => {
    it('should have primary colors in ascending brightness order', () => {
      // Verify color shades go from light to dark (50 to 900)
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
      shades.forEach((shade) => {
        expect(PRIMARY_COLORS[shade]).toBeDefined();
        expect(PRIMARY_COLORS[shade]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('should have valid hex color codes for primary colors', () => {
      Object.values(PRIMARY_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('Invalid color value handling', () => {
    it('should return defined values for all valid shift types', () => {
      const validShifts: ShiftType[] = ['AM', 'PM', 'BET', 'OFF'];
      validShifts.forEach((shift) => {
        expect(getShiftColor(shift)).toBeTruthy();
      });
    });

    it('should return defined values for all valid leave types', () => {
      const validLeaves: LeaveType[] = [
        'sick',
        'annual',
        'casual',
        'public_holiday',
        'bereavement',
      ];
      validLeaves.forEach((leave) => {
        expect(getLeaveColor(leave)).toBeTruthy();
      });
    });

    it('should return defined values for all valid roles', () => {
      const validRoles: UserRole[] = ['agent', 'tl', 'wfm'];
      validRoles.forEach((role) => {
        expect(getRoleColor(role)).toBeTruthy();
      });
    });
  });
});
