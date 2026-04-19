# Magic Link Invalid Token - Debugging Guide

## What You'll See
When clicking a magic link, if you get an "invalid token" error, follow these steps to debug.

## Step 1: Check Browser Console
1. Open the magic link email from your inbox
2. Click the login link
3. **Press F12** to open the browser console
4. Check for these log messages:

```
[AuthCallback] Raw URL params - userId: ... secret: present
[verifyMagicLink] Verifying magic link for userId: ...
[verifyMagicLink] Calling updateMagicURLSession...
```

### What Each Log Means:
- **"Raw URL params"** → Magic link URL was properly parsed
- **"Verifying magic link"** → Attempting to create session
- **"Calling updateMagicURLSession"** → Sending request to Appwrite

## Step 2: Common Issues & Solutions

### Issue 1: "Invalid or missing authentication link parameters"
**What it means:** The URL in the email is malformed

**Solution:**
- Check that the email link is complete (not broken into two lines)
- The link should look like: `https://yoursite.com/auth/callback?userId=xxx&secret=yyy`
- Don't manually edit or copy-paste the URL

### Issue 2: "Failed to verify login link. It may have expired."
**What it means:** The token is invalid or has expired

**Possible causes:**
1. **Token expired** - Magic links typically expire in 15 minutes
   - Solution: Request a new magic link from the login page
   
2. **URL encoding issues** - Special characters might be encoded incorrectly
   - Solution: Clear browser cache and try again
   
3. **Session conflict** - There's already an active session
   - Solution: Open an incognito/private window and click the link
   
4. **Clock skew** - Server/client time mismatch
   - Solution: Check your system time is correct

### Issue 3: Still showing error after trying above
**Solution:**
1. Check the browser console error details (F12)
2. Look for any error messages like:
   - "Invalid credentials"
   - "Invalid session"
   - "Unauthorized"
   
3. **Note the exact error message** and check below:

## Step 3: Check Appwrite Console
1. Go to your Appwrite Console
2. Check users list → Find your user
3. Verify the user has labels/role assigned
4. Check if account is enabled (not blocked/disabled)

## Step 4: Advanced Debugging

### Check What's Happening in the Auth Flow:

**In browser console (F12), look for these logs in order:**

```
1. [sendMagicLink] Creating magic URL token for: user@gmail.com
2. [sendMagicLink] Magic link token created successfully
   → Email is sent at this point
   
3. User clicks link...
   
4. [AuthCallback] Raw URL params - userId: ... secret: present
5. [AuthCallback] Starting magic link verification...
6. [verifyMagicLink] Verifying magic link for userId: ...
7. [verifyMagicLink] Deleted existing session OR No existing session
8. [verifyMagicLink] Calling updateMagicURLSession...
9. [verifyMagicLink] Magic link verified successfully
   → This is success! Should redirect to dashboard
   
10. [AuthCallback] Verified user: userId
11. [AuthCallback] check-or-init response: { ... }
```

### If It Fails at Step 8-9:
The magic link token verification is failing. This could be:
- Token expired (too much time passed)
- Wrong userId or secret (URL corrupted)
- Appwrite API issue

### If It Gets Past Step 9 But Fails at Step 10:
The user role initialization is failing. This is less critical.

## Step 5: How to Test Manually

1. **Open Incognito/Private Window** (forces fresh session)
2. Go to login page
3. Enter email and click "Send Login Link"
4. Check console: `[sendMagicLink] Magic link token created successfully`
5. **Immediately** check your email (within 5 minutes)
6. Click the link
7. Monitor console logs

## Step 6: If Still Failing - Provide These Details

Open an incognito window and:
1. Go to login page
2. Enter email and send magic link
3. Click the magic link in email **within 2 minutes**
4. When you see the error, open console (F12) and copy:
   - The full error message
   - All logs starting with `[AuthCallback]` or `[verifyMagicLink]`
   - The URL shown in the address bar

Share these details for further diagnosis.

## Common Error Messages Explained

| Error | Cause | Solution |
|-------|-------|----------|
| `User (role: null) cannot access this route` | No role assigned | Admin must approve user |
| `JWT cannot be used before` | Clock skew | Check system time |
| `JWT has expired` | Token too old | Request new magic link |
| `Invalid credentials` | Token invalid | Request new magic link |
| `Unauthorized` | Session issue | Try incognito window |

## Environment Variables to Check

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<your-id>
APPWRITE_PROJECT_ID_API_SECRET=<your-api-secret>
```

If these are wrong, the magic link will always fail.

## Pro Tips

- **Always use incognito/private window** for testing login flows
- **Don't copy-paste URLs manually** - click the link from email
- **Wait for email to arrive** - sometimes takes a few seconds
- **Check spam folder** - magic links might be marked as spam
- **Check user approval status** - user must have a role (mvp or admin) to login

## Still Need Help?

1. Check browser console (F12) for detailed logs
2. Note the exact error message
3. Share:
   - Your domain name
   - The error message from console
   - The full console logs (F12 → Console tab)
4. Check if your Appwrite is properly configured
