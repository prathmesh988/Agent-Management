"use server";

import {
  getMonthlyPayroll,
  saveMonthlyPayroll,
  getMonthPayrollForAllEmployees,
  updatePayrollStatus,
  deleteMonthlyPayroll,
  getPayrollSummary,
  type MonthlyPayrollRecord,
  type PayrollSummary,
} from "@/services/database/monthly-payroll";
import {
  getMonthlyAttendance,
  getMonthAttendanceForAllEmployees,
} from "@/services/database/monthly-attendance";
import { fetchAllEmployees } from "@/services/database/employees";

/**
 * Generate payroll for a specific month.
 * - Fetches all employees
 * - Gets their attendance for the month
 * - Calculates: deductions, TDS, net salary
 * - Saves to monthly_payroll collection
 */
export async function generateMonthPayrollAction(
  year: number,
  month: number
): Promise<{
  generated: number;
  errors: string[];
  summary?: PayrollSummary;
}> {
  try {
    console.log(`📊 Generating payroll for ${year}-${String(month).padStart(2, "0")}...`);

    const result = await fetchAllEmployees();
    const employees = result.employees || [];
    if (!employees || employees.length === 0) {
      return { generated: 0, errors: ["No employees found"] };
    }

    const errors: string[] = [];
    let generated = 0;

    for (const employee of employees) {
      try {
        // Skip if no employeeId
        if (!employee.employeeId) {
          errors.push("Missing employeeId");
          continue;
        }

        // Get employee's attendance for this month
        const attendance = await getMonthlyAttendance(
          employee.employeeId,
          year,
          month
        );

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

        // Save payroll
        await saveMonthlyPayroll(employee.employeeId, year, month, {
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
        });

        generated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${employee.employeeId}: ${msg}`);
        console.error(`Error generating payroll for ${employee.employeeId}:`, error);
      }
    }

    // Get summary (this returns just aggregated numbers, should be serializable)
    const summary = await getPayrollSummary(year, month);

    console.log(
      `✅ Generated payroll for ${generated} employees, ${errors.length} errors`
    );

    return { generated, errors, summary };
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
 */
export async function getMonthPayrollAction(
  year: number,
  month: number
): Promise<MonthlyPayrollRecord[]> {
  try {
    const records = await getMonthPayrollForAllEmployees(year, month);
    // Strip Appwrite metadata before sending to client
    return records.map((record) => ({
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
    }));
  } catch (error) {
    console.error("Error fetching month payroll:", error);
    return [];
  }
}

/**
 * Approve all payroll records for a month (status: draft -> approved).
 */
export async function approveMonthPayrollAction(
  year: number,
  month: number
): Promise<{ approved: number; errors: string[] }> {
  try {
    const records = await getMonthPayrollForAllEmployees(year, month, 999);

    let approved = 0;
    const errors: string[] = [];

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
 */
export async function processMonthPayrollAction(
  year: number,
  month: number
): Promise<{ processed: number; errors: string[] }> {
  try {
    const records = await getMonthPayrollForAllEmployees(year, month, 999);

    let processed = 0;
    const errors: string[] = [];

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
 */
export async function regenerateMonthPayrollAction(
  year: number,
  month: number
): Promise<{ regenerated: number; errors: string[] }> {
  try {
    // Delete all payroll for this month
    const records = await getMonthPayrollForAllEmployees(year, month, 999);
    for (const record of records) {
      await deleteMonthlyPayroll(record.employeeId, year, month);
    }

    console.log(`🗑️  Deleted ${records.length} payroll records`);

    // Regenerate
    const result = await generateMonthPayrollAction(year, month);
    return { regenerated: result.generated, errors: result.errors };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error regenerating payroll:", error);
    return { regenerated: 0, errors: [msg] };
  }
}
