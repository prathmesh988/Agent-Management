import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query, AppwriteException } from 'node-appwrite';
import * as XLSX from 'xlsx';
import { initializeEmployeesTable, tableExists, DATABASE_ID, COLLECTION_ID } from '@/lib/initialize-table';
import { processExcelFileFromBuffer, TransformedEmployee } from '@/lib/excel-import';
import { saveMonthlyAttendance } from '@/services/database/monthly-attendance';

const CHUNK_SIZE = 100;

// Month names for detection
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * Extract month number from Excel sheet name (e.g., "March 2026" -> 3)
 */
function detectMonthFromSheetName(sheetName: string): number | null {
  const normalized = sheetName.toLowerCase().trim();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const monthName = MONTH_NAMES[i];
    if (normalized.includes(monthName) || normalized.includes(monthName.substring(0, 3))) {
      return i + 1;
    }
  }
  return null;
}

/**
 * Extract year from Excel sheet name (e.g., "March 2026" -> 2026)
 */
function detectYearFromSheetName(sheetName: string): number | null {
  const yearMatch = sheetName.match(/\b(20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : null;
}

/**
 * Get sheet names from Excel buffer
 */
function getSheetNames(buffer: Buffer): string[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames;
  } catch (error) {
    console.error('Error reading sheet names:', error);
    return [];
  }
}

// Day-column keys as stored in TransformedEmployee (e.g. "1Sun", "2Mon", ...)
// Map them to monthly_attendance day keys (day1, day2, ..., day28)
function extractDayColumns(employee: TransformedEmployee): Record<string, string> {
    const result: Record<string, string> = {};
    for (let dayNum = 1; dayNum <= 31; dayNum++) {
        // Find a key starting with this day number followed by a letter (e.g. "1Sun", "12Thu")
        const key = Object.keys(employee).find(
            (k) => k.match(new RegExp(`^${dayNum}[A-Za-z]+$`))
        );
        if (key && employee[key] !== undefined && employee[key] !== null && employee[key] !== '') {
            result[`day${dayNum}`] = String(employee[key]);
        }
    }
    return result;
}

/**
 * Remove all day columns from employee record before saving to employees collection.
 * This keeps the employees table clean and separate from attendance data.
 */
function cleanEmployeeRecord(employee: TransformedEmployee): TransformedEmployee {
    const cleaned: any = { ...employee };
    
    // Remove all day columns (1Sun–31Sat pattern)
    Object.keys(cleaned).forEach((key) => {
        if (key.match(/^\d+[A-Za-z]+$/)) {
            delete cleaned[key];
        }
    });
    
    return cleaned;
}

/**
 * Helper function to check if employee already exists
 */
async function employeeExists(
    databases: Databases,
    empId: string
): Promise<boolean> {
    try {
        const result = await databases.listDocuments({
            databaseId: DATABASE_ID,
            collectionId: COLLECTION_ID,
            queries: [Query.equal('employeeId', empId), Query.limit(1)],
        });
        return result.total > 0;
    } catch (error) {
        console.error('Error checking employee existence:', error);
        return false;
    }
}

/**
 * Insert employees in batches and also upsert monthly_attendance records.
 */
async function insertEmployeesBatch(
    databases: Databases,
    employees: TransformedEmployee[],
    month: number,
    year: number,
    startIndex: number = 0
): Promise<{ inserted: number; skipped: number; attendanceUpdated: number; errors: string[] }> {
    let inserted = 0;
    let skipped = 0;
    let attendanceUpdated = 0;
    const errors: string[] = [];
    let currentIndex = startIndex;

    for (const employee of employees) {
        try {
            const employeeId = employee.employeeId as string;

            // ── 1. Insert employee record (skip if already exists) ──
            const exists = await employeeExists(databases, employeeId);
            if (exists) {
                skipped++;
            } else {
                const cleanedEmployee = cleanEmployeeRecord(employee);
                await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTION_ID,
                    documentId: ID.unique(),
                    data: cleanedEmployee,
                });
                inserted++;
            }

            if (inserted % 10 === 0 && inserted > 0) {
                console.log(`Progress: ${inserted} employees inserted, ${skipped} skipped...`);
            }

            // ── 2. Upsert monthly_attendance regardless of insert/skip ──
            const dayData = extractDayColumns(employee);
            if (Object.keys(dayData).length > 0) {
                try {
                    await saveMonthlyAttendance(employeeId, year, month, dayData);
                    attendanceUpdated++;
                } catch (attErr) {
                    const msg = attErr instanceof AppwriteException ? attErr.message : 'Unknown error';
                    errors.push(`Row ${currentIndex} (attendance): ${msg}`);
                    console.error(`Error saving attendance for ${employeeId}:`, attErr);
                }
            }

            currentIndex++;
        } catch (error) {
            const errorMsg = error instanceof AppwriteException ? error.message : 'Unknown error';
            errors.push(`Row ${currentIndex}: ${errorMsg}`);
            console.error(`Error inserting employee at index ${currentIndex}:`, error);
            currentIndex++;
        }
    }

    return { inserted, skipped, attendanceUpdated, errors };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const isSingleSheetRaw = formData.get('isSingleSheet');
        const monthRaw = formData.get('month');
        const monthNameRaw = formData.get('monthName');
        const yearRaw = formData.get('year');

        console.log('📥 Form data received:', {
            isSingleSheet: isSingleSheetRaw,
            monthRaw,
            yearRaw,
            monthNameRaw,
            fileName: file?.name,
        });

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type first
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an Excel or CSV file.' },
                { status: 400 }
            );
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
        }

        // Read buffer ONCE at the beginning
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        const isSingleSheet = isSingleSheetRaw === 'true';
        let month = NaN;
        let year = NaN;
        let monthName: string | undefined = undefined;

        if (isSingleSheet) {
            // For single sheet: USER SELECTION takes priority, auto-detect is fallback
            console.log('Single sheet detected.');
            
            // Check if user provided month/year in UI (prioritize user selection)
            const userMonth = monthRaw ? parseInt(String(monthRaw), 10) : NaN;
            const userYear = yearRaw ? parseInt(String(yearRaw), 10) : NaN;

            console.log('🔍 Month parsing:', {
                monthRaw,
                parsed: userMonth,
                isNaN: isNaN(userMonth),
                isValid: !isNaN(userMonth) && userMonth >= 1 && userMonth <= 12,
            });

            if (!isNaN(userMonth) && userMonth >= 1 && userMonth <= 12) {
                month = userMonth;
                console.log(`✅ Using user-selected month: ${month}`);
            } else {
                // User didn't select month, try to auto-detect from file
                console.log('❌ No valid month from user, trying auto-detect...');
                const sheetNames = getSheetNames(fileBuffer);
                console.log('Sheet names:', sheetNames);

                if (sheetNames.length > 0) {
                    const firstSheet = sheetNames[0];
                    const detectedMonth = detectMonthFromSheetName(firstSheet);
                    if (detectedMonth) {
                        month = detectedMonth;
                        console.log(`Auto-detected month: ${month} from sheet "${firstSheet}"`);
                    }
                }
            }

            if (!isNaN(userYear) && userYear >= 2000 && userYear <= 2100) {
                year = userYear;
                console.log(`✅ Using user-selected year: ${year}`);
            } else {
                // User didn't select year, try to auto-detect from file
                console.log('❌ No valid year from user, trying auto-detect...');
                const sheetNames = getSheetNames(fileBuffer);
                if (sheetNames.length > 0) {
                    const firstSheet = sheetNames[0];
                    const detectedYear = detectYearFromSheetName(firstSheet);
                    if (detectedYear) {
                        year = detectedYear;
                        console.log(`Auto-detected year: ${year} from sheet "${firstSheet}"`);
                    }
                }
            }

            if (isNaN(month) || month < 1 || month > 12) {
                return NextResponse.json({ error: 'Could not detect month from file. Please select manually.' }, { status: 400 });
            }
            if (isNaN(year) || year < 2000 || year > 2100) {
                return NextResponse.json({ error: 'Could not detect year from file. Please select manually.' }, { status: 400 });
            }
        } else {
            // For multiple sheets, month/year will be detected from Excel content
            monthName = monthNameRaw ? String(monthNameRaw) : undefined;
        }

        console.log('Processing Excel file from buffer...');

        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
            .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
        const databases = new Databases(client);

        // Ensure employees table exists
        console.log('Checking if table exists...');
        const tableExistsFlag = await tableExists();
        if (!tableExistsFlag) {
            console.log('Table does not exist, initializing...');
            await initializeEmployeesTable();
            console.log('Table initialized successfully');
        }

        // Parse Excel
        console.log('Processing Excel file...');
        const { employees, errors: validationErrors } = processExcelFileFromBuffer(fileBuffer, monthName);

        if (employees.length === 0) {
            return NextResponse.json(
                { error: 'No valid employee records found in file', details: validationErrors },
                { status: 400 }
            );
        }

        console.log(`Found ${employees.length} valid records — month=${month}, year=${year}`);

        const totals = { inserted: 0, skipped: 0, attendanceUpdated: 0, errors: [] as string[] };

        for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
            const chunk = employees.slice(i, i + CHUNK_SIZE);
            const batchResult = await insertEmployeesBatch(databases, chunk, month, year, i);

            totals.inserted += batchResult.inserted;
            totals.skipped += batchResult.skipped;
            totals.attendanceUpdated += batchResult.attendanceUpdated;
            totals.errors.push(...batchResult.errors);

            if (i + CHUNK_SIZE < employees.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: `Successfully imported employees for ${month}/${year}`,
                summary: {
                    total: employees.length,
                    inserted: totals.inserted,
                    skipped: totals.skipped,
                    attendanceUpdated: totals.attendanceUpdated,
                    errors: totals.errors,
                },
                validationErrors,
            },
            { status: 200 }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload employees', details: errorMessage },
            { status: 500 }
        );
    }
}
