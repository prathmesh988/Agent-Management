/\*\*

- fetchDb Module - Usage Examples
-
- This file demonstrates how to use the modular database service layer
- for fetching data from Appwrite.
-
- ⚠️ IMPORTANT: These functions can only be called on the server-side
- (API routes, server components, or utilities with 'use server' directive)
- because they require the APPWRITE_PROJECT_ID_API_SECRET environment variable.
  \*/

// ---------- BASIC IMPORTS ----------
import {
// Employee functions
fetchAllEmployees,
fetchEmployee,
searchEmployees,
fetchEmployeesByDesignation,
fetchEmployeesByProcess,
getEmployeeCount,
fetchEmployeesWithSalary,

// Certificate functions
fetchAllCertificates,
fetchCertificate,
searchCertificates,
fetchCertificatesByEmployee,
getCertificateCount,

// Configuration
DB_CONFIG,
} from '@/services/database';

// ========== EMPLOYEE EXAMPLES ==========

/\*\*

- Example 1: Fetch all employees
  \*/
  async function example1_FetchAllEmployees() {
  try {
  const { employees, total } = await fetchAllEmployees(50, 0); // limit: 50, offset: 0
  console.log(`Fetched ${employees.length} employees out of ${total} total`);
  return employees;
  } catch (error) {
  console.error('Failed to fetch employees:', error);
  }
  }

/\*\*

- Example 2: Fetch a specific employee by ID
  \*/
  async function example2_FetchSingleEmployee() {
  try {
  const employee = await fetchEmployee('EMP001');
  if (employee) {
  console.log(`Found: ${employee.name} (${employee.designation})`);
  }
  return employee;
  } catch (error) {
  console.error('Failed to fetch employee:', error);
  }
  }

/\*\*

- Example 3: Search employees by name
  \*/
  async function example3_SearchEmployees() {
  try {
  const results = await searchEmployees('John'); // Search name or employeeId
  console.log(`Found ${results.length} matches`);
  return results;
  } catch (error) {
  console.error('Failed to search employees:', error);
  }
  }

/\*\*

- Example 4: Get employees by designation
  \*/
  async function example4_FetchByDesignation() {
  try {
  const engineers = await fetchEmployeesByDesignation('Senior Engineer');
  console.log(`Found ${engineers.length} senior engineers`);
  return engineers;
  } catch (error) {
  console.error('Failed to fetch by designation:', error);
  }
  }

/\*\*

- Example 5: Get employees by process/department
  \*/
  async function example5_FetchByProcess() {
  try {
  const devTeam = await fetchEmployeesByProcess('Development');
  console.log(`Found ${devTeam.length} development team members`);
  return devTeam;
  } catch (error) {
  console.error('Failed to fetch by process:', error);
  }
  }

/\*\*

- Example 6: Get total employee count
  \*/
  async function example6_GetEmployeeCount() {
  try {
  const count = await getEmployeeCount();
  console.log(`Total employees in database: ${count}`);
  return count;
  } catch (error) {
  console.error('Failed to get count:', error);
  }
  }

/\*\*

- Example 7: Fetch employees with salary information
  \*/
  async function example7_FetchEmployeesWithSalary() {
  try {
  const salariedEmployees = await fetchEmployeesWithSalary();
  console.log(`Found ${salariedEmployees.length} employees with salary data`);
      // Calculate total payroll
      const totalPayroll = salariedEmployees.reduce(
        (sum, emp) => sum + (emp.netSalary || 0),
        0
      );
      console.log(`Total monthly payroll: ${totalPayroll}`);
      return salariedEmployees;
  } catch (error) {
  console.error('Failed to fetch employees with salary:', error);
  }
  }

// ========== CERTIFICATE EXAMPLES ==========

/\*\*

- Example 8: Fetch all certificates
  \*/
  async function example8_FetchAllCertificates() {
  try {
  const { certificates, total } = await fetchAllCertificates(50, 0);
  console.log(`Fetched ${certificates.length} certificates out of ${total} total`);
  return certificates;
  } catch (error) {
  console.error('Failed to fetch certificates:', error);
  }
  }

/\*\*

- Example 9: Fetch a specific certificate by ID
  \*/
  async function example9_FetchSingleCertificate() {
  try {
  const cert = await fetchCertificate('CERT001');
  if (cert) {
  console.log(`Found: ${cert.employeeName}'s certificate`);
  }
  return cert;
  } catch (error) {
  console.error('Failed to fetch certificate:', error);
  }
  }

/\*\*

- Example 10: Search certificates
  \*/
  async function example10_SearchCertificates() {
  try {
  const results = await searchCertificates('John');
  console.log(`Found ${results.length} certificate matches`);
  return results;
  } catch (error) {
  console.error('Failed to search certificates:', error);
  }
  }

/\*\*

- Example 11: Fetch certificates by employee name
  \*/
  async function example11_FetchCertificatesByEmployee() {
  try {
  const certs = await fetchCertificatesByEmployee('John Doe');
  console.log(`Found ${certs.length} certificates for John Doe`);
  return certs;
  } catch (error) {
  console.error('Failed to fetch employee certificates:', error);
  }
  }

/\*\*

- Example 12: Get certificate count
  \*/
  async function example12_GetCertificateCount() {
  try {
  const count = await getCertificateCount();
  console.log(`Total certificates in database: ${count}`);
  return count;
  } catch (error) {
  console.error('Failed to get certificate count:', error);
  }
  }

// ========== API ROUTE EXAMPLE ==========

/\*\*

- Example API Route using fetchDb module
- File: src/app/api/employees/route.ts
  \*/
  export async function exampleAPIRoute_GET_request(request: Request) {
  try {
  // Get query parameters
  const url = new URL(request.url);
  const q = url.searchParams.get('q'); // Search query
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

      let employees;

      // Search if query provided, otherwise fetch all
      if (q) {
        employees = await searchEmployees(q);
      } else {
        const result = await fetchAllEmployees(limit, offset);
        employees = result.employees;
      }

      return Response.json({
        success: true,
        data: employees,
        count: employees.length,
      });

  } catch (error) {
  return Response.json(
  { success: false, error: String(error) },
  { status: 500 }
  );
  }
  }

// ========== HOW TO USE IN YOUR CODE ==========

/\*\*

- In a Server Component:
-
- import { fetchAllEmployees } from '@/services/database';
-
- export default async function EmployeeList() {
- const { employees } = await fetchAllEmployees();
-
- return (
-     <ul>
-       {employees.map(emp => (
-         <li key={emp.$id}>{emp.name} - {emp.designation}</li>
-       ))}
-     </ul>
- );
- }
  \*/

/\*\*

- In an API Route:
-
- import { fetchAllEmployees } from '@/services/database';
-
- export async function GET() {
- const { employees } = await fetchAllEmployees();
- return Response.json(employees);
- }
  \*/

/\*\*

- In a 'use server' function (Client Component calling server action):
-
- 'use server';
- import { searchEmployees } from '@/services/database';
-
- export async function searchEmployeeAction(query: string) {
- return await searchEmployees(query);
- }
-
- // In client component:
- const results = await searchEmployeeAction('John');
  \*/
