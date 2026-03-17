import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query, AppwriteException } from 'node-appwrite';
import { initializeEmployeesTable, tableExists, DATABASE_ID, COLLECTION_ID } from '@/lib/initialize-table';
import { processExcelFileFromBuffer, TransformedEmployee } from '@/lib/excel-import';

const CHUNK_SIZE = 50; // Process employees in batches of 50

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
 * Insert employees in batches to avoid rate limiting
 */
async function insertEmployeesBatch(
    databases: Databases,
    employees: TransformedEmployee[],
    startIndex: number = 0
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];
    let currentIndex = startIndex;

    for (const employee of employees) {
        try {
            // Check if employee already exists
            const exists = await employeeExists(databases, employee.employeeId as string);
            if (exists) {
                skipped++;
                currentIndex++;
                continue;
            }

            // Insert the employee record
            await databases.createDocument({
                databaseId: DATABASE_ID,
                collectionId: COLLECTION_ID,
                documentId: ID.unique(),
                data: employee,
            });

            inserted++;
            currentIndex++;

            // Log progress every 10 records
            if (inserted % 10 === 0) {
                console.log(`Progress: ${inserted} employees inserted...`);
            }
        } catch (error) {
            const errorMsg = error instanceof AppwriteException ? error.message : 'Unknown error';
            errors.push(`Row ${currentIndex}: ${errorMsg}`);
            console.error(`Error inserting employee at index ${currentIndex}:`, error);
        }
    }

    return { inserted, skipped, errors };
}

export async function POST(request: NextRequest) {
    try {
        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
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

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        console.log('Processing Excel file from buffer...');

        // Initialize Appwrite client
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
            .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
        const databases = new Databases(client);

        // Check if table exists, if not initialize it
        console.log('Checking if table exists...');
        const tableExistsFlag = await tableExists();

        if (!tableExistsFlag) {
            console.log('Table does not exist, initializing...');
            await initializeEmployeesTable();
            console.log('Table initialized successfully');
        } else {
            console.log('Table already exists');
        }

        // Process Excel file from buffer
        console.log('Processing Excel file...');
        const { employees, errors: validationErrors } = processExcelFileFromBuffer(fileBuffer);

        if (employees.length === 0) {
            return NextResponse.json(
                {
                    error: 'No valid employee records found in file',
                    details: validationErrors,
                },
                { status: 400 }
            );
        }

        console.log(`Found ${employees.length} valid records to import`);

        // Insert employees in batches
        const totalInserted: { inserted: number; skipped: number; errors: string[] } = {
            inserted: 0,
            skipped: 0,
            errors: [],
        };

        for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
            const chunk = employees.slice(i, i + CHUNK_SIZE);
            const batchResult = await insertEmployeesBatch(databases, chunk, i);

            totalInserted.inserted += batchResult.inserted;
            totalInserted.skipped += batchResult.skipped;
            totalInserted.errors.push(...batchResult.errors);

            // Add delay between batches to avoid rate limiting
            if (i + CHUNK_SIZE < employees.length) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: `Successfully imported employees`,
                summary: {
                    total: employees.length,
                    inserted: totalInserted.inserted,
                    skipped: totalInserted.skipped,
                    errors: totalInserted.errors,
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
