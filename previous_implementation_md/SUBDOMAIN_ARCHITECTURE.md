# Subdomain Architecture & Implementation Strategy

## Overview

Your system uses separate subdomains for different user types:

```
company.com                 (Landing/public)
├── admin.company.com      (THIS REPO: Admin/HR Portal)
├── employee.company.com   (SEPARATE REPO: Employee Portal)
└── onboard.company.com    (Can be either, currently in admin repo)
```

---

## Admin Frontend (admin.company) - THIS REPO

### Current Status: 55% Complete

**What This Repo Should Have**:
- ✅ Admin authentication (Appwrite)
- ✅ Employee management (CRUD)
- ✅ Attendance admin features
- ✅ Payroll management
- ✅ Leave approval workflows
- ✅ Certificate management
- ✅ Onboarding admin features
- ⚠️ Approval dashboard (needs improvement)
- ❌ User role management (only basic)
- ❌ Audit logging
- ❌ Manager-specific filtering
- ❌ Department management

**What NOT To Have Here**:
- ❌ Employee-facing login/dashboard (belongs in employee.company)
- ❌ Employee-only features (salary slips, leaves, documents from employee perspective)
- ❌ Employee self-service (belongs in employee.company)

---

## Employee Frontend (employee.company) - SEPARATE REPO

### Current Status: 0%

**What Should Be Built There**:
- ✅ Employee login (Employee ID + Password)
- ✅ Employee dashboard (personal stats only)
- ✅ Attendance viewer (own attendance only)
- ✅ Salary slips (own salary only)
- ✅ Leave balance & requests (own leaves only)
- ✅ Document requests & downloads
- ✅ Profile view (own profile only)

**See**: `EMPLOYEE_FRONTEND_REQUIREMENTS.md` for detailed specs

---

## What I Built in This Repo (To Remove/Keep as Reference)

I created placeholder `/employee/*` routes in admin.company just as reference implementations:

```
src/app/employee/login/page.tsx            ← Reference only
src/app/employee/dashboard/page.tsx        ← Reference only
src/app/employee/attendance/page.tsx       ← Reference only
src/app/employee/salary/page.tsx           ← Reference only
src/app/employee/leaves/page.tsx           ← Reference only
src/app/employee/documents/page.tsx        ← Reference only
src/app/employee/profile/page.tsx          ← Reference only
src/app/api/employee/*                     ← Reference API implementations
src/app/employee/*.css                     ← Reference styling
```

**Recommendation**: 
- ❌ **Option 1**: Delete all `/employee/*` routes from this repo (clean separation)
- ✅ **Option 2**: Keep as reference examples, mark as "Reference Implementation" in comments
- ✅ **Option 3**: Move to separate `employee-frontend` repo

**I suggest Option 1** - Remove them to keep admin.company focused on admin features only.

---

## API Layer Strategy

### Backend Endpoints (In admin.company repo)

These endpoints serve **BOTH** admin.company and employee.company:

#### Public Endpoints
```
POST /api/employee/auth/login
POST /api/employee/auth/setup-password
POST /api/onboarding/validate
POST /api/onboarding/submit
```

#### Protected Endpoints (Require session token)
```
GET  /api/employee/profile?employeeId=[id]
GET  /api/employee/attendance?employeeId=[id]&year=2026&month=4
GET  /api/employee/salary?employeeId=[id]
GET  /api/employee/leaves/balance?employeeId=[id]
POST /api/employee/leaves/request
GET  /api/employee/documents?employeeId=[id]
POST /api/employee/documents/request
GET  /api/employee/documents/download/:id
```

#### Admin-Only Endpoints
```
GET  /api/admin/employees
POST /api/admin/employees
PUT  /api/admin/employees/:id
DELETE /api/admin/employees/:id
POST /api/admin/approvals
GET  /api/admin/onboarding/submissions
PATCH /api/admin/onboarding/submissions/:id/review
POST /api/admin/attendance
... etc
```

**Key Point**: All protected endpoints must verify that `employeeId` in the request matches the authenticated user's ID. Don't trust client-provided values.

---

## Frontend Layer Strategy

### Admin Frontend (admin.company) - THIS REPO
- Only imports from admin routes (`/admin/*`)
- Only shows admin features
- Uses Appwrite auth (email/password for admins)
- Can make calls to all API endpoints (with proper auth)

### Employee Frontend (employee.company) - SEPARATE REPO
- Only imports from employee routes (in separate repo)
- Only shows employee features
- Uses Employee ID + Password auth
- Can ONLY make calls to employee-specific API endpoints
- Never has access to admin features

---

## Authentication Flows

### Admin Login (admin.company)
```
1. User enters email + password
2. Authenticates via Appwrite
3. Appwrite returns session token
4. Middleware verifies session on protected routes
5. Can access /admin/* routes + admin APIs
```

### Employee Login (employee.company)
```
1. User enters Employee ID + Password
2. Calls POST /api/employee/auth/login
3. Backend verifies credentials
4. Returns session token (JWT or custom)
5. Stored in localStorage
6. Sent with each request to employee APIs
7. Can access /employee/* routes + employee APIs only
```

---

## Security Rules

### For Employee APIs
- ✅ User can only see their own data
- ✅ Backend verifies employeeId matches auth user
- ✅ No sensitive admin data exposed
- ❌ Employee cannot access admin routes
- ❌ Employee cannot see other employees' data

### For Admin APIs
- ✅ Admin can see all employee data
- ✅ Admin has role-based access
- ✅ Audit logging for all access
- ❌ Cannot accidentally expose to employees

### Validation Layer (Critical)
```typescript
// BAD - Trusts client
GET /api/employee/profile?employeeId=EMP-999  // Could request anyone's data!

// GOOD - Uses auth token
GET /api/employee/profile
Headers: Authorization: Bearer [token]
// Backend decodes token, extracts employeeId, returns that employee's data only
```

---

## Implementation Checklist

### Phase 1: Foundation (Current - WIP)
- [x] Admin employee management
- [x] Attendance tracking
- [x] Payroll system
- [x] Onboarding portal
- [ ] Employee login API
- [ ] Employee profile API
- [ ] Employee attendance API
- [ ] Employee salary API
- [ ] Session management for employees

### Phase 2: Employee Frontend
- [ ] Create employee.company repo
- [ ] Implement login page
- [ ] Implement dashboard
- [ ] Implement attendance viewer
- [ ] Implement salary viewer
- [ ] Implement leave management
- [ ] Implement document requests
- [ ] Test data isolation

### Phase 3: Security & Compliance
- [ ] Audit logging
- [ ] Role-based access control
- [ ] Manager filtering
- [ ] Activity tracking
- [ ] Security audit
- [ ] Penetration testing

### Phase 4: Polish & Deployment
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Browser testing
- [ ] Production deployment

---

## File Organization Recommendation

### admin.company repo structure
```
src/
├── app/
│   ├── admin/              ← Admin features
│   ├── auth/               ← Admin auth
│   ├── api/
│   │   ├── admin/          ← Admin endpoints
│   │   ├── employee/       ← Employee API endpoints (multi-use)
│   │   ├── onboarding/     ← Onboarding endpoints
│   │   └── approval/       ← Approval workflows
│   └── onboard/            ← Onboarding portal
├── components/
│   ├── admin/              ← Admin-specific components
│   └── ui/                 ← Shared UI components
├── lib/
│   ├── auth-utils.ts       ← Admin auth logic
│   ├── appwrite-client.ts  ← Appwrite setup
│   └── types.ts            ← Shared types
└── services/
    └── database/           ← DB operations for all features
```

### employee.company repo structure (SEPARATE)
```
src/
├── app/
│   ├── employee/           ← Employee features
│   ├── auth/               ← Employee auth
│   └── api/               ← None (all calls to admin.company API)
├── components/
│   ├── employee/           ← Employee-specific components
│   └── ui/                 ← Shared UI components
├── lib/
│   ├── auth-utils.ts       ← Employee auth logic
│   ├── api-client.ts       ← HTTP client for calling admin.company APIs
│   └── types.ts            ← Shared types
└── hooks/
    ├── useEmployeeAuth.ts  ← Employee session management
    └── useEmployeeData.ts  ← Fetch employee data
```

---

## Communication Between Frontends

### Admin Frontend → APIs (both)
```
fetch('https://admin.company.com/api/admin/employees')
fetch('https://admin.company.com/api/employee/profile')
```

### Employee Frontend → APIs (admin.company)
```
// Call admin.company APIs from employee.company
fetch('https://admin.company.com/api/employee/auth/login', ...)
fetch('https://admin.company.com/api/employee/profile', ...)
fetch('https://admin.company.com/api/employee/attendance', ...)
```

**CORS Setup Needed**:
- admin.company allows requests from employee.company
- Add to Next.js API routes or middleware

---

## Summary

| Aspect | Admin (THIS REPO) | Employee (SEPARATE REPO) |
|--------|-------------------|--------------------------|
| **Domain** | admin.company | employee.company |
| **Auth Type** | Appwrite email/password | Employee ID + password |
| **Features** | All admin/HR features | Employee self-service only |
| **Data Access** | All employee data | Own data only |
| **Routes** | `/admin/*` | `/employee/*` |
| **APIs** | All endpoints | `/api/employee/*` + `/api/onboarding/*` |
| **Status** | 55% complete | 0% (needs new repo) |
| **Next Steps** | Complete APIs, audit logging | Create new repo, build frontend |

---

## Immediate Actions

### For admin.company repo (THIS REPO)
1. ✅ Keep admin features (dashboard, employees, attendance, payroll)
2. ❌ Remove `/employee/*` routes (move to separate repo)
3. ✅ Keep `/api/employee/*` endpoints (shared with employee.company)
4. Build missing APIs: salary, document requests, etc.
5. Add audit logging
6. Implement manager filtering

### For employee.company repo (NEW REPO)
1. Create new Next.js project
2. Use `/api/employee/*` endpoints from admin.company
3. Build UI based on EMPLOYEE_FRONTEND_REQUIREMENTS.md
4. Implement client-side session management
5. Deploy to employee.company subdomain

