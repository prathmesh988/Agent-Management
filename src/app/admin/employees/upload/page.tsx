"use client";

import { ExcelUploadComponent } from "@/components/admin/excel-upload";

export default function ExcelUploadPage() {
  const handleUpload = (file: File) => {
    // TODO: Implement actual file upload to backend
    console.log("File uploaded:", file.name);
  };

  return (
    <div className="space-y-8">
      <ExcelUploadComponent onUpload={handleUpload} />

      {/* Requirements Info */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Requirements
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Required Columns
            </h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Name</li>
              <li>• Email</li>
              <li>• Department</li>
              <li>• Role</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Specifications
            </h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• Formats: .xlsx, .xls, .csv</li>
              <li>• Max size: 5MB</li>
              <li>• Header row required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
