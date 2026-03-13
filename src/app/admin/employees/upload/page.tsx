'use client';

import { ExcelUploadComponent } from '@/components/admin/excel-upload';

export default function ExcelUploadPage() {
  const handleUpload = (file: File) => {
    // TODO: Implement actual file upload to backend
    console.log('File uploaded:', file.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Upload Employees</h1>
        <p className="mt-2 text-slate-600">
          Import employee data from an Excel file or CSV format.
        </p>
      </div>

      <ExcelUploadComponent onUpload={handleUpload} />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Excel File Requirements
        </h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• Required columns: Name, Email, Department, Role</li>
          <li>• Optional columns: Phone, Salary, Join Date, Status</li>
          <li>• Maximum file size: 5MB</li>
          <li>• Supported formats: .xlsx, .xls, .csv</li>
          <li>• Header row is required</li>
        </ul>
      </div>
    </div>
  );
}
