# Database Service Module (fetchDb)

A modular, type-safe database service layer for fetching data from Appwrite.

## Overview

The `fetchDb` module provides a clean, organized way to access all data from your Appwrite database. It separates concerns into focused modules:

- **`client.ts`** - Appwrite client initialization and configuration
- **`employees.ts`** - Employee data operations
- **`certificates.ts`** - Certificate data operations
- **`index.ts`** - Central export point

## Structure

```
src/services/database/
├── client.ts              # Appwrite client setup
├── employees.ts           # Employee queries
├── certificates.ts        # Certificate queries
├── index.ts              # Public API exports
├── USAGE_EXAMPLES.md     # Code examples
└── README.md             # This file
```

## Quick Start

### Import in Server-Side Code

```typescript
// Import specific functions as needed
import {
  fetchAllEmployees,
  fetchEmployee,
  searchEmployees,
  getEmployeeCount,
} from "@/services/database";

// Fetch all employees
const { employees, total } = await fetchAllEmployees(limit, offset);

// Search for an employee
const results = await searchEmployees("John");

// Get single employee
const emp = await fetchEmployee("EMP001");
```

## Employee Functions

### `fetchEmployee(employeeId: string)`

Fetch a single employee by employee ID.

```typescript
const employee = await fetchEmployee("EMP001");
```

### `fetchAllEmployees(limit?: number, offset?: number, queries?: string[])`

Fetch employees with pagination support.

```typescript
const { employees, total } = await fetchAllEmployees(50, 0);
```

### `searchEmployees(searchTerm: string)`

Search employees by name or employee ID.

```typescript
const results = await searchEmployees("John Doe");
```

### `fetchEmployeesByDesignation(designation: string)`

Get all employees with a specific designation.

```typescript
const engineers = await fetchEmployeesByDesignation("Senior Engineer");
```

### `fetchEmployeesByProcess(process: string)`

Get all employees in a specific process/department.

```typescript
const devTeam = await fetchEmployeesByProcess("Development");
```

### `getEmployeeCount()`

Get total number of employees.

```typescript
const count = await getEmployeeCount();
```

### `fetchEmployeesWithSalary()`

Fetch employees who have salary information.

```typescript
const salariedEmployees = await fetchEmployeesWithSalary();
```

## Certificate Functions

### `fetchCertificate(certificateId: string)`

Fetch a single certificate by ID.

```typescript
const cert = await fetchCertificate("CERT001");
```

### `fetchAllCertificates(limit?: number, offset?: number, queries?: string[])`

Fetch all certificates with pagination.

```typescript
const { certificates, total } = await fetchAllCertificates(50, 0);
```

### `searchCertificates(searchTerm: string)`

Search certificates by certificate ID or employee name.

```typescript
const results = await searchCertificates("John");
```

### `fetchCertificatesByEmployee(employeeName: string)`

Get all certificates for a specific employee.

```typescript
const certs = await fetchCertificatesByEmployee("John Doe");
```

### `getCertificateCount()`

Get total number of certificates.

```typescript
const count = await getCertificateCount();
```

## Types

### `EmployeeRecord`

TypeScript interface for employee data with all table columns.

```typescript
interface EmployeeRecord {
  $id: string;
  employeeId: string;
  name: string;
  designation?: string;
  ctc?: number;
  netSalary?: number;
  // ... and many more fields
}
```

## Important Notes

⚠️ **Server-Side Only**: These functions require the API secret key and can ONLY be used in:

- API routes (`src/app/api/`)
- Server components (async components in `app/` folder)
- `use server` functions
- Server-side scripts

❌ **Not for Client Components**: These functions cannot be called directly from client components. Use server actions or API routes instead.

## Configuration

The module uses environment variables from your `.env.local`:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT` - Appwrite API endpoint
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID` - Project ID
- `APPWRITE_PROJECT_ID_API_SECRET` - API secret (server-side only)
- `APPWRITE_DATABASE_ID` - Database ID

See `src/services/database/client.ts` for configuration details.

## Best Practices

1. **Error Handling**: All functions throw errors. Wrap them in try-catch blocks.

   ```typescript
   try {
     const employees = await fetchAllEmployees();
   } catch (error) {
     console.error("Failed to fetch:", error);
   }
   ```

2. **Pagination**: Use limit and offset for large datasets.

   ```typescript
   const pageSize = 50;
   const page = 0;
   const { employees, total } = await fetchAllEmployees(
     pageSize,
     page * pageSize,
   );
   ```

3. **Filtering**: Use queries parameter for advanced filtering.

   ```typescript
   import { Query } from "appwrite";

   const { employees, total } = await fetchAllEmployees(100, 0, [
     Query.greaterThan("ctc", 500000),
   ]);
   ```

## Extending the Module

To add new data sources:

1. Create a new file like `src/services/database/users.ts`
2. Import client functions from `client.ts`
3. Define interfaces and query functions
4. Export from `index.ts`

Example:

```typescript
// src/services/database/users.ts
import { createTablesDBWithAuth, DB_CONFIG } from "./client";

export async function fetchUserById(userId: string) {
  // Implementation
}

// Then add to index.ts:
export { fetchUserById } from "./users";
```

## Troubleshooting

### "API Secret not found" Error

Make sure `APPWRITE_PROJECT_ID_API_SECRET` is set in `.env.local` and the code is running on the server side.

### "Table not found" Error

Verify that:

- The table exists in your database
- The `DATABASE_ID` and table ID in `client.ts` are correct
- The database ID matches in `.env.local` (`APPWRITE_DATABASE_ID`)

### Empty Results

- Check if the data exists in your Appwrite database
- Verify query parameters and search terms
- Use pagination to ensure you're getting data (some functions have a default limit)

## See Also

- [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - Detailed code examples
- [Appwrite SDK Documentation](https://appwrite.io/docs)
