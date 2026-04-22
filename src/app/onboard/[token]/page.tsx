'use client';
import '../onboard.css';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ── Types ────────────────────────────────────────────────────────────────────
interface TokenInfo {
  valid: boolean;
  reason?: string;
  tokenId?: string;
  label?: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
}

interface FileUploadState {
  file: File | null;
  preview: string | null;
  error: string | null;
}

type Step = 'personal' | 'address' | 'bank' | 'documents' | 'review';
const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'address', label: 'Address', icon: '🏠' },
  { id: 'bank', label: 'Bank', icon: '🏦' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'review', label: 'Review', icon: '✅' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function FileDropZone({
  label, accept, id, state, onChange, hint,
}: {
  label: string; accept: string; id: string;
  state: FileUploadState; onChange: (f: File | null) => void; hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return onChange(null);
    if (file.size > 10 * 1024 * 1024) return onChange(null); // handled by parent
    onChange(file);
  };

  return (
    <div className="ob-file-zone-wrap">
      <label className="ob-label" htmlFor={id}>{label}</label>
      <div
        id={id}
        className={`ob-file-zone ${dragging ? 'ob-file-zone--drag' : ''} ${state.file ? 'ob-file-zone--filled' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {state.file ? (
          <div className="ob-file-info">
            <span className="ob-file-icon">
              {state.file.type.startsWith('image/') ? '🖼️' : '📄'}
            </span>
            <div>
              <p className="ob-file-name">{state.file.name}</p>
              <p className="ob-file-size">{(state.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              className="ob-file-remove"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              aria-label="Remove file"
            >✕</button>
          </div>
        ) : (
          <div className="ob-file-placeholder">
            <span className="ob-file-upload-icon">☁️</span>
            <p className="ob-file-drop-text">Drop file or <span>browse</span></p>
            {hint && <p className="ob-file-hint">{hint}</p>}
          </div>
        )}
      </div>
      {state.error && <p className="ob-field-error">{state.error}</p>}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function OnboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Form state ──────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    fullName: '', email: '', phone: '', dateOfBirth: '', gender: '',
  });
  const [address, setAddress] = useState({
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
  });
  const [bank, setBank] = useState({
    bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '',
  });
  const [files, setFiles] = useState<Record<string, FileUploadState>>({
    aadharFile: { file: null, preview: null, error: null },
    panFile: { file: null, preview: null, error: null },
    resumeFile: { file: null, preview: null, error: null },
    photoFile: { file: null, preview: null, error: null },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validate token on mount ─────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`/api/onboarding/validate?token=${token}`)
      .then((r) => r.json())
      .then((data) => setTokenInfo(data))
      .catch(() => setTokenInfo({ valid: false, reason: 'server_error' }))
      .finally(() => setLoadingToken(false));
  }, [token]);

  const setFile = useCallback((key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: { file, preview: null, error: null } }));
  }, []);

  // ── Validation ─────────────────────────────────────────────────
  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (currentStep === 'personal') {
      if (!personal.fullName.trim()) errs.fullName = 'Full name is required';
      if (!personal.email.match(/^[^@]+@[^@]+\.[^@]+$/)) errs.email = 'Valid email required';
      if (!personal.phone.match(/^[6-9]\d{9}$/)) errs.phone = 'Valid 10-digit Indian phone number required';
      if (!personal.gender) errs.gender = 'Please select a gender';
    }
    if (currentStep === 'address') {
      if (!address.addressLine1.trim()) errs.addressLine1 = 'Address line 1 is required';
      if (!address.city.trim()) errs.city = 'City is required';
      if (!address.state.trim()) errs.state = 'State is required';
      if (!address.pincode.match(/^\d{6}$/)) errs.pincode = 'Valid 6-digit pincode required';
    }
    if (currentStep === 'bank') {
      if (!bank.bankName.trim()) errs.bankName = 'Bank name is required';
      if (!bank.accountNumber.trim()) errs.accountNumber = 'Account number is required';
      if (!bank.ifscCode.match(/^[A-Z]{4}0[A-Z0-9]{6}$/)) errs.ifscCode = 'Valid IFSC code required (e.g. SBIN0012345)';
      if (!bank.accountHolderName.trim()) errs.accountHolderName = 'Account holder name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  };

  const prevStep = () => {
    const idx = STEPS.findIndex((s) => s.id === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const fd = new FormData();
      fd.append('token', token);

      // Personal
      Object.entries(personal).forEach(([k, v]) => fd.append(k, v));
      // Address
      Object.entries(address).forEach(([k, v]) => fd.append(k, v));
      // Bank
      Object.entries(bank).forEach(([k, v]) => fd.append(k, v));
      // Files
      Object.entries(files).forEach(([k, v]) => {
        if (v.file) fd.append(k, v.file);
      });

      const res = await fetch('/api/onboarding/submit', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepIdx = STEPS.findIndex((s) => s.id === currentStep);

  // ── Render: loading ─────────────────────────────────────────────
  if (loadingToken) {
    return (
      <div className="ob-page ob-centered">
        <div className="ob-spinner" />
        <p className="ob-loading-text">Validating your invite link…</p>
      </div>
    );
  }

  // ── Render: invalid/expired token ───────────────────────────────
  if (!tokenInfo?.valid) {
    const messages: Record<string, { title: string; body: string; icon: string }> = {
      expired: { icon: '⏰', title: 'Link Expired', body: 'This invite link has expired. Please contact HR to get a new one.' },
      not_found: { icon: '🔍', title: 'Link Not Found', body: 'This invite link is invalid or does not exist.' },
      limit_reached: { icon: '🚫', title: 'Link Full', body: 'This invite link has reached its maximum number of uses. Please contact HR.' },
      disabled: { icon: '❌', title: 'Link Disabled', body: 'This invite link has been disabled by HR. Please request a new one.' },
      server_error: { icon: '⚠️', title: 'Something Went Wrong', body: 'We could not validate your link. Please try again or contact HR.' },
    };
    const msg = messages[tokenInfo?.reason || 'not_found'] || messages.not_found;
    return (
      <div className="ob-page ob-centered">
        <div className="ob-error-card">
          <span className="ob-error-icon">{msg.icon}</span>
          <h1 className="ob-error-title">{msg.title}</h1>
          <p className="ob-error-body">{msg.body}</p>
        </div>
      </div>
    );
  }

  // ── Render: success ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="ob-page ob-centered">
        <div className="ob-success-card">
          <div className="ob-success-anim">🎉</div>
          <h1 className="ob-success-title">Application Submitted!</h1>
          <p className="ob-success-body">
            Thank you, <strong>{personal.fullName}</strong>! Your information has been received.<br />
            HR will review your documents and get in touch at <strong>{personal.email}</strong>.
          </p>
          <div className="ob-success-note">
            You can re-open this link to edit your details until HR begins verification.
          </div>
        </div>
      </div>
    );
  }

  // ── Render: form ────────────────────────────────────────────────
  return (
    <div className="ob-page">
      {/* Header */}
      <header className="ob-header">
        <div className="ob-header-inner">
          <div className="ob-logo">
            <span className="ob-logo-icon">🏢</span>
            <span className="ob-logo-text">HR<strong>MS</strong></span>
          </div>
          <div className="ob-header-meta">
            <span className="ob-token-label">{tokenInfo.label}</span>
            <span className="ob-token-expiry">
              Expires {formatDate(tokenInfo.expiresAt)}
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="ob-progress-bar-wrap">
        <div className="ob-steps">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`ob-step ${idx < currentStepIdx ? 'ob-step--done' : ''} ${step.id === currentStep ? 'ob-step--active' : ''}`}
            >
              <div className="ob-step-bubble">
                {idx < currentStepIdx ? '✓' : step.icon}
              </div>
              <span className="ob-step-label">{step.label}</span>
            </div>
          ))}
          <div
            className="ob-progress-line"
            style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="ob-form-wrap">
        <div className="ob-form-card">

          {/* ── Step: Personal ────────────────────────────────── */}
          {currentStep === 'personal' && (
            <div className="ob-step-content" key="personal">
              <h2 className="ob-step-title">👤 Personal Details</h2>
              <p className="ob-step-subtitle">Tell us a little about yourself</p>
              <div className="ob-grid-2">
                <div className="ob-field">
                  <label className="ob-label" htmlFor="fullName">Full Name *</label>
                  <input id="fullName" className="ob-input" placeholder="Rahul Sharma" value={personal.fullName}
                    onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} />
                  {errors.fullName && <p className="ob-field-error">{errors.fullName}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="email">Email Address *</label>
                  <input id="email" type="email" className="ob-input" placeholder="rahul@example.com" value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })} />
                  {errors.email && <p className="ob-field-error">{errors.email}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="phone">Phone Number *</label>
                  <input id="phone" type="tel" className="ob-input" placeholder="9876543210" maxLength={10} value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value.replace(/\D/g, '') })} />
                  {errors.phone && <p className="ob-field-error">{errors.phone}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="dateOfBirth">Date of Birth</label>
                  <input id="dateOfBirth" type="date" className="ob-input" value={personal.dateOfBirth}
                    onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })} />
                </div>
                <div className="ob-field ob-field--full">
                  <label className="ob-label">Gender *</label>
                  <div className="ob-radio-group">
                    {['Male', 'Female', 'Other', 'Prefer not to say'].map((g) => (
                      <label key={g} className={`ob-radio-pill ${personal.gender === g ? 'ob-radio-pill--active' : ''}`}>
                        <input type="radio" name="gender" value={g} checked={personal.gender === g}
                          onChange={() => setPersonal({ ...personal, gender: g })} style={{ display: 'none' }} />
                        {g}
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="ob-field-error">{errors.gender}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Address ─────────────────────────────────── */}
          {currentStep === 'address' && (
            <div className="ob-step-content" key="address">
              <h2 className="ob-step-title">🏠 Address Details</h2>
              <p className="ob-step-subtitle">Your current residential address</p>
              <div className="ob-grid-2">
                <div className="ob-field ob-field--full">
                  <label className="ob-label" htmlFor="addressLine1">Address Line 1 *</label>
                  <input id="addressLine1" className="ob-input" placeholder="Flat 4B, Sunshine Apartments" value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} />
                  {errors.addressLine1 && <p className="ob-field-error">{errors.addressLine1}</p>}
                </div>
                <div className="ob-field ob-field--full">
                  <label className="ob-label" htmlFor="addressLine2">Address Line 2 <span className="ob-optional">(optional)</span></label>
                  <input id="addressLine2" className="ob-input" placeholder="MG Road, Koregaon Park" value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} />
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="city">City *</label>
                  <input id="city" className="ob-input" placeholder="Pune" value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  {errors.city && <p className="ob-field-error">{errors.city}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="stateField">State *</label>
                  <input id="stateField" className="ob-input" placeholder="Maharashtra" value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })} />
                  {errors.state && <p className="ob-field-error">{errors.state}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="pincode">Pincode *</label>
                  <input id="pincode" className="ob-input" placeholder="411001" maxLength={6} value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })} />
                  {errors.pincode && <p className="ob-field-error">{errors.pincode}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="country">Country</label>
                  <input id="country" className="ob-input" value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Bank ────────────────────────────────────── */}
          {currentStep === 'bank' && (
            <div className="ob-step-content" key="bank">
              <h2 className="ob-step-title">🏦 Bank Details</h2>
              <p className="ob-step-subtitle">For salary disbursement — kept strictly confidential</p>
              <div className="ob-bank-notice">
                🔒 Your bank details are encrypted and only accessible to authorized payroll staff.
              </div>
              <div className="ob-grid-2">
                <div className="ob-field">
                  <label className="ob-label" htmlFor="bankName">Bank Name *</label>
                  <input id="bankName" className="ob-input" placeholder="State Bank of India" value={bank.bankName}
                    onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
                  {errors.bankName && <p className="ob-field-error">{errors.bankName}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="accountHolderName">Account Holder Name *</label>
                  <input id="accountHolderName" className="ob-input" placeholder="RAHUL SHARMA" value={bank.accountHolderName}
                    onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })} />
                  {errors.accountHolderName && <p className="ob-field-error">{errors.accountHolderName}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="accountNumber">Account Number *</label>
                  <input id="accountNumber" className="ob-input" placeholder="1234567890" value={bank.accountNumber}
                    onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
                  {errors.accountNumber && <p className="ob-field-error">{errors.accountNumber}</p>}
                </div>
                <div className="ob-field">
                  <label className="ob-label" htmlFor="ifscCode">IFSC Code *</label>
                  <input id="ifscCode" className="ob-input" placeholder="SBIN0012345" value={bank.ifscCode}
                    onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })} />
                  {errors.ifscCode && <p className="ob-field-error">{errors.ifscCode}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step: Documents ───────────────────────────────── */}
          {currentStep === 'documents' && (
            <div className="ob-step-content" key="documents">
              <h2 className="ob-step-title">📄 Upload Documents</h2>
              <p className="ob-step-subtitle">PDF, JPG, or PNG — max 10 MB each</p>
              <div className="ob-docs-grid">
                <FileDropZone id="aadharFileZone" label="Aadhar Card *" accept=".pdf,.jpg,.jpeg,.png"
                  state={files.aadharFile} onChange={(f) => setFile('aadharFile', f)}
                  hint="Front & back (combine into one PDF if needed)" />
                <FileDropZone id="panFileZone" label="PAN Card *" accept=".pdf,.jpg,.jpeg,.png"
                  state={files.panFile} onChange={(f) => setFile('panFile', f)}
                  hint="Clear photo or scanned copy" />
                <FileDropZone id="resumeFileZone" label="Resume / CV" accept=".pdf"
                  state={files.resumeFile} onChange={(f) => setFile('resumeFile', f)}
                  hint="PDF format preferred" />
                <FileDropZone id="photoFileZone" label="Passport Photo" accept=".jpg,.jpeg,.png"
                  state={files.photoFile} onChange={(f) => setFile('photoFile', f)}
                  hint="Recent passport-size photograph" />
              </div>
            </div>
          )}

          {/* ── Step: Review ──────────────────────────────────── */}
          {currentStep === 'review' && (
            <div className="ob-step-content" key="review">
              <h2 className="ob-step-title">✅ Review & Submit</h2>
              <p className="ob-step-subtitle">Please verify all details before submitting</p>

              <div className="ob-review-sections">
                <div className="ob-review-section">
                  <h3 className="ob-review-section-title">👤 Personal</h3>
                  <div className="ob-review-grid">
                    <ReviewRow label="Full Name" value={personal.fullName} />
                    <ReviewRow label="Email" value={personal.email} />
                    <ReviewRow label="Phone" value={personal.phone} />
                    <ReviewRow label="Date of Birth" value={personal.dateOfBirth} />
                    <ReviewRow label="Gender" value={personal.gender} />
                  </div>
                </div>

                <div className="ob-review-section">
                  <h3 className="ob-review-section-title">🏠 Address</h3>
                  <div className="ob-review-grid">
                    <ReviewRow label="Address" value={[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')} />
                    <ReviewRow label="City" value={address.city} />
                    <ReviewRow label="State" value={address.state} />
                    <ReviewRow label="Pincode" value={address.pincode} />
                    <ReviewRow label="Country" value={address.country} />
                  </div>
                </div>

                <div className="ob-review-section">
                  <h3 className="ob-review-section-title">🏦 Bank</h3>
                  <div className="ob-review-grid">
                    <ReviewRow label="Bank" value={bank.bankName} />
                    <ReviewRow label="Account Holder" value={bank.accountHolderName} />
                    <ReviewRow label="Account No." value={`••••${bank.accountNumber.slice(-4)}`} />
                    <ReviewRow label="IFSC" value={bank.ifscCode} />
                  </div>
                </div>

                <div className="ob-review-section">
                  <h3 className="ob-review-section-title">📄 Documents</h3>
                  <div className="ob-review-docs">
                    {Object.entries(files).map(([k, v]) => (
                      <div key={k} className={`ob-review-doc ${v.file ? 'ob-review-doc--ok' : 'ob-review-doc--missing'}`}>
                        <span>{v.file ? '✅' : '⬜'}</span>
                        <span>{k.replace('File', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                        {v.file && <span className="ob-review-doc-name">{v.file.name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="ob-submit-error">⚠️ {submitError}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="ob-nav">
            <button type="button" className="ob-btn-back" onClick={prevStep}
              disabled={currentStepIdx === 0}>
              ← Back
            </button>
            <div className="ob-step-counter">
              Step {currentStepIdx + 1} of {STEPS.length}
            </div>
            {currentStep !== 'review' ? (
              <button type="button" className="ob-btn-next" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button type="button" className="ob-btn-submit" onClick={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <><span className="ob-btn-spinner" /> Submitting…</>
                ) : '🚀 Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ob-review-row">
      <span className="ob-review-row-label">{label}</span>
      <span className="ob-review-row-value">{value || <em className="ob-na">Not provided</em>}</span>
    </div>
  );
}
