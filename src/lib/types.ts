// Attendance status type - aligned with ATTENDANCE.CODES from constants
// Codes: P=Present, A=Absent, WO=Week Off, HD=Half Day, LC=Late Coming, CL=Casual Leave, L=Leave, ''=Not Marked
export type AttendanceStatus = "P" | "A" | "WO" | "HD" | "LC" | "CL" | "L" | "";

// Helper type for attendance records (day keys like "1Sun", "2Mon", etc.)
export type AttendanceRecord = Record<string, AttendanceStatus | undefined>;

export interface Employee {
  id: string;
  status?: "active" | "inactive" | "on-leave";
  email: string;
  department?: string;
  sno?: number;
  employeeId: string;
  name: string;
  ctc?: number;
  attendanceAllowance?: number;
  process?: string;
  designation?: string;
  dateOfJoining?: number;
  uanNumber?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  paymentMode?: string;
  // Attendance data - structured as Record for type safety
  attendance?: AttendanceRecord;
  // Legacy support - individual day keys (deprecated, use attendance instead)
  "1Sun"?: string;
  "2Mon"?: string;
  "3Tue"?: string;
  "4Wed"?: string;
  "5Thu"?: string;
  "6Fri"?: string;
  "7Sat"?: string;
  "8Sun"?: string;
  "9Mon"?: string;
  "10Tue"?: string;
  "11Wed"?: string;
  "12Thu"?: string;
  "13Fri"?: string;
  "14Sat"?: string;
  "15Sun"?: string;
  "16Mon"?: string;
  "17Tue"?: string;
  "18Wed"?: string;
  "19Thu"?: string;
  "20Fri"?: string;
  "21Sat"?: string;
  "22Sun"?: string;
  "23Mon"?: string;
  "24Tue"?: string;
  "25Wed"?: string;
  "26Thu"?: string;
  "27Fri"?: string;
  "28Sat"?: string;
  "29Sun"?: string;
  "30Mon"?: string;
  "31Tue"?: string;
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  halfDays?: number;
  weekOffDays?: number;
  holidayDays?: number;
  cl?: number;
  lc?: number;
  trp?: number;
  tra?: number;
  trl?: number;
  totalPresent?: number;
  overtime?: number;
  finalDays?: number;
  arrear?: number;
  advance?: number;
  shiftAllowance?: number;
  grossSalary?: number;
  attendanceDeduction?: number;
  employeeContribution?: number;
  employeeEsic?: number;
  employerContribution?: number;
  employerEsic?: number;
  tds5perc?: number;
  netSalary?: number;
  penalty?: number;
  paidAmount?: number;
  // Incentive fields
  incentiveAmount?: number;
  performanceBonus?: number;
  referralBonus?: number;
  festivalBonus?: number;
  retentionBonus?: number;
  totalIncentive?: number;
}

export interface Certificate {
  $id?: string;
  id?: string;
  employeeId?: string;
  certificateId?: string;
  employeeName?: string;
  employeeEmail?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  contactAddressLine1?: string;
  contactAddressLine2?: string;
  contactEmail?: string;
  contactPhone?: string;
  jobTitle?: string;
  department?: string;
  startDate?: string;
  typeOfEmployment?: string;
  salary?: string;
  workHoursPerWeek?: string;
  certifierName?: string;
  certifierTitle?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer' | 'mvp' | 'new_user';
  labels: string[];
  permissions: ('READ' | 'WRITE' | 'UPDATE' | 'DELETE')[];
  createdAt: string;
  status: 'active' | 'inactive';
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid' | 'other';

export interface LeaveRequest {
  $id?: string;
  id?: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  appliedOn?: string;      // ISO datetime
  reviewedBy?: string;
  reviewedOn?: string;     // ISO datetime
  remarks?: string;
  attachmentIds?: string;  // comma-separated file IDs from storage bucket
}
