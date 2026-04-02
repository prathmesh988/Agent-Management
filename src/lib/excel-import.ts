import * as XLSX from "xlsx";

export interface ExcelRow {
  [key: string]: any;
}

export interface TransformedEmployee {
  [key: string]: string | number | null | undefined;
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
    console.log(rows[0]);
    return rows;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error("Failed to parse Excel file");
  }
}

/**
 * Parse Excel file from buffer
 */
export function parseExcelBuffer(buffer: Buffer, monthName?: string): ExcelRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    let sheetName = workbook.SheetNames[0];

    // Try to find the exact sheet instead of using index 0
    if (monthName && monthName !== "All Months") {
      const fullTarget = monthName.toLowerCase().replace(/\s+/g, '');
      const shortTarget = fullTarget.substring(0, 3);
      
      // Short target needs boundary checks so it doesn't falsely match words like 'primary' (pri-mar-y)
      const shortTargetRegex = new RegExp(`(^|[^a-z])${shortTarget}($|[^a-z])`, 'i');

      const matchedName = workbook.SheetNames.find(name => {
         // Match if it includes the full month name (allowing spaces/concatenation)
         if (name.toLowerCase().replace(/\s+/g, '').includes(fullTarget)) return true;
         // Or if it matches the 3-letter abbreviation with proper boundaries
         if (shortTargetRegex.test(name)) return true;
         return false;
      });
      
      if (matchedName) {
        sheetName = matchedName;
        console.log(`Matched sheet "${matchedName}" for month "${monthName}"`);
      } else {
        throw new Error(`Could not find a sheet matching the month '${monthName}' in this file.`);
      }
    }

    const sheet = workbook.Sheets[sheetName];
    // Use raw array mode to detect and skip sub-header rows
    const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (allRows.length < 2) return [];

    // Row 0 = actual headers, Row 1 = sub-headers (SUN/MON day names) — skip it
    const headers = allRows[0] as string[];
    // Skip row 1 (index 1) which is the sub-header row; data starts at row 2 (index 2)
    const dataRows = allRows.slice(2);

    // Build a list of keys, assigning __EMPTY / __EMPTY_1 etc. for null/undefined header cells
    // so they match what XLSX's default sheet_to_json would produce.
    // IMPORTANT: Use Array.from() to densify the potentially-sparse headers array.
    // XLSX can return sparse arrays where empty cells are holes (not even undefined),
    // and Array.map() silently skips holes — Array.from() materialises them as undefined.
    let emptyCount = 0;
    const headerCount = headers.length;
    const headerKeys: string[] = Array.from({ length: headerCount }, (_, i) => {
      const header = headers[i]; // safe even for holes — returns undefined
      if (header !== null && header !== undefined) {
        return String(header);
      }
      const key = emptyCount === 0 ? '__EMPTY' : `__EMPTY_${emptyCount}`;
      emptyCount++;
      return key;
    });

    const rows: ExcelRow[] = dataRows
      .filter((row) =>
        row.some((cell) => cell !== null && cell !== undefined && cell !== ""),
      )
      .map((row) => {
        const obj: ExcelRow = {};
        headerKeys.forEach((key, i) => {
          obj[key] = row[i];
        });
        return obj;
      });
    console.log(rows[0]);
    return rows;
  } catch (error) {
    console.error("Error parsing Excel buffer:", error);
    throw new Error("Failed to parse Excel data");
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
    if (val === null || val === undefined || val === "") return undefined;
    const num = parseFloat(String(val).trim());
    return isNaN(num) ? undefined : num;
  };

  // Map Excel columns to database fields with type conversion
  // Day columns in Excel are raw numbers (1-28), with day names in row 2 (sub-header).
  // We use the numeric keys as they appear after sheet_to_json parses row 1 as header.
  const columnMapping: Record<string, [string, (val: any) => any]> = {
    "S.No.": ["sno", (val: any) => parseNum(val)],
    "EmPl. ID": ["employeeId", (val: any) => String(val).trim()],
    Name: ["name", (val: any) => String(val).trim()],
    CTC: ["ctc", (val: any) => parseNum(val)],
    "Atten Allow": ["attendanceAllowance", (val: any) => parseNum(val)],
    Process: ["process", (val: any) => String(val).trim()],
    Designation: ["designation", (val: any) => String(val).trim()],
    // DOJ may have a trailing space in the Excel header
    DOJ: ["dateOfJoining", (val: any) => parseNum(val)],
    "DOJ ": ["dateOfJoining", (val: any) => parseNum(val)],
    "UAN NO.": ["uanNumber", (val: any) => String(val).trim()],
    "ACCOUNT NUMBER": ["accountNumber", (val: any) => String(val).trim()],
    "IFSC CODE": ["ifscCode", (val: any) => String(val).trim()],
    "BANK NAME": ["bankName", (val: any) => String(val).trim()],
    Mode: ["paymentMode", (val: any) => String(val).trim()],
    // Day columns: Excel stores them as numbers 1-28 (row 1 is the header)
    1: ["1Sun", (val: any) => String(val).trim()],
    2: ["2Mon", (val: any) => String(val).trim()],
    3: ["3Tue", (val: any) => String(val).trim()],
    4: ["4Wed", (val: any) => String(val).trim()],
    5: ["5Thu", (val: any) => String(val).trim()],
    6: ["6Fri", (val: any) => String(val).trim()],
    7: ["7Sat", (val: any) => String(val).trim()],
    8: ["8Sun", (val: any) => String(val).trim()],
    9: ["9Mon", (val: any) => String(val).trim()],
    10: ["10Tue", (val: any) => String(val).trim()],
    11: ["11Wed", (val: any) => String(val).trim()],
    12: ["12Thu", (val: any) => String(val).trim()],
    13: ["13Fri", (val: any) => String(val).trim()],
    14: ["14Sat", (val: any) => String(val).trim()],
    15: ["15Sun", (val: any) => String(val).trim()],
    16: ["16Mon", (val: any) => String(val).trim()],
    17: ["17Tue", (val: any) => String(val).trim()],
    18: ["18Wed", (val: any) => String(val).trim()],
    19: ["19Thu", (val: any) => String(val).trim()],
    20: ["20Fri", (val: any) => String(val).trim()],
    21: ["21Sat", (val: any) => String(val).trim()],
    22: ["22Sun", (val: any) => String(val).trim()],
    23: ["23Mon", (val: any) => String(val).trim()],
    24: ["24Tue", (val: any) => String(val).trim()],
    25: ["25Wed", (val: any) => String(val).trim()],
    26: ["26Thu", (val: any) => String(val).trim()],
    27: ["27Fri", (val: any) => String(val).trim()],
    28: ["28Sat", (val: any) => String(val).trim()],
    Present: ["presentDays", (val: any) => parseNum(val)],
    Absent: ["absentDays", (val: any) => parseNum(val)],
    LEAVE: ["leaveDays", (val: any) => parseNum(val)],
    HD: ["halfDays", (val: any) => parseNum(val)],
    "WEEK OFF": ["weekOffDays", (val: any) => parseNum(val)],
    HOILDAY: ["holidayDays", (val: any) => parseNum(val)],
    CL: ["cl", (val: any) => parseNum(val)],
    LC: ["lc", (val: any) => parseNum(val)],
    TRP: ["trp", (val: any) => parseNum(val)],
    TRA: ["tra", (val: any) => parseNum(val)],
    TRL: ["trl", (val: any) => parseNum(val)],
    "TOTAL PRSENT": ["totalPresent", (val: any) => parseNum(val)],
    OT: ["overtime", (val: any) => parseNum(val)],
    "Final days": ["finalDays", (val: any) => parseNum(val)],
    Arrear: ["arrear", (val: any) => parseNum(val)],
    Advance: ["advance", (val: any) => parseNum(val)],
    "Shift Allow": ["shiftAllowance", (val: any) => parseNum(val)],
    "Gross Salary": ["grossSalary", (val: any) => parseNum(val)],
    // Merged-cell column names after XLSX parsing
    // In the sheet, the merged 'Atten Allow' header cell (second occurrence) shows as 'Atten'
    // when parsed with header:1 (the sub-row underneath says 'Allow').
    'Atten': ['attendanceDeduction', (val: any) => parseNum(val)],
    'EMPLOYEE': ['employeeContribution', (val: any) => parseNum(val)],
    '__EMPTY': ['employeeEsic', (val: any) => parseNum(val)],
    'EMPLOYEER': ['employerContribution', (val: any) => parseNum(val)],
    '__EMPTY_1': ['employerEsic', (val: any) => parseNum(val)],
    'TDS': ['tds5perc', (val: any) => parseNum(val)],
    'Net Salary': ['netSalary', (val: any) => parseNum(val)],
    'Penalty': ['penalty', (val: any) => parseNum(val)],
    'Paid': ['paidAmount', (val: any) => parseNum(val)],
    'Paid ': ['paidAmount', (val: any) => parseNum(val)],
  };

  // Apply column mapping with type conversion
  Object.entries(columnMapping).forEach(([excelCol, [dbCol, convertFn]]) => {
    if (row[excelCol] !== undefined && row[excelCol] !== null) {
      const converted = convertFn(row[excelCol]);
      if (converted !== undefined && converted !== null && converted !== "") {
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
  if (!employee.employeeId || String(employee.employeeId).trim() === "") {
    errors.push("Employee ID is required");
  }
  if (!employee.name || String(employee.name).trim() === "") {
    errors.push("Name is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Process entire Excel file and return transformed employees
 */
export function processExcelFile(filePath: string): {
  employees: TransformedEmployee[];
  errors: string[];
} {
  const rows = parseExcelFile(filePath);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(`Row ${index + 1}: ${validation.errors.join(", ")}`);
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
export function processExcelFileFromBuffer(buffer: Buffer, monthName?: string): {
  employees: TransformedEmployee[];
  errors: string[];
} {
  const rows = parseExcelBuffer(buffer, monthName);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(`Row ${index + 1}: ${validation.errors.join(", ")}`);
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
export function processExcelBuffer(buffer: Buffer, monthName?: string): {
  employees: TransformedEmployee[];
  errors: string[];
} {
  const rows = parseExcelBuffer(buffer, monthName);
  const employees: TransformedEmployee[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    try {
      const transformed = transformExcelRow(row);
      const validation = validateEmployee(transformed);

      if (!validation.valid) {
        errors.push(`Row ${index + 1}: ${validation.errors.join(", ")}`);
      } else {
        employees.push(transformed);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: Failed to transform data`);
    }
  });

  return { employees, errors };
}
