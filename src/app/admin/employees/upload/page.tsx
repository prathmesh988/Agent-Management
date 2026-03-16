"use client";

import { ExcelUploadComponent } from "@/components/admin/excel-upload";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExcelUploadPage() {
  const handleUpload = (file: File) => {
    console.log("File uploaded:", file.name);
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      "Name",
      "Email",
      "Department",
      "Role",
      "Phone",
      "Join Date",
    ];
    const sampleData = [
      "John Doe",
      "john@example.com",
      "Engineering",
      "Senior Engineer",
      "+1-234-567-8900",
      "2024-01-15",
    ];

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee_template.csv";
    link.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-800 text-slate-900">Upload Employees</h1>
        <p className="mt-2 text-slate-600">
          Import employee data from an Excel file or CSV format in just a few
          steps.
        </p>
      </div>

      {/* Visual Step-by-Step Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 text-lg font-700">
            1
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Download Template
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Start with our pre-formatted CSV template
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4 text-lg font-700">
            2
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Fill Data Correctly
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Add your employee information in the rows
          </p>
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Check className="h-4 w-4" />
            Fill
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4 text-lg font-700">
            3
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Upload File
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Drop or upload your completed file
          </p>
          <Button size="sm" disabled className="gap-2">
            <Check className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <ExcelUploadComponent onUpload={handleUpload} />

      {/* Important Setup Note */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-amber-500 text-white">
              ⚙️
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-3">
              Database Schema Updated
            </h4>
            <p className="text-sm text-amber-800 mb-3">
              If this is your first upload or you're coming from an older version, initialize the database with the new schema:
            </p>
            <code className="block p-2 bg-amber-100 text-amber-900 text-xs rounded font-mono mb-3">
              npx ts-node scripts/migrate-employees-table.ts
            </code>
            <p className="text-xs text-amber-700">
              This will set up the employees table with all required columns optimized for your payroll data.
            </p>
          </div>
        </div>
      </div>

      {/* Requirements Info */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          File Requirements
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium text-slate-900 mb-3">
              Required Columns
            </h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-full bg-blue-600 text-white items-center justify-center text-xs">
                  ✓
                </span>
                EmPl. ID (Employee ID)
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-full bg-blue-600 text-white items-center justify-center text-xs">
                  ✓
                </span>
                Name
              </li>
            </ul>
            <h4 className="font-medium text-slate-900 mb-3 mt-6">
              Optional Columns
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
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
            <h4 className="font-medium text-slate-900 mb-3">
              File Specifications
            </h4>
            <ul className="space-y-2 text-sm text-slate-700 mb-6">
              <li>• Supported formats: .xlsx, .xls, .csv</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Header row is required</li>
              <li>• One employee per row</li>
            </ul>

            <h4 className="font-medium text-slate-900 mb-3">
              Data Types
            </h4>
            <ul className="space-y-2 text-sm text-slate-700">
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
