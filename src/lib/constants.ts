/**
 * Application-wide constants for forms, UI, and business logic
 * Centralized to avoid magic numbers/strings and ensure consistency
 */

/**
 * Attendance constants
 */
export const ATTENDANCE = {
  CODES: ['P', 'A', 'WO', 'HD', 'LC', 'CL', 'L', ''] as const,
  CODE_LABELS: {
    P: 'Present',
    A: 'Absent',
    WO: 'Week Off',
    HD: 'Half Day',
    LC: 'Leave Casualty',
    CL: 'Casual Leave',
    L: 'Leave',
    '': 'Not Marked',
  } as const,
} as const;

/**
 * Employee form/edit constants
 */
export const EMPLOYEE_FORM = {
  STATUS_OPTIONS: ['active', 'inactive', 'on-leave'] as const,
  DEPARTMENTS: [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Support',
    'Management',
  ] as const,
  ROLES: [
    'Manager',
    'Developer',
    'Designer',
    'Analyst',
    'Executive',
    'Coordinator',
    'Specialist',
  ] as const,
} as const;

/**
 * UI/UX constants
 */
export const UI = {
  PAGINATION: {
    ITEMS_PER_PAGE: 10,
    ITEMS_PER_PAGE_SMALL: 5,
  },
  SEARCH: {
    DEBOUNCE_MS: 300,
  },
  ANIMATIONS: {
    TRANSITION_DURATION: 200,
  },
} as const;

/**
 * Date and time constants
 */
export const DATE = {
  EXCEL_EPOCH_DAYS: 25567, // Days between Excel epoch (1899-12-30) and Unix epoch (1970-01-01)
} as const;

/**
 * Certificate constants
 */
export const CERTIFICATE = {
  BUCKET_NAME: 'certificates',
  FILE_EXTENSION: 'pdf',
  NAMING_PATTERN: '{employeeId}.{extension}', // e.g., EMP001.pdf
} as const;
