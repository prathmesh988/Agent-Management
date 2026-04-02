import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query, AppwriteException } from 'node-appwrite';
import { initializeEmployeesTable, tableExists, DATABASE_ID, COLLECTION_ID } from '@/lib/initialize-table';
import { processExcelFileFromBuffer, TransformedEmployee } from '@/lib/excel-import';
import { saveMonthlyAttendance } from '@/services/database/monthly-attendance';


const CHUNK_SIZE = 100;

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
                await databases.createDocument({
                    databaseId: DATABASE_ID,
                    collectionId: COLLECTION_ID,
                    documentId: ID.unique(),
                    data: employee,
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
        const monthRaw = formData.get('month');
        const monthNameRaw = formData.get('monthName');
        const yearRaw = formData.get('year');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const month = monthRaw ? parseInt(String(monthRaw), 10) : NaN;
        const year = yearRaw ? parseInt(String(yearRaw), 10) : NaN;
        const monthName = monthNameRaw ? String(monthNameRaw) : undefined;

        if (isNaN(month) || month < 1 || month > 12) {
            return NextResponse.json({ error: 'Invalid or missing month (must be 1–12)' }, { status: 400 });
        }
        if (isNaN(year) || year < 2000 || year > 2100) {
            return NextResponse.json({ error: 'Invalid or missing year' }, { status: 400 });
        }

        // Validate file type
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

        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

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
