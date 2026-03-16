import { Client, TablesDB, ID } from 'node-appwrite';

const DATABASE_ID = '6784f57b0000a70f1b79';
const TABLE_NAME = 'employees';
const TABLE_ID = 'emp_employees';

/**
 * Initialize the employees table with all required columns
 * Run this script once to set up the database schema
 */
export async function initializeEmployeesTable() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const tablesDB = new TablesDB(client);

    try {
        // Check if table already exists
        try {
            await tablesDB.getTable({
                databaseId: DATABASE_ID,
                tableId: TABLE_ID,
            });
            console.log('✓ Table already exists');
            return { success: true, message: 'Table already initialized' };
        } catch (err) {
            // Table doesn't exist, create it
            console.log('Creating new table...');
        }

        // Define columns with proper Appwrite format
        const columns = [
            // Basic Information
            { key: 'serialNo', type: 'integer' as const, required: false },
            { key: 'employeeId', type: 'string' as const, size: 50, required: true },
            { key: 'name', type: 'string' as const, size: 255, required: true },

            // Salary Information
            { key: 'ctc', type: 'double' as const, required: false },
            { key: 'attendanceAllowance', type: 'double' as const, required: false },

            // Employment Details
            { key: 'process', type: 'string' as const, size: 255, required: false },
            { key: 'designation', type: 'string' as const, size: 255, required: false },
            { key: 'dateOfJoining', type: 'string' as const, size: 50, required: false },

            // Banking Information
            { key: 'uanNumber', type: 'string' as const, size: 50, required: false },
            { key: 'accountNumber', type: 'string' as const, size: 50, required: false },
            { key: 'ifscCode', type: 'string' as const, size: 50, required: false },
            { key: 'bankName', type: 'string' as const, size: 255, required: false },

            // Payment Mode
            { key: 'paymentMode', type: 'string' as const, size: 50, required: false },

            // Attendance
            { key: 'presentDays', type: 'double' as const, required: false },
            { key: 'absentDays', type: 'double' as const, required: false },
            { key: 'leaveDays', type: 'double' as const, required: false },
            { key: 'halfDays', type: 'double' as const, required: false },
            { key: 'weekOffDays', type: 'double' as const, required: false },
            { key: 'holidayDays', type: 'double' as const, required: false },

            // Leave Types
            { key: 'cl', type: 'double' as const, required: false },
            { key: 'lc', type: 'double' as const, required: false },

            // Miscellaneous
            { key: 'trp', type: 'double' as const, required: false },
            { key: 'tra', type: 'double' as const, required: false },
            { key: 'trl', type: 'double' as const, required: false },

            // Attendance Summary
            { key: 'totalPresent', type: 'double' as const, required: false },
            { key: 'overtime', type: 'double' as const, required: false },
            { key: 'finalDays', type: 'double' as const, required: false },

            // Deductions and Advances
            { key: 'arrear', type: 'double' as const, required: false },
            { key: 'advance', type: 'double' as const, required: false },
            { key: 'shiftAllowance', type: 'double' as const, required: false },

            // Salary Calculation
            { key: 'grossSalary', type: 'double' as const, required: false },
            { key: 'attendanceDeduction', type: 'double' as const, required: false },
            { key: 'employeeContribution', type: 'double' as const, required: false },
            { key: 'employerContribution', type: 'double' as const, required: false },
            { key: 'tds', type: 'double' as const, required: false },
            { key: 'netSalary', type: 'double' as const, required: false },
            { key: 'penalty', type: 'double' as const, required: false },
            { key: 'paidAmount', type: 'double' as const, required: false },
        ];

        const table = await tablesDB.createTable({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
            name: TABLE_NAME,
            columns: columns as any,
        });

        console.log('✓ Table created successfully with 38 columns');
        return { success: true, message: 'Table initialized', table };
    } catch (error) {
        console.error('✗ Error initializing table:', error);
        throw error;
    }
}

/**
 * Check if the employees table exists
 */
export async function tableExists(): Promise<boolean> {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
        .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');

    const tablesDB = new TablesDB(client);

    try {
        await tablesDB.getTable({
            databaseId: DATABASE_ID,
            tableId: TABLE_ID,
        });
        return true;
    } catch (error) {
        return false;
    }
}

export { DATABASE_ID, TABLE_ID, TABLE_NAME };
