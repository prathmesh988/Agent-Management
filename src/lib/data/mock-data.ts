// Mock data for admin panel
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  salary?: number;
  phone?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin' | 'moderator';
  permissions: ('READ' | 'WRITE' | 'ADMIN')[];
  createdAt: string;
}

const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
const roles = ['Manager', 'Senior', 'Junior', 'Intern', 'Lead'];
const statuses: ('active' | 'inactive' | 'on-leave')[] = ['active', 'inactive', 'on-leave'];

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'Robert', 'Emily', 'David', 'Jessica',
  'James', 'Linda', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Nancy',
  'Thomas', 'Karen', 'Charles', 'Lisa', 'Christopher', 'Betty', 'Daniel', 'Margaret'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
}

function generateEmployeeId(index: number): string {
  return `EMP${String(index + 1).padStart(5, '0')}`;
}

export function generateMockEmployees(count: number = 50): Employee[] {
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);

    employees.push({
      id: generateEmployeeId(i),
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName),
      department: getRandomElement(departments),
      role: getRandomElement(roles),
      status: getRandomElement(statuses),
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      salary: 40000 + Math.floor(Math.random() * 100000),
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    });
  }

  return employees;
}

export function generateMockAdmins(): Admin[] {
  return [
    {
      id: 'ADMIN001',
      name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      role: 'super-admin',
      permissions: ['READ', 'WRITE', 'ADMIN'],
      createdAt: '2023-01-01',
    },
    {
      id: 'ADMIN002',
      name: 'Bob Smith',
      email: 'bob.smith@company.com',
      role: 'admin',
      permissions: ['READ', 'WRITE'],
      createdAt: '2023-06-15',
    },
    {
      id: 'ADMIN003',
      name: 'Carol Williams',
      email: 'carol.williams@company.com',
      role: 'moderator',
      permissions: ['READ'],
      createdAt: '2023-09-20',
    },
  ];
}

// Export instance data
export const mockEmployees = generateMockEmployees(50);
export const mockAdmins = generateMockAdmins();
