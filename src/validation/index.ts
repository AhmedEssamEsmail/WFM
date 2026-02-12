/**
 * Validation module - consolidated validation logic
 * 
 * This module consolidates all validation logic from:
 * - src/utils/validation.ts
 * - src/utils/validators.ts
 * - src/lib/validations/
 * - src/services/validation/
 * 
 * Architecture:
 * - Zod schemas are the single source of truth (schemas/)
 * - Imperative validators are derived from schemas (validators.ts)
 * - All validation logic is centralized in this module
 */

// ============================================
// Common Schemas
// ============================================

export {
  uuidSchema,
  isoDateSchema,
  timeSchema,
  shortTimeSchema,
  dateRangeSchema,
  futureDateSchema,
  emailSchema,
  domainEmailSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  positiveIntegerSchema,
  nonNegativeIntegerSchema,
  nonEmptyStringSchema,
} from './schemas/common'

export type {
  UUID,
  ISODate,
  Time,
  ShortTime,
  DateRange,
  Email,
} from './schemas/common'

// ============================================
// Leave Request Schemas
// ============================================

export {
  leaveTypeSchema,
  leaveRequestCreateSchema,
  leaveRequestValidationSchema,
  leaveBalanceSchema,
  csvLeaveBalanceSchema,
} from './schemas/leaveRequest'

export type {
  LeaveRequestCreateInput,
  LeaveRequestValidationData,
  LeaveBalance,
  CSVLeaveBalanceInput,
} from './schemas/leaveRequest'

// ============================================
// Swap Request Schemas
// ============================================

export {
  shiftTypeSchema,
  swapRequestCreateSchema,
  swapRequestValidationSchema,
  csvShiftSchema,
} from './schemas/swapRequest'

export type {
  SwapRequestCreateInput,
  SwapRequestValidationData,
  CSVShiftInput,
} from './schemas/swapRequest'

// ============================================
// User Schemas
// ============================================

export {
  loginSchema,
  signupSchema,
  userRoleSchema,
  userStatusSchema,
  jobLevelSchema,
  employmentTypeSchema,
  employeeSchema,
} from './schemas/user'

export type {
  LoginInput,
  SignupInput,
  UserRole,
  UserStatus,
  JobLevel,
  EmploymentType,
  EmployeeInput,
} from './schemas/user'

// ============================================
// Break Schedule Schemas
// ============================================

export {
  breakTypeSchema,
  ruleTypeSchema,
  warningTypeSchema,
  severitySchema,
  distributionStrategySchema,
  applyModeSchema,
  breakScheduleSchema,
  breakScheduleRuleSchema,
  breakScheduleWarningSchema,
  intervalUpdateSchema,
  breakScheduleUpdateRequestSchema,
  validationViolationSchema,
  breakScheduleUpdateResponseSchema,
  agentBreakScheduleSchema,
  breakScheduleSummarySchema,
  breakScheduleResponseSchema,
  breakScheduleCSVRowSchema,
  importResultSchema,
  autoDistributeRequestSchema,
  autoDistributePreviewSchema,
  ruleUpdateSchema,
} from './schemas/breakSchedule'

export type {
  BreakType,
  RuleType,
  WarningType,
  Severity,
  DistributionStrategy,
  ApplyMode,
  BreakSchedule,
  BreakScheduleRule,
  BreakScheduleWarning,
  IntervalUpdate,
  BreakScheduleUpdateRequest,
  ValidationViolation,
  BreakScheduleUpdateResponse,
  AgentBreakSchedule,
  BreakScheduleSummary,
  BreakScheduleResponse,
  BreakScheduleCSVRow,
  ImportResult,
  AutoDistributeRequest,
  AutoDistributePreview,
  RuleUpdate,
} from './schemas/breakSchedule'

// ============================================
// Settings & Comment Schemas
// ============================================

export {
  settingsSchema,
  commentSchema,
} from './schemas/settings'

export type {
  SettingsInput,
  CommentInput,
} from './schemas/settings'

// ============================================
// Imperative Validators
// ============================================

export {
  validateUUID,
  validateDateFormat,
  validateDateRange,
  validateFutureDate,
  validateEmail,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNonEmptyString,
  validateRange,
  validateLeaveType,
  validateLeaveTypeAsync,
  validateLeaveRequestData,
  validateShiftType,
  validateShiftTypeAsync,
  validateSwapRequestData,
  isValidTimeFormat,
  isValidTimeFormatWithSeconds,
  isValidDateFormat,
  timeToMinutes,
  minutesToTime,
  isValid15MinuteInterval,
  generateIntervals,
  validateBreakOrdering,
  calculateBreakGap,
} from './validators'

export type {
  LeaveRequestValidationData as LeaveRequestValidationDataType,
  SwapRequestValidationData as SwapRequestValidationDataType,
} from './validators'

// ============================================
// Leave Balance Validation
// ============================================

export {
  validateLeaveBalance,
  checkOverlappingLeave,
  validateNoOverlappingLeave,
  validateLeaveRequest,
} from './leaveBalanceValidation'
