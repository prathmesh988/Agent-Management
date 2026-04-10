"use client";

import { useState, useCallback, useEffect } from "react";
import { Employee } from "@/lib/types";
import { getIncentiveByEmployeeIdAction, saveIncentiveAction } from "@/app/(actions)/incentives";
import { getInitials, getAvatarColorByHash } from "@/lib/avatar-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, AlertCircle, Mail, Users, Calendar, BarChart3, Gift } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import Link from "next/link";

interface EmployeeDetailPanelProps {
  employee: Employee;
  employeeId: string;
}

// Helper to parse dates correctly from possible Excel serial number or Unix timestamp
function parseDateValue(value: unknown): Date | null {
  if (!value) return null;
  const numValue = Number(value);
  
  if (!isNaN(numValue) && numValue !== 0) {
    // If the number is small, it's likely an Excel serial date (e.g. 45000 for year 2023)
    if (numValue > 1000 && numValue < 100000) {
      return new Date(Math.round((numValue - 25569) * 86400 * 1000));
    }
    // Otherwise treat as Unix timestamp (milliseconds)
    return new Date(numValue);
  }
  
  // If we couldn't parse it as a number, try parsing as an ISO string
  const strDate = new Date(String(value));
  if (!isNaN(strDate.getTime())) return strDate;
  
  return null;
}

// Helper to format dates
function formatDate(timestamp?: unknown): string {
  const dateObj = parseDateValue(timestamp);
  if (!dateObj) return "N/A";
  
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const FIELD_SECTIONS = [
  {
    id: "basic",
    title: "Basic Information",
    fields: [
      { key: "employeeId", label: "Employee ID", type: "text", required: true },
      { key: "name", label: "Full Name", type: "text", required: true },
      { key: "designation", label: "Designation", type: "text" },
      { key: "process", label: "Department", type: "text" },
      { key: "dateOfJoining", label: "Date of Joining", type: "date" },
    ],
  },
  {
    id: "banking",
    title: "Bank & Payment",
    fields: [
      { key: "accountNumber", label: "Account Number", type: "text" },
      { key: "ifscCode", label: "IFSC Code", type: "text" },
      { key: "bankName", label: "Bank Name", type: "text" },
      { key: "paymentMode", label: "Payment Mode", type: "text" },
      { key: "uanNumber", label: "UAN Number", type: "text" },
    ],
  },
  {
    id: "salary",
    title: "Salary & Allowances",
    fields: [
      { key: "ctc", label: "CTC", type: "number" },
      { key: "attendanceAllowance", label: "Attendance Allowance", type: "number" },
      { key: "shiftAllowance", label: "Shift Allowance", type: "number" },
      { key: "grossSalary", label: "Gross Salary", type: "number" },
      { key: "netSalary", label: "Net Salary", type: "number" },
    ],
  },
  {
    id: "incentive",
    title: "Incentive & Bonuses",
    fields: [
      { key: "incentiveAmount", label: "Base Incentive", type: "number" },
      { key: "performanceBonus", label: "Performance Bonus", type: "number" },
      { key: "referralBonus", label: "Referral Bonus", type: "number" },
      { key: "festivalBonus", label: "Festival Bonus", type: "number" },
      { key: "retentionBonus", label: "Retention Bonus", type: "number" },
      { key: "totalIncentive", label: "Total Incentive", type: "number" },
    ],
  },
  {
    id: "deductions",
    title: "Deductions & Contributions",
    fields: [
      { key: "attendanceDeduction", label: "Attendance Deduction", type: "number" },
      { key: "tds5perc", label: "TDS", type: "number" },
      { key: "employeeContribution", label: "Employee Contribution", type: "number" },
      { key: "employeeEsic", label: "Employee ESIC", type: "number" },
      { key: "employerContribution", label: "Employer Contribution", type: "number" },
      { key: "employerEsic", label: "Employer ESIC", type: "number" },
    ],
  },
  {
    id: "attendance",
    title: "Attendance Summary",
    fields: [
      { key: "presentDays", label: "Present Days", type: "number" },
      { key: "absentDays", label: "Absent Days", type: "number" },
      { key: "leaveDays", label: "Leave Days", type: "number" },
      { key: "halfDays", label: "Half Days", type: "number" },
      { key: "weekOffDays", label: "Week Off Days", type: "number" },
      { key: "holidayDays", label: "Holiday Days", type: "number" },
    ],
  },
  {
    id: "leaves",
    title: "Leave Types",
    fields: [
      { key: "cl", label: "Casual Leave (CL)", type: "number" },
      { key: "lc", label: "Leave Component (LC)", type: "number" },
      { key: "trp", label: "TRP", type: "number" },
      { key: "tra", label: "TRA", type: "number" },
      { key: "trl", label: "TRL", type: "number" },
    ],
  },
  {
    id: "calculations",
    title: "Final Calculations",
    fields: [
      { key: "totalPresent", label: "Total Present", type: "number" },
      { key: "finalDays", label: "Final Days", type: "number" },
      { key: "overtime", label: "Overtime Hours", type: "number" },
      { key: "arrear", label: "Arrear", type: "number" },
      { key: "advance", label: "Advance", type: "number" },
      { key: "penalty", label: "Penalty", type: "number" },
      { key: "paidAmount", label: "Paid Amount", type: "number" },
    ],
  },
];

const ATTENDANCE_DAYS = Array.from({ length: 28 }, (_, i) => ({
  key: `${i + 1}${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(i % 7)]}`,
  label: `${i + 1}`,
  day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7],
}));

export function EmployeeDetailPanel({
  employee: initialEmployee,
  employeeId,
}: EmployeeDetailPanelProps) {
  const [employee, setEmployee] = useState<Employee>(initialEmployee);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { updateEmployee } = useEmployees();

  useEffect(() => {
    const fetchIncentives = async () => {
      try {
        const idToSearch = employee.employeeId || employeeId; 
        const incentives = await getIncentiveByEmployeeIdAction(idToSearch);
        if (incentives) {
           setEmployee((prev) => ({
             ...prev,
             incentiveAmount: incentives.incentiveAmount,
             performanceBonus: incentives.performanceBonus,
             referralBonus: incentives.referralBonus,
             festivalBonus: incentives.festivalBonus,
             retentionBonus: incentives.retentionBonus,
             totalIncentive: incentives.totalIncentive,
           }));
        }
      } catch (e) {
        console.error("Failed to load incentives", e);
      }
    };
    fetchIncentives();
  }, [employee.employeeId, employeeId]);

  useEffect(() => {
    const base = Number(employee.incentiveAmount) || 0;
    const perf = Number(employee.performanceBonus) || 0;
    const ref = Number(employee.referralBonus) || 0;
    const fest = Number(employee.festivalBonus) || 0;
    const ret = Number(employee.retentionBonus) || 0;
    
    const total = base + perf + ref + fest + ret;
    
    if (employee.totalIncentive !== total) {
      setEmployee(prev => ({ ...prev, totalIncentive: total }));
      setEditedFields(prev => new Set(prev).add("totalIncentive"));
    }
  }, [
    employee.incentiveAmount,
    employee.performanceBonus,
    employee.referralBonus,
    employee.festivalBonus,
    employee.retentionBonus,
    employee.totalIncentive
  ]);

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      // Convert dates to timestamps
      let finalValue: string | number | undefined = value as string | number | undefined;
      
      if (key === "dateOfJoining" && value) {
        finalValue = new Date(String(value)).getTime();
      } else if (value === "") {
        finalValue = undefined;
      }

      setEmployee((prev) => {
        const updated = { ...prev };
        (updated as Record<string, unknown>)[key] = finalValue;
        return updated;
      });

      setEditedFields((prev) => new Set(prev).add(key));
      setSaveError(null);
    },
    []
  );

  const handleSave = async () => {
    if (editedFields.size === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const incentiveFieldsList = [
        "incentiveAmount", "performanceBonus", "referralBonus", 
        "festivalBonus", "retentionBonus", "totalIncentive"
      ];
      const modifiedIncentiveFields = [...editedFields].filter(f => incentiveFieldsList.includes(f));
      const modifiedRegularFields = [...editedFields].filter(f => !incentiveFieldsList.includes(f));

      if (modifiedIncentiveFields.length > 0) {
        const idForIncentive = employee.employeeId || employeeId;
        await saveIncentiveAction(idForIncentive, {
          incentiveAmount: employee.incentiveAmount as number | undefined,
          performanceBonus: employee.performanceBonus as number | undefined,
          referralBonus: employee.referralBonus as number | undefined,
          festivalBonus: employee.festivalBonus as number | undefined,
          retentionBonus: employee.retentionBonus as number | undefined,
          totalIncentive: employee.totalIncentive as number | undefined,
        });
        console.log("✅ Incentives updated successfully");
      }

      if (modifiedRegularFields.length > 0) {
        // Pass the full employee object with updates
        console.log("📦 Saving employee with updates:", employee);
        await updateEmployee(employee);
        console.log("✅ Employee updated successfully");
      }

      setEditedFields(new Set());
      alert("Employee details updated successfully!");
    } catch (error) {
      console.error("❌ Error saving employee:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save changes"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateForInput = (timestamp?: unknown): string => {
    const date = parseDateValue(timestamp);
    if (!date) return "";
    try {
      return date.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  interface FieldDefinition {
    key: string;
    label: string;
    type: string;
  }

  const renderField = (field: FieldDefinition, value: unknown) => {
    const isEdited = editedFields.has(field.key);
    const isDisabled = field.key === "totalIncentive";

    if (field.type === "date") {
      return (
        <Input
          type="date"
          disabled={isDisabled}
          value={formatDateForInput(value as number)}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={isEdited ? "border-primary bg-primary/5" : ""}
        />
      );
    }

    if (field.type === "number") {
      const numValue = typeof value === "number" ? value : (typeof value === "string" ? parseFloat(value) : "");
      return (
        <Input
          type="number"
          step="0.01"
          min="0"
          disabled={isDisabled}
          value={numValue === "" ? "" : numValue}
          onKeyDown={(e) => {
            // Prevent entering negative signs and scientific notations
            if (["-", "e", "E", "+"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            if (e.target.value === "") {
              handleFieldChange(field.key, "");
            } else {
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) {
                // Strictly enforce non-negative values
                handleFieldChange(field.key, Math.max(0, parsed));
              }
            }
          }}
          className={isEdited ? "border-primary bg-primary/5" : ""}
        />
      );
    }

    return (
      <Input
        type="text"
        disabled={isDisabled}
        value={typeof value === "string" ? value : (typeof value === "number" ? value.toString() : "")}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
        className={isEdited ? "border-primary bg-primary/5" : ""}
      />
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Save Error Alert */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error saving changes</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* ========== HERO PROFILE HEADER ========== */}
      <Card className="p-8 bg-linear-to-br from-background to-muted border shadow-lg">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Avatar + Name + Quick Info */}
          <div className="flex gap-6 flex-1">
            {/* Avatar */}
            <div
              className={`h-24 w-24 rounded-full ${getAvatarColorByHash(employee.name)} flex items-center justify-center text-white text-4xl font-bold shrink-0`}
            >
              {getInitials(employee.name)}
            </div>

            {/* Name, Designation, Status */}
            <div className="flex-1 pt-1">
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                {employee.name}
              </h1>
              <p className="text-lg text-muted-foreground mt-1 font-medium">
                {employee.designation || "N/A"}
              </p>

              {/* Status Badge */}
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                  <span className="h-2 w-2 rounded-full mr-2 bg-primary" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <Link href={`/admin/employees/${employeeId}/attendance`}>
              <Button
                variant="outline"
                size="lg"
                className="shadow-md"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Attendance
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={editedFields.size === 0 || isSaving}
              size="lg"
              className="shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Quick Info Bar - Below Name */}
        <div className="mt-8 pt-8 border-t border-border grid grid-cols-4 gap-6">
          {/* Employee ID */}
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1">
              Employee ID
            </p>
            <p className="text-lg font-semibold text-foreground">{employee.employeeId || "N/A"}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </p>
            <p className="text-sm text-foreground truncate">{employee.email || "N/A"}</p>
          </div>

          {/* Department */}
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> Department
            </p>
            <p className="text-lg font-semibold text-foreground">{employee.process || "N/A"}</p>
          </div>

          {/* Date of Joining */}
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Joined
            </p>
            <p className="text-lg font-semibold text-foreground">{formatDate(employee.dateOfJoining)}</p>
          </div>
        </div>

        {/* Modified Fields Indicator */}
        {editedFields.size > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{editedFields.size}</span> field
              {editedFields.size !== 1 ? "s" : ""} modified
            </p>
          </div>
        )}
      </Card>

      {/* ========== TABS WITH RICH CONTENT ========== */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
          {FIELD_SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="text-xs">
              {section.title.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Contents */}
        {FIELD_SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-4 mt-6">
            <Card className="shadow-md">
              <CardHeader className="bg-muted/50">
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label htmlFor={field.key} className="text-sm font-semibold text-foreground">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      {renderField(field, employee[field.key as keyof Employee])}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
