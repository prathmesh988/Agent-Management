# Authentication Architecture

> How auth works in this project — from login to every protected API call.

---

## Overview

This project uses **Appwrite** as the auth backend, but with a **non-standard session propagation strategy**. Rather than relying on Appwrite's native httpOnly session cookies for server-side verification, the app stores the session in `localStorage` and sends the `userId` as a custom `x-user-id` request header. The server then verifies that userId via the Appwrite **Admin SDK**.

```
Browser (client-side)          Next.js Server (API routes / middleware)
─────────────────────          ──────────────────────────────────────────
Appwrite JS SDK login  ──────► Appwrite stores session in browser storage
Sets auth_session=true ──────► Middleware reads this cookie to gate routes
localStorage user_session ───► x-user-id header ──► Admin SDK lookup ──► ✅/❌
```

---

## 1. Login Flow

### Magic Link (primary method)

```
User enters email
    │
    ▼
sendMagicLink()                  ← src/services/auth.ts
    │  account.createMagicURLToken(...)
    │  Appwrite emails a link: /login?userId=...&secret=...
    ▼
User clicks link → verifyMagicLink(userId, secret)
    │  account.updateMagicURLSession(userId, secret)
    │  Appwrite SDK stores session token in browser storage
    │
    ├─► document.cookie = "auth_session=true; ..."   ← plain marker for middleware
    └─► localStorage.setItem("user_session", { userId, email, name, timestamp })
```

### Email + Password (alternative)

```
logIn(email, password)
    │  account.createEmailPasswordSession(email, password)
    │
    ├─► document.cookie = "auth_session=true; ..."
    └─► (localStorage written on next getCurrentUser() call)
```

> **Why localStorage?**  
> The Appwrite **client-side JS SDK** (`appwrite` package) stores sessions in `IndexedDB` / browser storage internally. It does **not** set a traditional httpOnly server-readable cookie by default in all environments. The app works around this by explicitly persisting `userId` to `localStorage`.

---

## 2. The Two Cookies Explained

| Cookie | Set by | Value | Purpose |
|---|---|---|---|
| `auth_session` | `document.cookie` in `auth.ts` | `"true"` | **Middleware guard only** — proves the user went through login |
| `a_session_<projectId>` | Appwrite SDK internally | Session token | Full Appwrite session — used as a server-side fallback when available |

The middleware (`src/middleware.ts`) checks for `auth_session` to decide whether to redirect to `/login`. It does **not** verify the actual Appwrite session — it only checks presence.

---

## 3. Session Persistence — `localStorage`

After login, `localStorage` holds:

```json
{
  "userId": "6623abc...",
  "email": "hr@company.com",
  "name": "HR Admin",
  "timestamp": 1713800000000
}
```

- **TTL**: 24 hours from `timestamp`
- **Location**: `localStorage.getItem("user_session")`
- **Used by**: `useCurrentUser` hook, `getCurrentUser()`, `authFetch()` in dashboards

---

## 4. Client → Server Authentication

Every authenticated fetch call from the browser includes a `x-user-id` header:

```ts
// Pattern used in all dashboard pages
async function authFetch(input, init = {}) {
  const userId = JSON.parse(localStorage.getItem('user_session')).userId;
  return fetch(input, {
    ...init,
    headers: { ...init.headers, 'x-user-id': userId },
  });
}
```

The `useCurrentUser` hook (used by sidebar, layout, etc.) also sends this header to `/api/admin/current-user`.

---

## 5. Server-Side Verification — `getAuthenticatedUser()`

**File**: `src/lib/auth-utils.ts`

All protected API routes call this function. It tries two strategies in order:

```
getAuthenticatedUser(req)
    │
    ├─ 1. Read x-user-id from req.headers
    │       │
    │       ├─ Found? ──► Admin SDK: users.get(userId)
    │       │               ├─ Valid? ──► return fullUser (with labels/role) ✅
    │       │               └─ Invalid? ──► return null (don't fall through — prevents spoofing) ❌
    │       │
    │       └─ Not found? → try next strategy
    │
    └─ 2. Read a_session_<projectId> from cookies()
            │
            ├─ Found? ──► SDK session client: account.get()
            │               └─ Valid? ──► Admin SDK: users.get(userId) ──► return fullUser ✅
            │
            └─ Not found? ──► return null ❌
```

```ts
// Usage in every protected API route
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... proceed
}
```

> **Important**: Always pass `req` to `getAuthenticatedUser(req)` in API route handlers, otherwise the `x-user-id` header won't be read.

---

## 6. Role System

Roles are stored as **Appwrite user labels** (set via admin SDK or Appwrite console).

| Label | Role | Access |
|---|---|---|
| `admin` | Full admin | All routes, all actions |
| `viewer` | Read-only staff | Most admin pages, no destructive actions |
| `mvp` | Approved user | Read access |
| `new_user` | Pending approval | Blocked — sees "Waiting for Approval" screen |
| *(no label)* | New signup | Same as `new_user` |

**Where roles are resolved**: `GET /api/admin/current-user` reads `user.labels[]` and maps them to a `role` string returned to the client.

**Where roles are enforced**:
- Middleware (`src/middleware.ts`) — blocks `new_user` from accessing `/admin/*`
- `src/lib/route-protection.ts` — marks specific routes as `requiresAdmin: true`
- Sidebar (`components/admin/sidebar.tsx`) — shows lock badge on restricted items
- Individual API routes — check role from `getAuthenticatedUser()` response

---

## 7. Middleware Guard

**File**: `src/middleware.ts`

```
Incoming Request
    │
    ├─ Is public route? (/login, /api/auth/*, /onboard/*, /api/onboarding/*)
    │       └─ Yes? ──► Pass through ✅
    │
    └─ Protected route
            │
            ├─ Has auth_session cookie? ──► No? ──► Redirect to /login ❌
            │
            └─ Is new_user role? ──► Yes? ──► Redirect to /admin/pending-approval ⚠️
```

The middleware does **not** make an Appwrite API call — it only reads the `auth_session` cookie. Deep role checks happen in API routes and page-level components.

---

## 8. Public Routes (No Auth Required)

These routes bypass all auth checks entirely:

| Route pattern | Purpose |
|---|---|
| `/login` | Login page |
| `/api/auth/*` | Magic link verification endpoint |
| `/onboard/*` | Candidate onboarding form (no login needed) |
| `/api/onboarding/validate` | Token validation for candidates |
| `/api/onboarding/submit` | Form submission (validated by invite token, not user session) |

---

## 9. Logout Flow

```
logOut()                              ← src/services/auth.ts
    │
    ├─► account.deleteSession('current')   ← invalidates Appwrite session
    ├─► document.cookie = "auth_session=; expires=..."   ← clears middleware cookie
    ├─► localStorage.removeItem('user_session')
    └─► sessionStorage.clear()
```

---

## 10. Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  Magic Link Click                                               │
│       │                                                         │
│       ▼                                                         │
│  verifyMagicLink()  ──────────────────► Appwrite Cloud          │
│       │                                (session created)        │
│       ▼                                                         │
│  localStorage: { userId, email, ... }                           │
│  cookie: auth_session=true                                      │
│       │                                                         │
│       ▼                                                         │
│  useCurrentUser()                                               │
│       │  fetch('/api/admin/current-user', {                     │
│       │    headers: { 'x-user-id': userId }                     │
│       │  })                                                     │
│       │                                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │  HTTP Request with x-user-id header
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                               │
│                                                                 │
│  middleware.ts                                                  │
│       │  auth_session present? ──► proceed                      │
│       │  new_user role? ──► redirect to /pending-approval       │
│       │                                                         │
│  /api/admin/current-user                                        │
│       │  users.get(req.headers['x-user-id'])  ◄── Admin SDK     │
│       │  map labels → role                                      │
│       └──► { user: { id, email, role, labels } }                │
│                                                                 │
│  Any other protected route                                      │
│       │  getAuthenticatedUser(req)                              │
│       │    ├─ x-user-id header ──► users.get() ──► ✅           │
│       │    └─ a_session cookie ──► account.get() ──► ✅         │
│       └──► proceed or 401                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

| File | Role |
|---|---|
| `src/services/auth.ts` | Client-side: login, logout, magic link, session storage |
| `src/lib/auth-utils.ts` | Server-side: `getAuthenticatedUser()` — verifies x-user-id or session cookie |
| `src/hooks/useCurrentUser.tsx` | React hook: reads userId from localStorage, fetches role from API |
| `src/middleware.ts` | Edge middleware: cookie gate + role redirect |
| `src/lib/route-protection.ts` | Declares which routes need `admin` label |
| `src/app/api/admin/current-user/route.ts` | API: userId → full user with labels/role |
