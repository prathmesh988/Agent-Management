"use server";

import {
  getMonthlyPayroll,
  saveMonthlyPayroll,
  getMonthPayrollForAllEmployees,
  getMonthPayrollPage,
  updatePayrollStatus,
  deleteMonthlyPayroll,
  getPayrollSummary,
  type MonthlyPayrollRecord,
  type PayrollSummary,
} from "@/services/database/monthly-payroll";
import {
  getMonthlyAttendance,
  getMonthAttendanceForAllEmployees,
  type MonthlyAttendanceRecord,
} from "@/services/database/monthly-attendance";
import { fetchAllEmployeesPaginated } from "@/services/database/employees";

/**
 * Generate payroll for a specific month (calculate only, don't save to DB).
 * - Fetches all employees
 * - Gets their attendance for the month
 * - Calculates: deductions, TDS, net salary
 * - Returns calculated payroll without saving (like employees page)
 * - User can then save individual records if needed
 */
export async function generateMonthPayrollAction(
  year: number,
  month: number
): Promise<{
  generated: number;
  errors: string[];
  summary?: PayrollSummary;
  records?: MonthlyPayrollRecord[];
  total?: number;
  pages?: number;
}> {
  try {
    console.log(`📊 Generating payroll for ${year}-${String(month).padStart(2, "0")}...`);

    // Fetch ALL employees across all pages (not just 100)
    const employees = await fetchAllEmployeesPaginated();
    
    if (!employees || employees.length === 0) {
      return { generated: 0, errors: ["No employees found"] };
    }

    console.log(`📋 Found ${employees.length} employees, fetching attendance records...`);

    // CRITICAL OPTIMIZATION: Fetch ALL attendance records at once instead of per-employee
    // This reduces API calls from N (one per employee) to 1 bulk call
    let allAttendanceRecords: MonthlyAttendanceRecord[] = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100;

    while (hasMore) {
      const records = await getMonthAttendanceForAllEmployees(year, month, pageSize, (page - 1) * pageSize);
      allAttendanceRecords = allAttendanceRecords.concat(records);
      hasMore = records.length === pageSize;
      page++;
    }

    // Create a map for fast lookup: employeeId -> attendance
    const attendanceMap = new Map(
      allAttendanceRecords.map(record => [record.employeeId, record])
    );

    console.log(`📅 Fetched attendance for ${allAttendanceRecords.length} employees, calculating payroll...`);

    const errors: string[] = [];
    let generated = 0;
    const calculatedPayroll: MonthlyPayrollRecord[] = [];

    for (const employee of employees) {
      try {
        // Skip if no employeeId
        if (!employee.employeeId) {
          errors.push("Missing employeeId");
          continue;
        }

        // Get employee's attendance from the pre-fetched map (O(1) lookup instead of API call)
        const attendance = attendanceMap.get(employee.employeeId);

        if (!attendance) {
          errors.push(
            `${employee.employeeId}: No attendance record for this month`
          );
          continue;
        }

        // Count attendance statuses
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let holidayDays = 0;
        let weeklyOffDays = 0;

        for (let day = 1; day <= 31; day++) {
          const status = (attendance as any)[`day${day}`];
          switch (status) {
            case "P":
              presentDays++;
              break;
            case "A":
              absentDays++;
              break;
            case "L":
              leaveDays++;
              break;
            case "H":
              holidayDays++;
              break;
            case "WO":
              weeklyOffDays++;
              break;
          }
        }

        // Calculate payroll
        const grossSalary = Number(employee.grossSalary) || 0;
        const perDayRate = grossSalary / 30;

        // Deduction: absent days incur full deduction
        // Leave & holidays: no deduction
        const deductedAmount = absentDays * perDayRate;

        // TDS: 5% of gross (from employee.tds5perc or calculated)
        const tdsDeducted =
          (Number(employee.tds5perc) || grossSalary * 0.05);

        // Net salary
        const netSalary = grossSalary - deductedAmount - tdsDeducted;

        const totalWorkingDays =
          presentDays + absentDays + leaveDays; // exclude holidays & WO

        // Add to calculated payroll (don't save to DB yet)
        calculatedPayroll.push({
          employeeId: employee.employeeId,
          year,
          month,
          presentDays,
          absentDays,
          leaveDays,
          holidayDays,
          weeklyOffDays,
          totalWorkingDays,
          grossSalary: String(grossSalary),
          perDayRate: String(perDayRate.toFixed(2)),
          deductedAmount: String(deductedAmount.toFixed(2)),
          tdsDeducted: String(tdsDeducted.toFixed(2)),
          netSalary: String(netSalary.toFixed(2)),
          status: "draft",
          createdAt: new Date().toISOString(),
        });

        generated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${employee.employeeId}: ${msg}`);
        console.error(`Error calculating payroll for ${employee.employeeId}:`, error);
      }
    }

    // Calculate summary from calculated payroll
    console.log(`📊 Calculating payroll summary...`);
    const summary: PayrollSummary = {
      totalEmployees: calculatedPayroll.length,
      totalGross: 0,
      totalDeductions: 0,
      totalTDS: 0,
      totalNetPaid: 0,
      averageNetSalary: 0,
      presentDaysTotal: 0,
      absentDaysTotal: 0,
    };

    // Loop through calculated payroll to get summary totals
    for (const record of calculatedPayroll) {
      summary.totalGross += Number(record.grossSalary) || 0;
      summary.totalDeductions += Number(record.deductedAmount) || 0;
      summary.totalTDS += Number(record.tdsDeducted) || 0;
      summary.totalNetPaid += Number(record.netSalary) || 0;
      summary.presentDaysTotal += record.presentDays || 0;
      summary.absentDaysTotal += record.absentDays || 0;
    }

    if (calculatedPayroll.length > 0) {
      summary.averageNetSalary = summary.totalNetPaid / calculatedPayroll.length;
    }

    console.log(
      `✅ Calculated payroll for ${generated} employees, ${errors.length} errors`
    );

    // Return first page of calculated payroll (like employees page)
    console.log(`📄 Returning first page of payroll...`);
    const responsePageSize = 20;
    const firstPage = calculatedPayroll.slice(0, responsePageSize);
    const totalPages = Math.ceil(calculatedPayroll.length / responsePageSize);
    
    console.log(`✅ Returning first page (${firstPage.length} records) with total ${calculatedPayroll.length}`);
    return { generated, errors, summary, records: firstPage, total: calculatedPayroll.length, pages: totalPages };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generateMonthPayrollAction:", error);
    return { generated: 0, errors: [msg] };
  }
}

/**
 * Fetch payroll for one employee for one month.
 */
export async function getMonthlyPayrollAction(
  employeeId: string,
  year: number,
  month: number
): Promise<MonthlyPayrollRecord | null> {
  try {
    const record = await getMonthlyPayroll(employeeId, year, month);
    if (!record) return null;
    // Strip Appwrite metadata
    return {
      $id: record.$id,
      employeeId: record.employeeId,
      year: record.year,
      month: record.month,
      presentDays: record.presentDays,
      absentDays: record.absentDays,
      leaveDays: record.leaveDays,
      holidayDays: record.holidayDays,
      weeklyOffDays: record.weeklyOffDays,
      totalWorkingDays: record.totalWorkingDays,
      grossSalary: record.grossSalary,
      perDayRate: record.perDayRate,
      deductedAmount: record.deductedAmount,
      tdsDeducted: record.tdsDeducted,
      netSalary: record.netSalary,
      status: record.status,
      createdAt: record.createdAt,
      approvedAt: record.approvedAt,
      processedAt: record.processedAt,
    };
  } catch (error) {
    console.error("Error fetching monthly payroll:", error);
    return null;
  }
}

/**
 * Fetch payroll for all employees for a specific month.
 * Returns first page (20 records) by default for performance.
 * Use pagination in the UI for additional pages.
 */
export async function getMonthPayrollAction(
  year: number,
  month: number,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  records: MonthlyPayrollRecord[];
  total: number;
  pages: number;
}> {
  try {
    const { records, total, pages } = await getMonthPayrollPage(year, month, page, pageSize);
    // Strip Appwrite metadata before sending to client
    return {
      records: records.map((record) => ({
        $id: record.$id,
        employeeId: record.employeeId,
        year: record.year,
        month: record.month,
        presentDays: record.presentDays,
        absentDays: record.absentDays,
        leaveDays: record.leaveDays,
        holidayDays: record.holidayDays,
        weeklyOffDays: record.weeklyOffDays,
        totalWorkingDays: record.totalWorkingDays,
        grossSalary: record.grossSalary,
        perDayRate: record.perDayRate,
        deductedAmount: record.deductedAmount,
        tdsDeducted: record.tdsDeducted,
        netSalary: record.netSalary,
        status: record.status,
        createdAt: record.createdAt,
        approvedAt: record.approvedAt,
        processedAt: record.processedAt,
      })),
      total,
      pages,
    };
  } catch (error) {
    console.error("Error fetching month payroll:", error);
    return { records: [], total: 0, pages: 0 };
  }
}

/**
 * Approve all payroll records for a month (status: draft -> approved).
 * Fetches records in chunks to avoid loading all at once.
 */
export async function approveMonthPayrollAction(
  year: number,
  month: number
): Promise<{ approved: number; errors: string[] }> {
  try {
    let approved = 0;
    const errors: string[] = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100;

    while (hasMore) {
      const { records, pages } = await getMonthPayrollPage(year, month, page, pageSize);
      
      if (records.length === 0) break;

      for (const record of records) {
        try {
          await updatePayrollStatus(
            record.employeeId,
            year,
            month,
            "approved"
          );
          approved++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`${record.employeeId}: ${msg}`);
        }
      }

      hasMore = page < pages;
      page++;
    }

    console.log(
      `✅ Approved payroll for ${approved} employees, ${errors.length} errors`
    );

    return { approved, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error approving payroll:", error);
    return { approved: 0, errors: [msg] };
  }
}

/**
 * Process payroll (lock it: approved -> processed).
 * Fetches records in chunks to avoid loading all at once.
 */
export async function processMonthPayrollAction(
  year: number,
  month: number
): Promise<{ processed: number; errors: string[] }> {
  try {
    let processed = 0;
    const errors: string[] = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100;

    while (hasMore) {
      const { records, pages } = await getMonthPayrollPage(year, month, page, pageSize);
      
      if (records.length === 0) break;

      for (const record of records) {
        try {
          if (record.status !== "approved") {
            errors.push(
              `${record.employeeId}: Not in approved state (current: ${record.status})`
            );
            continue;
          }

          await updatePayrollStatus(
            record.employeeId,
            year,
            month,
            "processed"
          );
          processed++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          errors.push(`${record.employeeId}: ${msg}`);
        }
      }

      hasMore = page < pages;
      page++;
    }

    console.log(
      `✅ Processed payroll for ${processed} employees, ${errors.length} errors`
    );

    return { processed, errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing payroll:", error);
    return { processed: 0, errors: [msg] };
  }
}

/**
 * Get payroll summary (aggregate stats).
 */
export async function getPayrollSummaryAction(
  year: number,
  month: number
): Promise<PayrollSummary | null> {
  try {
    return await getPayrollSummary(year, month);
  } catch (error) {
    console.error("Error fetching payroll summary:", error);
    return null;
  }
}

/**
 * Delete payroll for a specific employee/month (for correction).
 */
export async function deletePayrollAction(
  employeeId: string,
  year: number,
  month: number
): Promise<boolean> {
  try {
    return await deleteMonthlyPayroll(employeeId, year, month);
  } catch (error) {
    console.error("Error deleting payroll:", error);
    return false;
  }
}

/**
 * Regenerate payroll for a month (delete all, then regenerate).
 * Deletes and regenerates in chunks to avoid memory issues.
 */
export async function regenerateMonthPayrollAction(
  year: number,
  month: number
): Promise<{ regenerated: number; errors: string[] }> {
  try {
    console.log("🗑️ Deleting existing payroll records...");
    
    // Delete all payroll for this month in chunks
    let deletedCount = 0;
    let page = 1;
    let hasMore = true;
    const pageSize = 100;

    while (hasMore) {
      const { records, pages } = await getMonthPayrollPage(year, month, page, pageSize);
      
      if (records.length === 0) break;

      for (const record of records) {
        await deleteMonthlyPayroll(record.employeeId, year, month);
        deletedCount++;
      }

      hasMore = page < pages;
      page++;
    }

    console.log(`🗑️  Deleted ${deletedCount} payroll records`);

    // Regenerate
    const result = await generateMonthPayrollAction(year, month);
    return { regenerated: result.generated, errors: result.errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error regenerating payroll:", error);
    return { regenerated: 0, errors: [msg] };
  }
}
