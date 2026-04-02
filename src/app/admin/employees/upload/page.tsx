"use client";

import { ExcelUploadComponent } from "@/components/admin/excel-upload";

export default function ExcelUploadPage() {
  const handleUpload = (file: File) => {
    console.log("File uploaded:", file.name);
  };

  return (
    <div className="space-y-8">
      <ExcelUploadComponent onUpload={handleUpload} />

      {/* Requirements Info */}
      <div className="border border-border rounded-lg p-6">
        <h3 className="font-semibold text-foreground mb-4">
          Requirements
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Required Columns
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Name</li>
              <li>• Email</li>
              <li>• Department</li>
              <li>• Role</li>
            </ul>
            <h4 className="font-medium text-foreground mb-3 mt-6">
              Optional Columns
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• S.No. (Serial Number)</li>
              <li>• CTC (Annual Salary)</li>
              <li>• Atten Allow (Attendance Allowance)</li>
              <li>• Designation, Process, DOJ</li>
              <li>• UAN NO., Account Number, IFSC Code, Bank Name</li>
              <li>• Present, Absent, Leave, HD, Week Off, Holiday</li>
              <li>• CL, LC, TRP, TRA, TRL (Various Leave Types)</li>
              <li>• OT, Final days, Arrear, Advance</li>
              <li>• Gross Salary, TDS, Net Salary, Penalty, Paid</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Specifications
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Formats: .xlsx, .xls, .csv</li>
              <li>• Max size: 5MB</li>
              <li>• Header row required</li>
            </ul>

            <h4 className="font-medium text-foreground mb-3">
              Data Types
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Text fields: Employee ID, Name, Designation, etc.</li>
              <li>• Number fields: Days, Salary, CTC, etc.</li>
              <li>• Date fields: DOJ (format: YYYY-MM-DD)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
