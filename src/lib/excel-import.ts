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
'S.No.': ['sno', (val: any) => parseNum(val)],
    'EmPl. ID': ['employeeId', (val: any) => String(val).trim()],
    'Name': ['name', (val: any) => String(val).trim()],
    'CTC': ['ctc', (val: any) => parseNum(val)],
    'Atten Allow': ['attendanceAllowance', (val: any) => parseNum(val)],
    'Process': ['process', (val: any) => String(val).trim()],
    'Designation': ['designation', (val: any) => String(val).trim()],
    'DOJ': ['dateOfJoining', (val: any) => parseNum(val)],
    'UAN NO.': ['uanNumber', (val: any) => String(val).trim()],
    'ACCOUNT NUMBER': ['accountNumber', (val: any) => String(val).trim()],
    'IFSC CODE': ['ifscCode', (val: any) => String(val).trim()],
    'BANK NAME': ['bankName', (val: any) => String(val).trim()],
    'Mode': ['paymentMode', (val: any) => String(val).trim()],
    '1-SUN': ['1Sun', (val: any) => String(val).trim()],
    '2-MON': ['2Mon', (val: any) => String(val).trim()],
    '3-TUE': ['3Tue', (val: any) => String(val).trim()],
    '4-WED': ['4Wed', (val: any) => String(val).trim()],
    '5-THU': ['5Thu', (val: any) => String(val).trim()],
    '6-FRI': ['6Fri', (val: any) => String(val).trim()],
    '7-SAT': ['7Sat', (val: any) => String(val).trim()],
    '8-SUN': ['8Sun', (val: any) => String(val).trim()],
    '9-MON': ['9Mon', (val: any) => String(val).trim()],
    '10-TUE': ['10Tue', (val: any) => String(val).trim()],
    '11-WED': ['11Wed', (val: any) => String(val).trim()],
    '12-THU': ['12Thu', (val: any) => String(val).trim()],
    '13-FRI': ['13Fri', (val: any) => String(val).trim()],
    '14-SAT': ['14Sat', (val: any) => String(val).trim()],
    '15-SUN': ['15Sun', (val: any) => String(val).trim()],
    '16-MON': ['16Mon', (val: any) => String(val).trim()],
    '17-TUE': ['17Tue', (val: any) => String(val).trim()],
    '18-WED': ['18Wed', (val: any) => String(val).trim()],
    '19-THU': ['19Thu', (val: any) => String(val).trim()],
    '20-FRI': ['20Fri', (val: any) => String(val).trim()],
    '21-SAT': ['21Sat', (val: any) => String(val).trim()],
    '22-SUN': ['22Sun', (val: any) => String(val).trim()],
    '23-MON': ['23Mon', (val: any) => String(val).trim()],
    '24-TUE': ['24Tue', (val: any) => String(val).trim()],
    '25-WED': ['25Wed', (val: any) => String(val).trim()],
    '26-THU': ['26Thu', (val: any) => String(val).trim()],
    '27-FRI': ['27Fri', (val: any) => String(val).trim()],
    '28-SAT': ['28Sat', (val: any) => String(val).trim()],
    'Present': ['presentDays', (val: any) => parseNum(val)],
    'Absent': ['absentDays', (val: any) => parseNum(val)],
    'LEAVE': ['leaveDays', (val: any) => parseNum(val)],
    'HD': ['halfDays', (val: any) => parseNum(val)],
    'WEEK OFF': ['weekOffDays', (val: any) => parseNum(val)],
    'HOILDAY': ['holidayDays', (val: any) => parseNum(val)],
    'CL': ['cl', (val: any) => parseNum(val)],
    'LC': ['lc', (val: any) => parseNum(val)],
    'TRP': ['trp', (val: any) => parseNum(val)],
    'TRA': ['tra', (val: any) => parseNum(val)],
    'TRL': ['trl', (val: any) => parseNum(val)],
    'TOTAL PRSENT': ['totalPresent', (val: any) => parseNum(val)],
    'OT': ['overtime', (val: any) => parseNum(val)],
    'Final days': ['finalDays', (val: any) => parseNum(val)],
    'Arrear': ['arrear', (val: any) => parseNum(val)],
    'Advance': ['advance', (val: any) => parseNum(val)],
    'Shift Allow': ['shiftAllowance', (val: any) => parseNum(val)],
    'EMPLOYEE PF': ['employeeContribution', (val: any) => parseNum(val)],
    'EMPLOYEE ESIC': ['employeeEsic', (val: any) => parseNum(val)],
    'EMPLOYEER PF': ['employerContribution', (val: any) => parseNum(val)],
    'EMPLOYEER ESIC': ['employerEsic', (val: any) => parseNum(val)],
    'TDS 5%': ['tds5perc', (val: any) => parseNum(val)],
    'Net Salary': ['netSalary', (val: any) => parseNum(val)],
    'Penalty': ['penalty', (val: any) => parseNum(val)],
    'Paid': ['paidAmount', (val: any) => parseNum(val)],
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
