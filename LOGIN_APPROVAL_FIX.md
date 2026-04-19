# Login & Magic Link Approval System - Fixes Applied

## Overview
Fixed two critical issues with the user approval system:
1. **Missing role validation on login** - Login page now checks if user has been approved before sending magic link
2. **Magic link token verification issues** - Improved error handling and debugging

## Changes Made

### 1. New API Endpoint: `/api/auth/check-user-role`
**File:** `src/app/api/auth/check-user-role/route.ts`

This endpoint checks if a user exists and has an approved role (mvp or admin).

**Request:** POST `/api/auth/check-user-role`
```json
{
  "email": "user@gmail.com"
}
```

**Response:**
- User doesn't exist: `{ exists: false, hasApprovedRole: false }`
- User exists but awaiting approval: `{ exists: true, hasApprovedRole: false, isNewUser: true, role: "new_user" }`
- User approved: `{ exists: true, hasApprovedRole: true, role: "mvp" | "admin", userId: "..." }`

### 2. Updated Login Page: `src/app/login/page.tsx`

**Changes:**
- Added `isCheckingRole` state to track role validation step
- Modified `handleSubmit` to:
  1. Validate email format
  2. Call `/api/auth/check-user-role` endpoint
  3. Check if user exists and has approved role
  4. Show appropriate error messages based on status:
     - **User doesn't exist:** "Account not found. Please contact your administrator to create an account."
     - **User awaiting approval:** "Your account is awaiting admin approval. An administrator will grant you access soon. Please check back later or contact your admin."
     - **User approved:** Send magic link (previous behavior)
- Updated button text to show "Checking account..." during role validation

**User Flow:**
```
1. User enters email
2. System checks if user exists → No → Show "contact admin" message
3. If exists, check if has approved role → No → Show "awaiting approval" message
4. If approved → Send magic link
```

### 3. Improved Magic Link Handling: `src/services/auth.ts`

**Changes:**
- Added detailed console logging for debugging
- Improved error handling with informative log messages
- `sendMagicLink()`: Logs token creation
- `verifyMagicLink()`: Logs verification steps and session creation

**Logs help debug issues like:**
- Token creation failures
- Session conflicts
- Verification errors

### 4. Enhanced Auth Callback: `src/app/auth/callback/page.tsx`

**Changes:**
- Added detailed console logging at each step
- Improved error messages with helpful hints
- Better error display showing why magic link verification failed
- Added hint about link expiration

**Logs track:**
- URL parameters received
- Magic link verification progress
- User initialization (check-or-init)
- Any failures in the process

## Flow Diagram

### Approval Process
```
New User Signs Up (via signup page or invited by admin)
    ↓
Admin approves user in /admin/admins → Sets role to "mvp" or "admin"
    ↓
User goes to login page
    ↓
User enters email
    ↓
System checks role via /api/auth/check-user-role
    ├─→ Not found? → Show "contact admin"
    ├─→ Has role? No → Show "awaiting approval"
    └─→ Has role? Yes → Send magic link
    ↓
User clicks magic link in email
    ↓
Callback verifies token via updateMagicURLSession
    ├─→ Token invalid/expired? → Show "try again" error
    └─→ Token valid? → Create session
    ↓
Callback calls /api/admin/users/{userId}/check-or-init
    └─→ If no role, assign 'new_user'
    ↓
User redirected to /admin/dashboard
    ↓
AdminLayout checks role
    ├─→ Is 'new_user'? → Show PendingApprovalScreen
    └─→ Has approved role? → Show dashboard
```

## Debugging Tips

### Check Console Logs
The browser console now shows detailed logs:
```
[sendMagicLink] Creating magic URL token for: user@gmail.com redirectUrl: http://localhost:3000/auth/callback
[sendMagicLink] Magic link token created successfully
[AuthCallback] URL params - userId: <id> secret: present
[AuthCallback] Starting magic link verification...
[AuthCallback] Magic link verified successfully
```

### Common Issues & Solutions

#### 1. "Invalid token" Error on Magic Link Click
**Possible causes:**
- Token expired (magic links have limited validity)
- URL parameters corrupted
- Session conflicts

**Solution:**
- Go back to login and request a new magic link
- Check network tab to see exact URL being accessed
- Clear browser storage (cookies/localStorage)

#### 2. "Account not found" on Login
**Cause:** User hasn't been created in the system

**Solution:**
- Administrator needs to create user account
- Can be done in /admin/admins (invite users directly with a role)

#### 3. "Account awaiting approval" on Login
**Cause:** User exists but doesn't have an approved role yet

**Solution:**
- Administrator approves user in /admin/admins → Pending tab
- Click "✓ Approve" to grant MVP role
- User can then login

## Testing Checklist

### Test 1: Unapproved User Cannot Login
- [ ] Have admin create a new user without assigning a role
- [ ] Try to login with that user email
- [ ] Should see "awaiting approval" message
- [ ] Button should show "Checking account..." during validation

### Test 2: Approved User Can Login
- [ ] Have admin approve the user (set to mvp role)
- [ ] Try to login again with same email
- [ ] Should see "Check your email" screen
- [ ] Click magic link in email
- [ ] Should see success and redirect to dashboard
- [ ] Check browser console for debug logs

### Test 3: Magic Link Expiration
- [ ] Request magic link
- [ ] Wait for token to expire (typically 15 minutes)
- [ ] Click link
- [ ] Should see "Failed to verify login link. It may have expired."

### Test 4: Correct Role Enforcement
- [ ] Login with new_user → Should see PendingApprovalScreen
- [ ] Login with mvp → Should access dashboard and see routes
- [ ] Login with admin → Should access all admin features

## Related Files Not Modified
These files handle role enforcement after login:
- `src/app/admin/layout.tsx` - Blocks new_user accounts
- `src/components/admin/sidebar.tsx` - Hides admin-only routes
- `src/lib/route-protection.ts` - Defines protected routes

## Environment Variables Needed
Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
APPWRITE_PROJECT_ID_API_SECRET=<your-api-secret>
```

The API secret is needed for the check-user-role endpoint to query users.
