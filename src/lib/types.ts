export interface Employee {
  // Identifiers
  id: string;
  serialNo?: number;

  // Personal Information
  name: string;
  email: string;
  phone?: string;

  // Employment Information
  designation: string;
  department?: string;
  process?: string;
  dateOfJoining: string;
  paymentMode?: string;

  // Financial Information
  ctc?: number;
  grossSalary?: number;
  netSalary?: number;
  status?: "active" | "inactive" | "on-leave";

  // Allowances
  attendanceAllowance?: number;
  shiftAllowance?: number;
  advance?: number;
  arrear?: number;

  // Deductions
  tds?: number;
  penalty?: number;
  paidAmount?: number;

  // Bank Details
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;

  // Government IDs
  uanNumber?: string;

  // Attendance Tracking
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  halfDays?: number;
  weekOffDays?: number;
  holidayDays?: number;
  casualLeave?: number;
  limitedConsent?: number;
  trainingPresent?: number;
  trainingAbsent?: number;
  trainingLeave?: number;
  totalPresent?: number;
  overtime?: number;
  finalDays?: number;
  attendanceDeduction?: number;
  attendancePercentage?: number;

  // Contributions
  employeeContribution?: number;
  employeeEsic?: number;
  employerContribution?: number;
  employerEsic?: number;

  // Daily Attendance (28 days)
  dailyAttendance?: Array<{
    day: number;
    dayOfWeek: "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
    status: string;
  }>;
}

export interface Certificate {
  $id?: string;
  id?: string;
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
