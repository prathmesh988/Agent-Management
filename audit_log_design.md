# HRMS Audit Log Page — Implementation Checkpoints

## Phase 1: Database Schema & Infrastructure
- [x] **1.1 Collection Initialization**
  - Create a script (e.g., `scripts/init-audit-logs.js`) to initialize the `audit_logs` collection in Appwrite.
  - Define all required attributes: `timestamp` (datetime/string), `actor_id` (string), `actor_name_snapshot` (string), `actor_role_snapshot` (string), `actor_ip` (string), `actor_user_agent` (string), `session_id` (string), `module` (string/enum), `action_type` (string/enum), `target_type` (string), `target_id` (string), `target_name_snapshot` (string), `field_changes` (stringified JSON), `result` (string), `severity` (string), `metadata` (stringified JSON).
  - Add necessary indexes: `timestamp`, `actor_id`, `module`, `severity`, `action_type`, `session_id`.
- [x] **1.2 Database Security**
  - Ensure collection permissions are strictly append-only (create permission only, no update or delete permissions for any role).

## Phase 2: Backend Logger Utility
- [x] **2.1 Logger Service Implementation**
  - Create an internal utility (e.g., `src/lib/audit-logger.ts`) to handle writing logs securely.
  - Implement automatic timestamp generation in UTC.
  - Implement role snapshot capturing (fetching current role at the exact time of action).
- [x] **2.2 Severity Auto-Assignment Logic**
  - Build rules engine to auto-assign severity (Critical, High, Medium, Low) based on `action_type` and `module` (e.g., Critical for payroll changes, role upgrades).

## Phase 3: Audit Log UI - Layout & Top Bar
- [x] **3.1 Page Skeleton & Routing**
  - Create the page route (e.g., `src/app/admin/audit-log/page.tsx`).
  - Restrict access to authorized roles (Super Admin, HR Manager, IT Admin, Payroll Admin) and log unauthorized access attempts as "High" severity.
- [x] **3.2 Page Header**
  - Render "Audit log" title.
  - Add green "Immutable" badge with tooltip ("Entries in this log cannot be edited or deleted.").
  - Add "Export" and "Refresh" buttons to the top-right.
- [x] **3.3 Summary Metrics Bar**
  - Display 4 metrics: Total events, Critical events (Red), Failed actions (Amber), Unique actors.
  - Make metrics clickable to instantly apply the relevant filter (e.g., clicking Critical sets severity filter).

## Phase 4: Filter Bar
- [x] **4.1 Filter Controls Implementation**
  - Implement Search input (actor, target, IP, session).
  - Implement Dropdowns: Module, Action type, Severity, Result.
  - Implement Date range picker (defaults: 30 days ago to today).
  - Implement Actor typeahead search and Target employee input.
- [x] **4.2 State Management & URL Sync**
  - Ensure all filters apply using AND logic.
  - Persist all active filters to URL query parameters for shareable/bookmarkable links.
  - Implement "Clear all filters" functionality.

## Phase 5: Audit Log Table
- [x] **5.1 Column Layout & Rendering**
  - Timestamp column (Local time, timezone label, 2 lines: date then time).
  - Actor column (3 lines: name bold, ID muted, role snapshot muted italic).
  - Module & Action columns.
  - Target record column (Name + ID or Scope description).
  - Field change column (Format diffs with red strikethrough for old, green bold for new).
  - Result (Success/Failed badge), IP address (monospace), and Severity badge (color-coded).
- [x] **5.2 Row Interaction**
  - Implement inline row expansion to show full field diffs, User Agent, Session ID, and IP Geolocation.
  - Add quick-filter click handlers for Actor name, IP address, and Session ID directly from the table rows.
- [x] **5.3 Pagination**
  - Implement standard pagination controls.
  - Add page size selector (25, 50, 100, 200).

## Phase 6: Export Feature
- [x] **6.1 Export Logic**
  - Build server-side export generation for CSV/PDF formats applying current filters.
  - Ensure exported timestamps are explicitly noted as UTC.
  - Calculate and append an SHA-256 hash of the contents at the bottom of the export for tamper-evidence.
- [x] **6.2 Export Auditing & Access**
  - Restrict export action strictly to roles with "Audit log export" permission.
  - Automatically generate a "Critical" audit log entry recording the export action (who, filters used, record count).

## Phase 7: Integration & Non-Functional Requirements
- [x] **7.1 Integration points**
  - Update all modules (Payroll, Leave, Attendance, Roles, Employee profile, Documents, Reports, Auth) to call the logger utility on state changes.
- [x] **7.2 SIEM API Endpoint (Optional/Future)**
  - Expose a read-only paginated REST endpoint for third-party SIEM tool ingestion.
