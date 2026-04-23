# Employee Frontend Implementation Guide

## Context
- **Admin Frontend**: `admin.company` (THIS REPO - admin.company.ts)
- **Employee Frontend**: `employee.company` (SEPARATE REPO - needs these features)
- **Onboarding Portal**: `company.com/onboard/[token]` (can be in either, currently in admin repo)

---

## Employee Frontend Requirements

Employee portal should be completely separate from admin dashboard to enforce strict data isolation.

### 1. Authentication & Setup

#### 1.1 Employee Login Page
**Route**: `/login`

**Features**:
- Login with Employee ID + Password
- Password has been set during onboarding approval
- Remember me (optional)
- Forgot password link
- Company branding

**API Endpoint**:
```
POST /api/employee/auth/login
Body: { employeeId, password }
Returns: { success, employeeId, name, email, token }
```

#### 1.2 Password Setup (First Login)
**Route**: `/setup-password` (if password_hash not set)

**Features**:
- Employee sets password after onboarding approval
- Password strength validation (min 8 chars, uppercase, lowercase, number)
- Redirect to dashboard after setup

**API Endpoint**:
```
POST /api/employee/auth/setup-password
Body: { employeeId, newPassword }
Returns: { success }
```

---

### 2. Employee Dashboard

**Route**: `/dashboard`

**Components**:
```
┌─────────────────────────────────────┐
│ Header: Logo + Logout               │
├─────────────────────────────────────┤
│ Welcome, [Name]!                    │
├─────────────────────────────────────┤
│ Quick Links (5 tiles):              │
│ ├─ 📋 My Profile                    │
│ ├─ 💰 Salary Slips                  │
│ ├─ 📅 Attendance                    │
│ ├─ 🏖️  Leaves                       │
│ └─ 📄 Documents & Certificates      │
├─────────────────────────────────────┤
│ Personal Information Section:        │
│ ├─ Employee ID                      │
│ ├─ Name                             │
│ ├─ Designation                      │
│ ├─ Department                       │
│ ├─ CTC                              │
│ └─ Status (Active/On Leave)         │
├─────────────────────────────────────┤
│ Current Month Summary:              │
│ ├─ Present Days: X                  │
│ ├─ Absent Days: X                   │
│ ├─ Leave Days: X                    │
│ └─ Half Days: X                     │
└─────────────────────────────────────┘
```

**Data to Fetch**:
- Employee profile (name, designation, CTC, etc.)
- Current month attendance stats
- Pending leave requests count
- Pending certificate requests count

---

### 3. Profile Page

**Route**: `/profile`

**Features**:
- Display personal information (read-only)
- Contact information
- Bank details section (masked)
- Status badge
- Edit button (future: allow profile updates)

**Sections**:
```
Personal Information
├─ Employee ID: [display only]
├─ Full Name: [display only]
├─ Email: [display only]
├─ Designation: [display only]
├─ Department: [display only]
└─ Status: [Active/Inactive badge]

Employment Details
├─ Date of Joining: [display only]
├─ CTC: ₹[amount]
└─ Process/Team: [display only]

Bank Details (Masked)
├─ Bank Name: [display only]
├─ Account No: ••••[last 4 digits]
└─ IFSC: [display only]
```

---

### 4. Attendance Page

**Route**: `/attendance`

**Features**:
- Month/Year selector
- Daily attendance calendar
- Summary stats for selected month
- Color-coded attendance codes

**Attendance Codes**:
```
P  = Green   = Present (Full Day)
A  = Red     = Absent
L  = Orange  = Leave
HD = Blue    = Half Day
WO = Purple  = Week Off
LC = Pink    = Late Coming
CL = Orange  = Casual Leave
```

**Display Format**:
```
Month: [April ▼] Year: [2026 ▼]

┌─ Summary Stats ─────────────────┐
│ ✅ Present: 15                  │
│ ❌ Absent: 2                    │
│ 🏖️  Leave: 3                    │
│ 📋 Half Day: 2                  │
└─────────────────────────────────┘

┌─ Daily Breakdown ───────────────┐
│ [D1: P] [D2: P] [D3: A] ...     │
│ [D8: HD] [D9: L] [D10: P] ...   │
└─────────────────────────────────┘
```

**Data Points**:
- Can view up to 12 months historical
- Current month highlighted
- Can't edit (read-only)

---

### 5. Salary Slips Page

**Route**: `/salary`

**Features**:
- Month/Year selector
- Display salary slip details
- Download PDF option
- Salary components breakdown

**Salary Slip Components**:
```
Salary Slip - April 2026

Earnings:
├─ Basic Salary: ₹[amount]
├─ Dearness Allowance: ₹[amount]
├─ HRA: ₹[amount]
├─ Bonus/Incentives: ₹[amount]
└─ Other Allowances: ₹[amount]

Deductions:
├─ PF (Employee): ₹[amount]
├─ ESI (Employee): ₹[amount]
├─ TDS: ₹[amount]
├─ Professional Tax: ₹[amount]
└─ Other Deductions: ₹[amount]

Summary:
├─ Gross Salary: ₹[amount]
├─ Total Deductions: ₹[amount]
├─ Net Salary: ₹[amount]
└─ Bank Transfer: [PENDING/COMPLETED]
```

**Functionality**:
- View 12 months of salary slips
- Download as PDF
- Can't edit
- Show payment status (Pending/Completed)

---

### 6. Leaves Page

**Route**: `/leaves`

**Features**:
- Current year leave balance
- Pending leave requests
- Approved leave requests
- Request new leave button

**Leave Balance Display**:
```
Your Leave Balance (2026)

Casual Leave:
├─ Total Allotted: 12 days
├─ Used: 3 days
├─ Available: 9 days
└─ Carry Forward: 0 days

Sick Leave:
├─ Total Allotted: 8 days
├─ Used: 1 day
├─ Available: 7 days
└─ Carry Forward: 0 days

Privilege Leave:
├─ Total Allotted: 15 days
├─ Used: 2 days
├─ Available: 13 days
└─ Carry Forward: 0 days
```

**Leave Requests List**:
```
Pending Requests:
├─ [Request 1] From Apr 20-22 (CL) - Waiting approval
├─ [Request 2] From Apr 25-26 (SL) - Waiting approval

Approved Requests:
├─ [Request 1] From Apr 10-12 (CL) - Approved by Manager
├─ [Request 2] From Apr 1-3 (SL) - Approved by Manager

Rejected Requests:
├─ [Request 1] From Mar 30-31 (CL) - Rejected - Reason: Business need
```

**New Leave Request Form**:
- Leave Type (dropdown: CL, SL, PL, Maternity, etc.)
- From Date
- To Date
- Reason (required)
- Submit button
- Status notification

---

### 7. Documents & Certificates Page

**Route**: `/documents`

**Features**:
- Request certificates (Experience Letter, Offer Letter, Relieving Letter, Salary Certificate)
- Track certificate requests
- Download issued certificates

**Available Certificates**:
```
Experience Letter
├─ Status: [Request] / [Available] / [Pending Approval]
├─ Issued Date: [if available]
└─ Download: [button if issued]

Offer Letter
├─ Status: [Available - Already Issued]
├─ Issued Date: [date]
└─ Download: [button]

Salary Certificate
├─ Status: [Request]
└─ [Monthly / Annually selector]

Relieving Letter
├─ Status: [Not Available - For active employees only]
└─ [Grayed out]
```

**Certificate Request Modal**:
```
Request Certificate

Certificate Type: [Experience Letter ▼]
Reason (optional): [text area]
[Request] [Cancel]
```

---

### 8. Session & Security

**Features**:
- Auto-logout after 30 minutes inactivity
- Logout button in header
- Session token management
- "Remember Me" option (optional)

**Local Storage**:
```javascript
// employee_session
{
  employeeId: "EMP-1234567890",
  token: "...",
  expiresAt: "2026-04-23T15:30:00Z"
}
```

---

### 9. API Endpoints Required

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/employee/auth/login` | POST | ❌ | Employee login |
| `/api/employee/auth/setup-password` | POST | ❌ | First-time password setup |
| `/api/employee/auth/logout` | POST | ✅ | Logout |
| `/api/employee/profile` | GET | ✅ | Fetch employee profile |
| `/api/employee/attendance` | GET | ✅ | Fetch monthly attendance |
| `/api/employee/salary` | GET | ✅ | Fetch salary slip |
| `/api/employee/leaves/balance` | GET | ✅ | Fetch leave balance |
| `/api/employee/leaves/requests` | GET | ✅ | Fetch leave requests |
| `/api/employee/leaves/request` | POST | ✅ | Request new leave |
| `/api/employee/documents/certificates` | GET | ✅ | Fetch available certificates |
| `/api/employee/documents/request` | POST | ✅ | Request certificate |
| `/api/employee/documents/download/:id` | GET | ✅ | Download certificate/document |

---

### 10. Security & Privacy

**Critical Rules**:
- ✅ Employee can ONLY see their own data
- ✅ No company-wide employee lists
- ✅ No peer salary visibility
- ✅ No peer leave visibility
- ✅ No peer attendance visibility
- ❌ Cannot see other departments
- ❌ Cannot see other team members' data

**Implementation**:
- All API calls must verify `employeeId` matches logged-in user
- Never trust client-provided employeeId
- Use session token to identify actual employee
- Log all data access for audit trail

---

### 11. Responsive Design

**Breakpoints**:
- Mobile: < 640px (Stack all, single column)
- Tablet: 640px - 1024px (2 columns where applicable)
- Desktop: > 1024px (Full layout)

**Mobile Optimizations**:
- Touch-friendly buttons (min 44px height)
- Swipe for month navigation on attendance
- Full-width cards
- Simplified navigation (hamburger menu optional)

---

### 12. Styling & Branding

**Color Scheme** (Suggested):
```
Primary: #3b82f6 (Blue)
Secondary: #10b981 (Green)
Danger: #ef4444 (Red)
Warning: #f59e0b (Amber)
Background: #f9fafb (Light Gray)
Border: #e5e7eb (Gray)
Text: #111827 (Dark)
```

**Font**:
- Family: System fonts (SF Pro Display, Segoe UI, Roboto)
- Sizes: 12px (label), 14px (body), 16px (heading), 32px (title)
- Weight: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

### 13. Notifications & Messaging

**Toast Notifications**:
- Login success: "Welcome back, [Name]!"
- Logout: "You've been logged out"
- Leave request submitted: "Leave request submitted. Awaiting approval."
- Error: "Something went wrong. Please try again."

**Empty States**:
- No salary slips: "No salary slips available for this period"
- No leave requests: "You haven't requested any leaves yet"
- No attendance: "No attendance data for this period"

---

### 14. Performance Considerations

**Optimizations**:
- Lazy load salary/attendance PDFs
- Paginate long lists (20 items per page)
- Cache employee profile (refresh on explicit action)
- Debounce date selector changes
- Optimize images (avatars, logos)

---

### 15. Accessibility

**Requirements**:
- WCAG 2.1 Level AA compliance
- Semantic HTML
- ARIA labels on form inputs
- Keyboard navigation support
- Color contrast >= 4.5:1
- Focus indicators visible

---

## Implementation Priority

### Phase 1 (Critical)
1. Login page + session management
2. Dashboard with profile & stats
3. Attendance viewer
4. Logout functionality

### Phase 2 (Important)
5. Salary slips viewer
6. Leave balance + request form
7. Document request interface

### Phase 3 (Nice-to-have)
8. PDF downloads
9. Advanced filtering
10. Export capabilities
11. Calendar integrations

---

## Testing Checklist

- [ ] Login/logout flow
- [ ] Session persistence & expiry
- [ ] Profile displays correct data
- [ ] Attendance shows all months correctly
- [ ] Salary slip calculation accurate
- [ ] Leave balance calculation correct
- [ ] Leave request creates properly
- [ ] Certificate request workflow
- [ ] No data leakage between employees
- [ ] Mobile responsive
- [ ] Accessibility audit passed
- [ ] Performance targets met

---

## Backend Requirements (Ensure These Exist in Admin Repo)

| Feature | Status | Notes |
|---------|--------|-------|
| Employee auth endpoints | ✅ | Already built in admin repo |
| Profile fetch API | ✅ | Already built in admin repo |
| Attendance fetch API | ✅ | Already built in admin repo |
| Salary fetch API | ❌ | Needs to be built |
| Leave balance API | ⚠️ | Partially built |
| Leave request API | ⚠️ | Partially built |
| Certificate request API | ❌ | Needs to be built |
| Document download API | ⚠️ | Partially built |

---

## Notes

- Employee frontend should be completely isolated from admin frontend
- Use same Appwrite instance (different collections/permissions)
- All employee data access must be validated server-side
- Consider future mobile app (use same APIs)
- Plan for offline-capable features (attendance read-only)
