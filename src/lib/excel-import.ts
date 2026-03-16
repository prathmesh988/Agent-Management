import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: string;
}

export interface TransformedEmployee {
  [key: string]: string;
}

/**
 * Parse Excel file and convert to JSON
 */
export function parseExcelFile(filePath: string): ExcelRow[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as ExcelRow[];
    return rows;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

/**
 * Parse Excel file from buffer
 */
export function parseExcelBuffer(buffer: Buffer): ExcelRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet) as ExcelRow[];
    return rows;
  } catch (error) {
    console.error('Error parsing Excel buffer:', error);
    throw new Error('Failed to parse Excel data');
  }
}

/**
 * Map Excel columns to database column names and convert types
 * Handles Excel data transformation to match the database schema
 */
export function transformExcelRow(row: ExcelRow): TransformedEmployee {
  const transformed: TransformedEmployee = {};

  // Helper function to parse numbers safely
  const parseNum = (val: any): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = parseFloat(String(val).trim());
    return isNaN(num) ? undefined : num;
  };

  // Map Excel columns to database fields with type conversion
  const columnMapping: Record<string, [string, (val: any) => any]> = {
    'S.No.': ['serialNo', (val) => parseNum(val)],
    'EmPl. ID': ['employeeId', (val) => String(val).trim()],
    'Name': ['name', (val) => String(val).trim()],

    'CTC': ['ctc', (val) => parseNum(val)],
    'Atten Allow': ['attendanceAllowance', (val) => parseNum(val)],

    'Process': ['process', (val) => String(val).trim()],
    'Designation': ['designation', (val) => String(val).trim()],
    'DOJ ': ['dateOfJoining', (val) => String(val).trim()],

    'UAN NO.': ['uanNumber', (val) => String(val).trim()],
    'ACCOUNT NUMBER': ['accountNumber', (val) => String(val).trim()],
    'IFSC CODE': ['ifscCode', (val) => String(val).trim()],
    'BANK NAME': ['bankName', (val) => String(val).trim()],

    'Mode': ['paymentMode', (val) => String(val).trim()],

    'Present': ['presentDays', (val) => parseNum(val)],
    'Absent': ['absentDays', (val) => parseNum(val)],
    'LEAVE': ['leaveDays', (val) => parseNum(val)],
    'HD': ['halfDays', (val) => parseNum(val)],
    'WEEK OFF': ['weekOffDays', (val) => parseNum(val)],
    'HOILDAY': ['holidayDays', (val) => parseNum(val)],

    'CL': ['cl', (val) => parseNum(val)],
    'LC': ['lc', (val) => parseNum(val)],

    'TRP': ['trp', (val) => parseNum(val)],
    'TRA': ['tra', (val) => parseNum(val)],
    'TRL': ['trl', (val) => parseNum(val)],

    'TOTAL PRSENT': ['totalPresent', (val) => parseNum(val)],
    'OT': ['overtime', (val) => parseNum(val)],
    'Final days': ['finalDays', (val) => parseNum(val)],

    'Arrear': ['arrear', (val) => parseNum(val)],
    'Advance': ['advance', (val) => parseNum(val)],
    'Shift Allow': ['shiftAllowance', (val) => parseNum(val)],

    'Gross Salary': ['grossSalary', (val) => parseNum(val)],
    'Atten': ['attendanceDeduction', (val) => parseNum(val)],
    'EMPLOYEE': ['employeeContribution', (val) => parseNum(val)],
    'EMPLOYEER': ['employerContribution', (val) => parseNum(val)],
    'TDS': ['tds', (val) => parseNum(val)],
    'Net Salary': ['netSalary', (val) => parseNum(val)],
    'Penalty': ['penalty', (val) => parseNum(val)],
    'Paid ': ['paidAmount', (val) => parseNum(val)],
  };

  // Apply column mapping with type conversion
  Object.entries(columnMapping).forEach(([excelCol, [dbCol, convertFn]]) => {
    if (row[excelCol] !== undefined && row[excelCol] !== null) {
      const converted = convertFn(row[excelCol]);
      if (converted !== undefined && converted !== null && converted !== '') {
        transformed[dbCol] = converted;
      }
    }
  });

  return transformed;
}

/**
 * Validate transformed employee data
 * Returns true if required fields are present
 */
export function validateEmployee(employee: TransformedEmployee): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!employee.employeeId || String(employee.employeeId).trim() === '') {
    errors.push('Employee ID is required');
  }
  if (!employee.name || String(employee.name).trim() === '') {
    errors.push('Name is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process entire Excel file and return transformed employees
 */
export function processExcelFile(
  filePath: string
): { employees: TransformedEmployee[]; errors: string[] } {
  const rows = parseExcelFile(filePath);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(
          `Row ${index + 1}: ${validation.errors.join(', ')}`
        );
      } else {
        employees.push(transformed);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: Failed to transform data`);
    }
  });

  return { employees, errors };
}

/**
 * Process Excel buffer and return transformed employees
 * Avoids file I/O issues with spaces in filenames
 */
export function processExcelFileFromBuffer(
  buffer: Buffer
): { employees: TransformedEmployee[]; errors: string[] } {
  const rows = parseExcelBuffer(buffer);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(
          `Row ${index + 1}: ${validation.errors.join(', ')}`
        );
      } else {
        employees.push(transformed);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: Failed to transform data`);
    }
  });

  return { employees, errors };
}

/**
 * Process Excel buffer and return transformed employees
 */
export function processExcelBuffer(
  buffer: Buffer
): { employees: TransformedEmployee[]; errors: string[] } {
  const rows = parseExcelBuffer(buffer);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(
          `Row ${index + 1}: ${validation.errors.join(', ')}`
        );
      } else {
        employees.push(transformed);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: Failed to transform data`);
    }
  });

  return { employees, errors };
}
