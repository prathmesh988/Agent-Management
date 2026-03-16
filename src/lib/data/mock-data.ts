// Mock data for admin panel
import { Employee } from "@/lib/types";

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "super-admin" | "admin" | "moderator";
  permissions: ("READ" | "WRITE" | "ADMIN")[];
  createdAt: string;
}

const departments = [
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
];
const roles = ["Manager", "Senior", "Junior", "Intern", "Lead"];
const statuses: ("active" | "inactive" | "on-leave")[] = [
  "active",
  "inactive",
  "on-leave",
];

const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "Robert",
  "Emily",
  "David",
  "Jessica",
  "James",
  "Linda",
  "William",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Nancy",
  "Thomas",
  "Karen",
  "Charles",
  "Lisa",
  "Christopher",
  "Betty",
  "Daniel",
  "Margaret",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
}

function generateEmployeeId(index: number): string {
  return `EMP${String(index + 1).padStart(5, "0")}`;
}

export function generateMockEmployees(count: number = 50): Employee[] {
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const designation = getRandomElement(roles);
    const department = getRandomElement(departments);
    const baseSalary = 40000 + Math.floor(Math.random() * 100000);

    employees.push({
      id: generateEmployeeId(i),
      serialNo: i + 1,
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName),
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      designation,
      department,
      dateOfJoining: new Date(
        2020 + Math.floor(Math.random() * 4),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      )
        .toISOString()
        .split("T")[0],
      status: getRandomElement(statuses),
      ctc: baseSalary,
      grossSalary: baseSalary,
      netSalary: Math.floor(baseSalary * 0.85), // After deductions
      attendanceAllowance: 500,
      shiftAllowance: 200,
      tds: Math.floor(baseSalary * 0.1),
      presentDays: Math.floor(Math.random() * 20) + 15,
      absentDays: Math.floor(Math.random() * 5),
      totalPresent: Math.floor(Math.random() * 20) + 15,
      paymentMode: getRandomElement(["Bank Transfer", "Check", "Cash"]),
    });
  }

  return employees;
}

export function generateMockAdmins(): Admin[] {
  return [
    {
      id: "ADMIN001",
      name: "Alice Johnson",
      email: "alice.johnson@company.com",
      role: "super-admin",
      permissions: ["READ", "WRITE", "ADMIN"],
      createdAt: "2023-01-01",
    },
    {
      id: "ADMIN002",
      name: "Bob Smith",
      email: "bob.smith@company.com",
      role: "admin",
      permissions: ["READ", "WRITE"],
      createdAt: "2023-06-15",
    },
    {
      id: "ADMIN003",
      name: "Carol Williams",
      email: "carol.williams@company.com",
      role: "moderator",
      permissions: ["READ"],
      createdAt: "2023-09-20",
    },
  ];
}

// Export instance data
export const mockEmployees = generateMockEmployees(50);
export const mockAdmins = generateMockAdmins();
