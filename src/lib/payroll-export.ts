/**
 * Payroll export utilities
 * Exports payroll data to Excel format with formatting
 */

import * as XLSX from 'xlsx';
import type { MonthlyPayrollRecord, PayrollSummary } from '@/services/database/monthly-payroll';

interface PayrollExportOptions {
  fileName?: string;
  monthYear?: string;
}

/**
 * Export payroll data to Excel file
 * @param payrollData - Array of payroll records
 * @param summary - Payroll summary data
 * @param options - Export options (fileName, monthYear)
 */
export function exportPayrollToExcel(
  payrollData: MonthlyPayrollRecord[],
  summary: PayrollSummary | null,
  options: PayrollExportOptions = {}
): void {
  const { fileName = 'Payroll', monthYear = new Date().toLocaleDateString() } = options;

  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  if (summary) {
    const summaryData = [
      ['Payroll Summary', monthYear],
      [],
      ['Total Employees', summary.totalEmployees],
      ['Total Gross Salary', `₹${Number(summary.totalGross).toLocaleString('en-IN')}`],
      ['Total Deductions', `₹${Number(summary.totalDeductions).toLocaleString('en-IN')}`],
      ['Total TDS', `₹${Number(summary.totalTDS).toLocaleString('en-IN')}`],
      ['Total Net Paid', `₹${Number(summary.totalNetPaid).toLocaleString('en-IN')}`],
      ['Average Net Salary', `₹${Number(summary.averageNetSalary).toLocaleString('en-IN')}`],
      [],
      ['Attendance Summary'],
      ['Total Present Days', summary.presentDaysTotal],
      ['Total Absent Days', summary.absentDaysTotal],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    
    // Format header rows
    summarySheet['A1'].s = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: 'FF4472C4' } },
      alignment: { horizontal: 'center' },
    };

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // Sheet 2: Payroll Details
  const headers = [
    'Employee ID',
    'Gross Salary',
    'Present Days',
    'Absent Days',
    'Leave Days',
    'Deduction',
    'TDS Deducted',
    'Net Salary',
    'Status',
  ];

  const data = payrollData.map((record) => [
    record.employeeId || '',
    Number(record.grossSalary) || 0,
    record.presentDays || 0,
    record.absentDays || 0,
    record.leaveDays || 0,
    Number(record.deductedAmount) || 0,
    Number(record.tdsDeducted) || 0,
    Number(record.netSalary) || 0,
    record.status || 'draft',
  ]);

  // Create sheet with headers and data
  const detailsSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  detailsSheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 11 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  // Format header row
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_col(i) + '1';
    detailsSheet[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: 'FF4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  // Format currency columns (Gross, Deduction, TDS, Net)
  const currencyColumns = [1, 5, 6, 7]; // Indices for currency columns
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    for (const colIndex of currencyColumns) {
      const cellRef = XLSX.utils.encode_col(colIndex) + (rowIndex + 2);
      if (detailsSheet[cellRef]) {
        detailsSheet[cellRef].s = {
          numFmt: '₹#,##0.00',
          alignment: { horizontal: 'right' },
        };
      }
    }
  }

  // Format numeric columns (Present, Absent, Leave)
  const numericColumns = [2, 3, 4];
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    for (const colIndex of numericColumns) {
      const cellRef = XLSX.utils.encode_col(colIndex) + (rowIndex + 2);
      if (detailsSheet[cellRef]) {
        detailsSheet[cellRef].s = {
          alignment: { horizontal: 'center' },
        };
      }
    }
  }

  // Freeze header row
  detailsSheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Payroll Details');

  // Generate file name with current date
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}-${monthYear.replace(/\//g, '-')}-${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, fullFileName);
}

/**
 * Export payroll data to CSV format
 * @param payrollData - Array of payroll records
 * @param monthYear - Month/Year label
 */
export function exportPayrollToCSV(
  payrollData: MonthlyPayrollRecord[],
  monthYear: string = ''
): void {
  const headers = [
    'Employee ID',
    'Gross Salary',
    'Present Days',
    'Absent Days',
    'Leave Days',
    'Deduction',
    'TDS Deducted',
    'Net Salary',
    'Status',
  ];

  const data = payrollData.map((record) => [
    record.employeeId || '',
    Number(record.grossSalary) || 0,
    record.presentDays || 0,
    record.absentDays || 0,
    record.leaveDays || 0,
    Number(record.deductedAmount) || 0,
    Number(record.tdsDeducted) || 0,
    Number(record.netSalary) || 0,
    record.status || 'draft',
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Payroll');

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Payroll-${monthYear.replace(/\//g, '-')}-${timestamp}.csv`;

  XLSX.writeFile(workbook, fileName);
}
