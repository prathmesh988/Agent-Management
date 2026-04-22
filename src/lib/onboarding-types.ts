// ──────────────────────────────────────────────────────
//  Onboarding Types
// ──────────────────────────────────────────────────────

export type TokenStatus = 'active' | 'used' | 'expired' | 'disabled';
export type SubmissionStatus = 'draft' | 'pending_verification' | 'approved' | 'rejected';

export interface OnboardingToken {
  $id?: string;
  token: string;               // UUID
  label?: string;              // HR note e.g. "Backend Dev Batch April"
  expiresAt: string;           // ISO date string
  status: TokenStatus;
  maxUses: number;             // 0 = unlimited
  usedCount: number;
  createdBy?: string;          // HR user name/email
  createdAt?: string;
}

export interface OnboardingSubmission {
  $id?: string;
  tokenId: string;

  // ── Personal ──────────────────────────────────────────
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;         // YYYY-MM-DD
  gender: string;

  // ── Address ───────────────────────────────────────────
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // ── Bank ──────────────────────────────────────────────
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;

  // ── Documents (Appwrite file IDs) ─────────────────────
  aadharFileId?: string;
  panFileId?: string;
  resumeFileId?: string;
  photoFileId?: string;
  additionalFileIds?: string;   // comma-separated

  // ── Meta ──────────────────────────────────────────────
  status: SubmissionStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  employeeId?: string;         // set after HR approval
}

// shape returned from API / used in UI
export interface SubmissionWithToken extends OnboardingSubmission {
  token?: OnboardingToken;
}
