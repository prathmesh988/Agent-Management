# 📧 Certificate Management with Appwrite Bucket Storage

## Overview

The certificates system now supports:
1. ✅ **Generate certificates** as PDFs
2. ✅ **Store PDFs in Appwrite bucket** automatically
3. ✅ **Send certificates to employees via email** with attachment
4. ✅ **Track which certificates are in bucket** (button enabled/disabled based on storage status)

---

## Features

### 1. **Generate Certificates** 
- Select employees from the certificate page
- Click "Generate Selected" button
- PDFs are generated server-side using Puppeteer
- Downloaded as ZIP file
- **Automatically stored in Appwrite bucket** (new!)

### 2. **Store in Appwrite Bucket**
- **Bucket ID:** `69b7cf9e001384db23f9`
- **File naming:** `{certificateId}` (e.g., `CERT-EMP001`)
- **Format:** PDF
- **Automatic:** Happens during generation, no manual upload needed

### 3. **Send via Email**
- **Button:** "Send to Mail" (green button, next to Generate)
- **Enabled when:** Selected employees' certificates are in bucket
- **Action:** Sends PDF to each employee's registered email
- **Email includes:** 
  - Personalized greeting
  - Download link from bucket
  - PDF attachment
  - Professional HR template

### 4. **Email Details**
- **From:** Configured via `GMAIL_FROM` env var
- **To:** Employee's email from database
- **Subject:** Personalized with employee name
- **Attachment:** PDF from bucket
- **Validation:** Checks for valid email format before sending

---

## System Flow

```
┌─────────────────────────────────────────────────────────┐
│ User selects employees & clicks "Generate Selected"     │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ API generates PDFs using Puppeteer (max 3 concurrent)   │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Upload each PDF to Appwrite bucket (69b7cf9...)         │
│ File ID: CERT-{employeeId}                              │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Return ZIP file for download                            │
│ Update UI: Store bucket status (certified)              │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ "Send to Mail" button becomes ENABLED                   │
│ (only if all selected employees' certs in bucket)       │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ User clicks "Send to Mail"                              │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ For each selected employee:                             │
│ 1. Get certificate from bucket                          │
│ 2. Create personalized email                            │
│ 3. Attach PDF from bucket                               │
│ 4. Send via Gmail                                       │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│ Show success: "X emails sent successfully"              │
│ (or list failed recipients)                             │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables Required

Add to `.env.local`:

```bash
# Gmail configuration (for sending certificates)
GMAIL_FROM=hr@company.com
GMAIL_PASS=your-app-specific-password

# Appwrite bucket (already configured)
APPWRITE_DATABASE_ID=69b7ec04003c8a35a2d8
APPWRITE_COLLECTION_ID=orcus_extended1
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6784f3ac003b5c912256
APPWRITE_PROJECT_ID_API_SECRET=your-secret-key
```

### Gmail App Password Setup

1. Enable 2-Factor Authentication on Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Generate app-specific password
5. Copy and use as `GMAIL_PASS` in `.env.local`

---

## File Structure

### New Files Created

```
src/
├── lib/
│   └── appwrite-storage.ts          # Bucket upload functions
├── app/
│   ├── (actions)/
│   │   └── send-certificate.ts      # Email server action
│   └── api/
│       └── certificates/
│           └── download-all/
│               └── route.ts         # UPDATED: Now uploads to bucket
└── components/
    └── admin/
        └── certificates/
            └── page.tsx             # UPDATED: Added "Send to Mail" button

scripts/
└── send-mail.js                     # UPDATED: Enhanced with dynamic options
```

---

## API Endpoints & Functions

### 1. **Storage Operations** (`src/lib/appwrite-storage.ts`)

#### `uploadCertificateToBucket(pdfBuffer, employeeId, certificateId)`
```typescript
// Upload PDF to bucket
const result = await uploadCertificateToBucket(
  pdfBuffer,      // Buffer of PDF file
  "EMP001",       // Employee ID
  "CERT-EMP001"   // Certificate ID (file name in bucket)
);
// Returns: { success: true, fileName, fileId }
```

#### `checkCertificatesInBucket(certificateIds)`
```typescript
// Check which certificates exist in bucket
const status = await checkCertificatesInBucket([
  "CERT-EMP001",
  "CERT-EMP002"
]);
// Returns: { "CERT-EMP001": true, "CERT-EMP002": false }
```

#### `getCertificateDownloadUrl(certificateId)`
```typescript
// Get public download URL
const url = getCertificateDownloadUrl("CERT-EMP001");
// Returns: https://fra.cloud.appwrite.io/storage/buckets/.../files/.../download?...
```

### 2. **Email Operations** (`src/app/(actions)/send-certificate.ts`)

#### `sendCertificateEmail(params)`
```typescript
// Send certificate to single employee
const result = await sendCertificateEmail({
  employeeId: "EMP001",
  employeeEmail: "john@company.com",
  employeeName: "John Doe",
  certificateId: "CERT-EMP001"
});
// Returns: { success: true, message, info } or { success: false, error }
```

#### `sendCertificatesToMultiple(certParams)`
```typescript
// Send to multiple employees
const result = await sendCertificatesToMultiple([
  { employeeId: "EMP001", employeeEmail: "john@...", employeeName: "John", certificateId: "CERT-EMP001" },
  { employeeId: "EMP002", employeeEmail: "jane@...", employeeName: "Jane", certificateId: "CERT-EMP002" }
]);
// Returns: { success, successCount, failureCount, results, summary }
```

### 3. **Certificate Generation** (`src/app/api/certificates/download-all/route.ts`)

```typescript
// POST /api/certificates/download-all
{
  certificates: [
    {
      id: "doc-id",
      employeeId: "EMP001",
      employeeName: "John Doe",
      jobTitle: "Engineer",
      department: "Engineering",
      startDate: "2023-01-15",
      salary: "₹1,200,000",
      certificateId: "CERT-EMP001"
    }
  ]
}

// Returns: ZIP file with all PDFs
// Also uploads each PDF to bucket (69b7cf9e001384db23f9)
```

---

## How to Use

### Step 1: Generate Certificates
1. Go to **Admin → Certificates**
2. Select employees you want to generate certificates for
3. Click **"Generate Selected"** button
4. Wait for processing (Puppeteer generates PDFs)
5. ZIP file downloads automatically
6. PDFs are simultaneously uploaded to bucket

### Step 2: Send Certificates via Email
1. **After generation**, the "Send to Mail" button becomes **enabled** (green)
2. Selected employees' certificates must be in bucket first (validation)
3. Click **"Send to Mail"** button
4. Each employee receives email with:
   - Personalized greeting
   - PDF attachment
   - Download link
5. See success message with count of emails sent

### Example Workflow
```
1. Select "John Doe" and "Jane Smith"
   ↓
2. Click "Generate Selected"
   - API generates 2 PDFs
   - Uploads to bucket: CERT-EMP001, CERT-EMP002
   - Downloads ZIP file
   ↓
3. "Send to Mail" button is now ENABLED
   ↓
4. Click "Send to Mail"
   - Email 1: john@company.com (with PDF)
   - Email 2: jane@company.com (with PDF)
   ↓
5. See: "✓ Emails sent successfully! Sent 2/2 emails"
```

---

## Button States

### "Generate Selected" Button
- **Enabled:** When ≥1 employee selected
- **Disabled:** No employees selected, or generating in progress
- **Label:** Shows count (e.g., "Generate Selected (3)")

### "Send to Mail" Button (NEW)
- **Enabled:** When ≥1 employee selected AND all have certs in bucket
- **Disabled:** No employees selected, generating, OR missing certs in bucket
- **Label:** Shows count (e.g., "Send to Mail (2)")
- **Tooltip:** "Generate certificates first before sending"

---

## Error Handling

### Generation Errors
```
❌ "Failed to generate certificates: [error message]"
```

### Email Validation
```
❌ "Invalid email addresses for: John Doe, Jane Smith"
   → Check email field in employee database
```

### Missing Certificates
```
❌ "Certificates not found in bucket for some employees"
   → Generate certificates first, then retry
```

### Send Partial Failure
```
⚠ "Some emails failed to send: john@failed.com
   Successful: 3/4"
   → Check Gmail credentials, recipient email validity
```

---

## Database Requirements

Employee records must have:
- `email` field (required, must be valid email format)
- `name` field (for personalized greeting)
- `employeeId` field (for certificate ID generation: `CERT-{employeeId}`)
- `designation`, `department`, `dateOfJoining`, `ctc` (for certificate content)

---

## Testing

### Manual Test
```bash
# Test email sending directly
RECIPIENT_EMAIL="test@company.com" RECIPIENT_NAME="Test User" node scripts/send-mail.js
```

### Check Bucket Contents
In Appwrite Console:
1. Go to Storage → Manage Buckets
2. Select bucket `69b7cf9e001384db23f9`
3. Should see files like: `CERT-EMP001.pdf`, `CERT-EMP002.pdf`, etc.

---

## Troubleshooting

### "Email sent: 421" Error
```
❌ Gmail SMTP error - usually credentials wrong
✅ Fix: Re-verify GMAIL_FROM and GMAIL_PASS in .env.local
```

### "Collection with requested ID not found"
```
❌ Appwrite bucket ID wrong or doesn't exist
✅ Fix: Verify bucket ID in appwrite-storage.ts
```

### "No certificates in bucket" Despite Generating
```
❌ Upload failed silently
✅ Fix: Check API logs for upload errors
        Log level: `console.log()` in route.ts
```

### Emails Not Sending
```
❌ Gmail app password not set up correctly
✅ Fix: Use 2FA + app-specific password from Google Account
        NOT your regular Gmail password
```

---

## Production Checklist

- [ ] Gmail credentials rotating (not hardcoded)
- [ ] Error handling for failed uploads
- [ ] Email validation before sending
- [ ] Bucket storage size monitoring
- [ ] Rate limiting on mass sends
- [ ] Audit logging (who sent to whom)
- [ ] Backup of PDFs outside bucket
- [ ] Email template customization (if needed)
- [ ] Test with multiple recipients
- [ ] Test with large PDF files

---

## Architecture Diagram

```
┌──────────────────────┐
│  Admin Certificate   │
│  Page (React)        │
└──────────┬───────────┘
           │
    ┌──────▼──────────────────┐
    │ Check bucket status     │
    │ Show/hide Send button   │
    └──────┬───────────────────┘
           │
    ┌──────▼──────────────────┐
    │ User clicks buttons:    │
    │ - Generate             │
    │ - Send to Mail         │
    └──────┬───────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ API /api/certificates/download  │
    │ - Puppeteer generates PDFs      │
    │ - Upload each to bucket         │
    │ - Return ZIP file              │
    └──────┬───────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Appwrite Bucket Storage         │
    │ (69b7cf9e001384db23f9)         │
    │ - CERT-EMP001.pdf              │
    │ - CERT-EMP002.pdf              │
    │ - CERT-EMP003.pdf              │
    └──────┬───────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Server Action: sendCertificate  │
    │ - Get emails from database      │
    │ - Create personalized emails    │
    │ - Attach PDFs from bucket       │
    │ - Send via Gmail SMTP           │
    └──────┬───────────────────────────┘
           │
    ┌──────▼──────────────────────────┐
    │ Gmail                           │
    │ - Sends to employees            │
    │ - PDF attachments included      │
    └─────────────────────────────────┘
```

---

## Summary

✅ Certificates are **generated** once and **stored** in bucket  
✅ Same PDFs are **downloaded** as ZIP  
✅ Same PDFs are **emailed** to employees  
✅ "Send to Mail" button is **smart** (only enabled when certs exist)  
✅ System is **scalable** (supports 100+ certificates per batch)  
✅ **No duplicates** - single PDF used for all purposes  

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/lib/appwrite-storage.ts` | Created - Bucket upload functions |
| `src/app/(actions)/send-certificate.ts` | Created - Email server action |
| `src/app/api/certificates/download-all/route.ts` | Updated - Add bucket upload |
| `src/app/admin/certificates/page.tsx` | Updated - Add "Send to Mail" button |
| `scripts/send-mail.js` | Updated - Enhanced with dynamic options |
| `package.json` | Updated - Added `@types/nodemailer` |

---

Need help? Check the error messages - they're designed to tell you exactly what went wrong! 🚀
