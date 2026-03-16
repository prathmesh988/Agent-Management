# Excel to Appwrite Employee Import - Schema Migration Guide

## What Changed

Your database schema has been redesigned from generic columns to a structured payroll system.

### Old Schema
- 28 numbered columns (col_1, col_2, ... col_28)
- 15 text-based named columns
- All fields stored as `varchar`
- Generic mapping with no type safety

### New Schema
- **38 explicitly typed columns**
- Proper data types (integer, double, varchar)
- Business-focused field names
- Type-safe data handling

---

## New Database Schema

### Basic Information
```typescript
serialNo: number                // Integer type
employeeId: string              // String type (required, unique)
name: string                    // String type (required)
```

### Compensation
```typescript
ctc: number                      // Double type - Cost to Company
attendanceAllowance: number      // Double type
shiftAllowance: number           // Double type
```

### Employment Details
```typescript
process: string                 // String type
designation: string             // String type
dateOfJoining: string           // String type - Format: YYYY-MM-DD
```

### Banking Information
```typescript
uanNumber: string               // String type - Unique Account Number
accountNumber: string           // String type
ifscCode: string                // String type
bankName: string                // String type
paymentMode: string             // String type
```

### Attendance (Days)
```typescript
presentDays: number             // Double type
absentDays: number              // Double type
leaveDays: number               // Double type
halfDays: number                // Double type
weekOffDays: number             // Double type
holidayDays: number             // Double type
totalPresent: number            // Double type
```

### Leave Types
```typescript
cl: number                       // Double type - Casual Leave
lc: number                       // Double type - Leave Credited
trp: number                      // Double type
tra: number                      // Double type
trl: number                      // Double type
```

### Overtime & Adjustments
```typescript
overtime: number                // Double type
finalDays: number               // Double type
arrear: number                  // Double type
advance: number                 // Double type
```

### Salary Calculation
```typescript
grossSalary: number             // Double type
attendanceDeduction: number     // Double type
employeeContribution: number    // Double type - Employee PF/ESI
employerContribution: number    // Double type - Employer PF/ESI
tds: number                     // Double type - Tax Deducted at Source
netSalary: number               // Double type
penalty: number                 // Double type
paidAmount: number              // Double type
```

---

## Excel File Requirements

### Required Columns
1. **EmPl. ID** → Maps to `employeeId`
2. **Name** → Maps to `name`

### Supported Optional Columns
- S.No. → serialNo
- CTC → ctc
- Atten Allow → attendanceAllowance
- Process, Designation, DOJ
- UAN NO., ACCOUNT NUMBER, IFSC CODE, BANK NAME
- Mode → paymentMode
- Present, Absent, LEAVE, HD, WEEK OFF, HOILDAY
- CL, LC, TRP, TRA, TRL
- OT, Final days, Arrear, Advance, Shift Allow
- Gross Salary, Atten, EMPLOYEE, EMPLOYEER, TDS, Net Salary, Penalty, Paid

---

## Migration Steps

### 1. First Time Setup
```bash
# Run this once to create the new table
npx ts-node scripts/migrate-employees-table.ts
```

This script will:
- Delete the old employees table (if it exists)
- Create a new table with the updated schema
- Display confirmation when complete

### 2. Prepare Excel File
- Ensure your Excel file has headers matching the schema above
- Required columns: EmPl. ID, Name
- Optional columns can be included as needed
- File size limit: 5MB

### 3. Upload Data
- Navigate to `/admin/employees/upload`
- Select or drag-drop your Excel file
- Click "Upload File"
- The system will:
  - Validate the file
  - Check for duplicate Employee IDs
  - Transform data with proper type conversion
  - Insert in batches of 50 to avoid rate limiting

### 4. Verify Results
- Check the upload response for:
  - Total records processed
  - Successfully inserted
  - Skipped duplicates
  - Any validation errors

---

## Important Notes

### Type Conversion
- **Numbers**: Values are automatically parsed (text to number conversion)
- **Dates**: Format as YYYY-MM-DD (or any valid date string, system will store as-is)
- **Strings**: Trimmed of whitespace
- **Invalid values**: Skipped silently during parsing

### Duplicate Detection
- Based on `employeeId` field
- If an Employee ID already exists, the row is skipped (not inserted twice)

### Error Handling
- Row-level validation errors are reported with row numbers
- Missing required fields (employeeId, name) are rejected
- Batch processing continues even if individual rows fail
- Full error report returned in response

### Batch Processing
- Processes in groups of 50 to avoid API rate limits
- 500ms delay between batches
- Progress logged every 10 inserts

---

## Excel Column Mapping Reference

| Excel Column | Database Field | Appwrite Type | Required |
|---|---|---|---|
| S.No. | serialNo | integer | ✗ |
| EmPl. ID | employeeId | string | ✓ |
| Name | name | string | ✓ |
| CTC | ctc | double | ✗ |
| Atten Allow | attendanceAllowance | double | ✗ |
| Process | process | string | ✗ |
| Designation | designation | string | ✗ |
| DOJ | dateOfJoining | string | ✗ |
| UAN NO. | uanNumber | string | ✗ |
| ACCOUNT NUMBER | accountNumber | string | ✗ |
| IFSC CODE | ifscCode | string | ✗ |
| BANK NAME | bankName | string | ✗ |
| Mode | paymentMode | string | ✗ |
| Present | presentDays | double | ✗ |
| Absent | absentDays | double | ✗ |
| LEAVE | leaveDays | double | ✗ |
| HD | halfDays | double | ✗ |
| WEEK OFF | weekOffDays | double | ✗ |
| HOILDAY | holidayDays | double | ✗ |
| CL | cl | double | ✗ |
| LC | lc | double | ✗ |
| TRP | trp | double | ✗ |
| TRA | tra | double | ✗ |
| TRL | trl | double | ✗ |
| TOTAL PRSENT | totalPresent | double | ✗ |
| OT | overtime | double | ✗ |
| Final days | finalDays | double | ✗ |
| Arrear | arrear | double | ✗ |
| Advance | advance | double | ✗ |
| Shift Allow | shiftAllowance | double | ✗ |
| Gross Salary | grossSalary | double | ✗ |
| Atten | attendanceDeduction | double | ✗ |
| EMPLOYEE | employeeContribution | double | ✗ |
| EMPLOYEER | employerContribution | double | ✗ |
| TDS | tds | double | ✗ |
| Net Salary | netSalary | double | ✗ |
| Penalty | penalty | double | ✗ |
| Paid | paidAmount | double | ✗ |

---

## Troubleshooting

### "Employee ID is required"
- Ensure the **EmPl. ID** column exists in your Excel file
- Check that values aren't blank for any employee

### "Name is required"
- Ensure the **Name** column exists
- Check that values aren't blank for any employee

### "No valid employee records found"
- Verify your Excel file has proper headers
- Check that at least the required columns exist
- Ensure the file isn't empty

### Validation Errors
- Review the error report for specific row numbers
- Fix the data in your Excel file
- Re-upload

---

## API Endpoint

**POST** `/api/upload-employees`

### Request
- Form data with `file` field containing Excel file

### Response Success (200)
```json
{
  "success": true,
  "message": "Successfully imported employees",
  "summary": {
    "total": 100,
    "inserted": 95,
    "skipped": 5,
    "errors": []
  },
  "validationErrors": []
}
```

### Response Error (400/500)
```json
{
  "error": "Error description",
  "details": "Detailed error message"
}
```
