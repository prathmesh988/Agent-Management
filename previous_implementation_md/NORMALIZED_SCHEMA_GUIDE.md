# Normalized Database Schema for Department & Manager System

## Overview

The department and manager system uses **normalized collections** to avoid denormalization and maintain data integrity. Instead of storing department/manager info directly in the employees collection, we use separate collections with relationships.

## Collections

### 1. departments (Master Data)

**Purpose**: Store all departments/teams

**Schema**:
```
_id: string (generated)
name: string (required) - e.g., "Swiggy Operations"
code: string (required) - e.g., "SWIGGY", "GROFLEX"
description: string (optional)
status: enum ["active", "inactive"] (required)
$createdAt: datetime
```

**Example**:
```json
{
  "_id": "dept-001",
  "name": "Swiggy Operations",
  "code": "SWIGGY",
  "description": "Swiggy Delivery Team",
  "status": "active",
  "$createdAt": "2026-04-01T10:00:00.000Z"
}
```

**Query Examples**:
```javascript
// Get all active departments
Query.equal('status', 'active')

// Find by code
Query.equal('code', 'SWIGGY')
```

---

### 2. managers (Manager-Department Mapping)

**Purpose**: Link Appwrite users to departments for access control

**Schema**:
```
_id: string (generated)
userId: string (required) - Appwrite user ID
name: string (required)
email: string (required)
departmentId: string (required) - FK to departments._id
status: enum ["active", "inactive"] (required)
$createdAt: datetime
```

**Example**:
```json
{
  "_id": "mgr-001",
  "userId": "appwrite-user-abc123",
  "name": "Rajesh Kumar",
  "email": "rajesh@company.com",
  "departmentId": "dept-001",
  "status": "active",
  "$createdAt": "2026-04-01T10:00:00.000Z"
}
```

**Query Examples**:
```javascript
// Find manager by userId (access control)
Query.equal('userId', 'appwrite-user-abc123')

// Find all managers in a department
Query.equal('departmentId', 'dept-001')
```

---

### 3. employee_departments (Employee-Department Mapping)

**Purpose**: Normalize employee-to-department assignment with historical tracking

**Schema**:
```
_id: string (generated)
employeeId: string (required) - Employee ID from employees collection
departmentId: string (required) - FK to departments._id
managerId: string (optional) - FK to managers._id
startDate: datetime (required) - When assigned to department
endDate: datetime (optional) - When left department
status: enum ["active", "inactive"] (required)
$createdAt: datetime
```

**Example**:
```json
{
  "_id": "empdept-001",
  "employeeId": "EMP-1234567890",
  "departmentId": "dept-001",
  "managerId": "mgr-001",
  "startDate": "2026-01-15T00:00:00.000Z",
  "endDate": null,
  "status": "active",
  "$createdAt": "2026-04-01T10:00:00.000Z"
}
```

**Query Examples**:
```javascript
// Get current department for an employee
Query.equal('employeeId', 'EMP-1234567890')
Query.equal('status', 'active')

// Get all employees in a department
Query.equal('departmentId', 'dept-001')
Query.equal('status', 'active')

// Get employees under a specific manager
Query.equal('managerId', 'mgr-001')
Query.equal('status', 'active')
```

---

## Relationships

```
departments
    ↑
    ├─── managers.departmentId
    │
    └─── employee_departments.departmentId
         ↓
         employees.employeeId (NOT direct relationship, separate lookup)
```

### Flow Examples

**Manager views their team**:
1. Get manager record: `managers` where `userId = current_user_id`
2. Extract `departmentId`
3. Query `employee_departments` where `departmentId = manager.departmentId` and `status = 'active'`
4. Get `employeeId` values
5. Fetch employee details from `employees` collection

**Assign employee to department**:
1. Create/update in `employee_departments`:
   - `employeeId`: "EMP-123"
   - `departmentId`: "dept-001"
   - `managerId`: "mgr-001" (optional)
   - `startDate`: now
   - `status`: "active"
2. Do NOT modify employees collection

**Track employee transfers**:
1. Old assignment: set `endDate` and `status: 'inactive'`
2. New assignment: create fresh record with new `departmentId`
3. History is preserved in database

---

## Indexes

For performance, create indexes on frequently queried fields:

### managers collection
- Index on `userId` (for manager lookups)
- Index on `departmentId` (for department team size)

### employee_departments collection
- Index on `employeeId` (find current department)
- Index on `departmentId` (find team members)
- Index on `status` (filter active assignments)

---

## Benefits

✅ **No Denormalization**: Employees collection stays clean
✅ **Historical Tracking**: Can see when employees changed departments
✅ **Flexible Relationships**: Many-to-many support if needed
✅ **Data Integrity**: Single source of truth for each piece of data
✅ **Easy Updates**: Change manager/department without touching employees
✅ **Access Control**: Managers linked to departments directly

---

## API Endpoints Using Normalized Schema

### Create/Update Department Assignment
```
PATCH /api/admin/employees/:id/assign-manager
Body: { departmentId, managerId? }
→ Creates/updates employee_departments record
```

### Get Manager's Team
```
GET /api/admin/employees/my-team?departmentId=&status=
→ Joins: managers (userId) → employee_departments → employees
```

### List All Managers
```
GET /api/admin/managers
→ Reads managers collection, counts team from employee_departments
```

### Assign Manager to Department
```
POST /api/admin/managers
Body: { userId, name, email, departmentId }
→ Creates managers collection record
```

---

## Migration Guide (if updating existing data)

If you have old data with department/manager in employees collection:

1. **Create departments**: Insert all unique departments
2. **Create managers**: For each manager, insert with userId and departmentId
3. **Create assignments**: For each employee with department:
   ```
   INSERT employee_departments {
     employeeId,
     departmentId,
     managerId,
     startDate: '2026-01-01',
     status: 'active'
   }
   ```
4. **Remove old fields**: Delete department/manager columns from employees collection (optional, can keep for compatibility)

---

## Queries for Common Tasks

### Get employee's current department
```javascript
const result = await db.listDocuments('employee_departments', [
  Query.equal('employeeId', 'EMP-123'),
  Query.equal('status', 'active'),
  Query.limit(1)
]);
const assignment = result.documents[0];
const departmentId = assignment.departmentId;
```

### Get all employees in a department
```javascript
const result = await db.listDocuments('employee_departments', [
  Query.equal('departmentId', 'dept-001'),
  Query.equal('status', 'active'),
  Query.limit(100)
]);
const employeeIds = result.documents.map(d => d.employeeId);
// Then fetch from employees collection
```

### Get manager's team
```javascript
// 1. Find manager
const mgr = await db.listDocuments('managers', [
  Query.equal('userId', 'user-id'),
  Query.limit(1)
]);
const deptId = mgr.documents[0].departmentId;

// 2. Find employees in that department
const assignments = await db.listDocuments('employee_departments', [
  Query.equal('departmentId', deptId),
  Query.equal('status', 'active')
]);
const employeeIds = assignments.documents.map(d => d.employeeId);

// 3. Fetch employee details
const employees = (await db.listDocuments('employees', [
  Query.limit(1000)
])).documents.filter(e => employeeIds.includes(e.employeeId));
```

### Track employee department history
```javascript
const history = await db.listDocuments('employee_departments', [
  Query.equal('employeeId', 'EMP-123'),
  Query.orderDesc('startDate')
]);
// Shows all departments this employee has been in with dates
```

---

## Performance Considerations

- **Avoid N+1 queries**: Fetch all employee IDs first, then batch fetch employee data
- **Use pagination**: Don't load all employees at once
- **Cache manager lookups**: Manager-to-department mapping doesn't change often
- **Index critical fields**: departmentId, employeeId, userId, status
- **Lazy load**: Only fetch full employee details when needed (not in list views)

---

## Notes

- Department/Manager system is **completely separate** from employees collection
- Employees can exist without department assignment (no required FK)
- Historical data is preserved (departments/managers are never deleted, just marked inactive)
- Supports complex org structures (matrix reporting, multiple teams, transfers)
