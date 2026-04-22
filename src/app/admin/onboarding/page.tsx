'use client';
import './onboarding-dashboard.css';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/** Read userId from localStorage (same source as useCurrentUser hook). */
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = localStorage.getItem('user_session');
    if (!s) return '';
    const d = JSON.parse(s);
    return d.userId || '';
  } catch { return ''; }
}

/** Fetch with x-user-id header automatically attached. */
async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const userId = getUserId();
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(userId ? { 'x-user-id': userId } : {}),
    },
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface InviteToken {
  $id: string;
  token: string;
  label: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired' | 'disabled';
  maxUses: number;
  usedCount: number;
  createdBy: string;
  $createdAt: string;
}

interface Submission {
  $id: string;
  tokenId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  aadharFileId?: string;
  panFileId?: string;
  resumeFileId?: string;
  photoFileId?: string;
  status: 'draft' | 'pending_verification' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  employeeId?: string;
  $createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_ONBOARDING_BUCKET_ID || 'onboarding_documents';
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

function fileUrl(fileId?: string) {
  if (!fileId) return null;
  return `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
}

function statusBadge(status: Submission['status']) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_verification: { label: '⏳ Pending', cls: 'od-badge od-badge--pending' },
    approved: { label: '✅ Approved', cls: 'od-badge od-badge--approved' },
    rejected: { label: '❌ Rejected', cls: 'od-badge od-badge--rejected' },
    draft: { label: '📝 Draft', cls: 'od-badge od-badge--draft' },
  };
  return map[status] || { label: status, cls: 'od-badge' };
}

function tokenStatusBadge(status: InviteToken['status']) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: '🟢 Active', cls: 'od-badge od-badge--approved' },
    expired: { label: '🔴 Expired', cls: 'od-badge od-badge--rejected' },
    used: { label: '🔵 Used', cls: 'od-badge od-badge--pending' },
    disabled: { label: '⚫ Disabled', cls: 'od-badge od-badge--draft' },
  };
  return map[status] || { label: status, cls: 'od-badge' };
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (url: string) => void }) {
  const [label, setLabel] = useState('');
  const [days, setDays] = useState(7);
  const [maxUses, setMaxUses] = useState(0);
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/onboarding/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, expiryDays: days, maxUses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onCreated(data.inviteUrl);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <h3 className="od-modal-title">🔗 Create Invite Link</h3>
          <button className="od-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="od-modal-body">
          <div className="od-field">
            <label className="od-label">Label (for your reference)</label>
            <input className="od-input" placeholder="e.g. Backend Dev – April Batch" value={label}
              onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="od-grid-2">
            <div className="od-field">
              <label className="od-label">Expires in (days)</label>
              <input className="od-input" type="number" min={1} max={30} value={days}
                onChange={(e) => setDays(Number(e.target.value))} />
              <span className="od-hint">Max 30 days</span>
            </div>
            <div className="od-field">
              <label className="od-label">Max uses <span className="od-optional">(0 = unlimited)</span></label>
              <input className="od-input" type="number" min={0} value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <div className="od-modal-footer">
          <button className="od-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="od-btn-primary" onClick={create} disabled={loading}>
            {loading ? 'Creating…' : 'Generate Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submission Detail Modal ───────────────────────────────────────────────────
function SubmissionModal({ sub, onClose, onRefresh }: { sub: Submission; onClose: () => void; onRefresh: () => void }) {
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);

  const review = async (action: 'approve' | 'reject') => {
    setActing(true);
    try {
      const res = await authFetch(`/api/onboarding/submissions/${sub.$id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(action === 'approve' ? '✅ Candidate approved and employee record created!' : '❌ Submission rejected');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActing(false);
    }
  };

  const docs = [
    { label: 'Aadhar', id: sub.aadharFileId },
    { label: 'PAN', id: sub.panFileId },
    { label: 'Resume', id: sub.resumeFileId },
    { label: 'Photo', id: sub.photoFileId },
  ].filter((d) => d.id);

  const badge = statusBadge(sub.status);

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal od-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <div>
            <h3 className="od-modal-title">{sub.fullName}</h3>
            <span className={badge.cls}>{badge.label}</span>
          </div>
          <button className="od-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="od-modal-body od-detail-grid">
          <div>
            <p className="od-detail-section-title">Contact</p>
            <div className="od-detail-rows">
              <div className="od-detail-row"><span>Email</span><span>{sub.email}</span></div>
              <div className="od-detail-row"><span>Phone</span><span>{sub.phone}</span></div>
              <div className="od-detail-row"><span>DOB</span><span>{sub.dateOfBirth || '—'}</span></div>
              <div className="od-detail-row"><span>Gender</span><span>{sub.gender || '—'}</span></div>
            </div>

            <p className="od-detail-section-title" style={{ marginTop: '1rem' }}>Address</p>
            <div className="od-detail-rows">
              <div className="od-detail-row"><span>Line 1</span><span>{sub.addressLine1 || '—'}</span></div>
              <div className="od-detail-row"><span>City</span><span>{sub.city || '—'}</span></div>
              <div className="od-detail-row"><span>State</span><span>{sub.state || '—'}</span></div>
            </div>
          </div>

          <div>
            <p className="od-detail-section-title">Bank</p>
            <div className="od-detail-rows">
              <div className="od-detail-row"><span>Bank</span><span>{sub.bankName || '—'}</span></div>
              <div className="od-detail-row"><span>Account</span><span>{sub.accountNumber ? `••••${sub.accountNumber.slice(-4)}` : '—'}</span></div>
              <div className="od-detail-row"><span>IFSC</span><span>{sub.ifscCode || '—'}</span></div>
            </div>

            <p className="od-detail-section-title" style={{ marginTop: '1rem' }}>Documents</p>
            <div className="od-doc-links">
              {docs.length === 0 && <p className="od-no-docs">No documents uploaded</p>}
              {docs.map((doc) => (
                <a key={doc.id} href={fileUrl(doc.id) || '#'} target="_blank" rel="noreferrer"
                  className="od-doc-link">
                  📄 View {doc.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {sub.status === 'pending_verification' && (
          <div className="od-modal-review">
            <div className="od-field">
              <label className="od-label">Review Notes <span className="od-optional">(optional)</span></label>
              <textarea className="od-input od-textarea" rows={3} placeholder="Any notes for HR records…"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        {sub.status === 'approved' && sub.employeeId && (
          <div className="od-modal-review">
            <div className="od-approved-note">
              ✅ Employee record created with ID: <strong>{sub.employeeId}</strong><br />
              Reviewed by {sub.reviewedBy}
            </div>
          </div>
        )}

        <div className="od-modal-footer">
          <button className="od-btn-secondary" onClick={onClose}>Close</button>
          {sub.status === 'pending_verification' && (
            <>
              <button className="od-btn-danger" onClick={() => review('reject')} disabled={acting}>
                {acting ? 'Processing…' : '❌ Reject'}
              </button>
              <button className="od-btn-success" onClick={() => review('approve')} disabled={acting}>
                {acting ? 'Processing…' : '✅ Approve & Create Employee'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingDashboard() {
  const [tab, setTab] = useState<'submissions' | 'links'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await authFetch(`/api/onboarding/submissions?${params}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/onboarding/invite');
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch {
      toast.error('Failed to load invite links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'submissions') fetchSubmissions();
    else fetchTokens();
  }, [tab, fetchSubmissions, fetchTokens]);

  const handleInviteCreated = (url: string) => {
    setShowInviteModal(false);
    setInviteUrl(url);
    fetchTokens();
    setTab('links');
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="od-page">
      {/* Page header */}
      <div className="od-page-header">
        <div>
          <h1 className="od-page-title">🎯 Candidate Onboarding</h1>
          <p className="od-page-subtitle">Manage invite links and review candidate submissions</p>
        </div>
        <button className="od-btn-primary" onClick={() => setShowInviteModal(true)}>
          + Invite Candidate
        </button>
      </div>

      {/* Copied link banner */}
      {inviteUrl && (
        <div className="od-link-banner">
          <div className="od-link-banner-inner">
            <span className="od-link-banner-icon">🔗</span>
            <input className="od-link-input" readOnly value={inviteUrl} />
            <button className="od-btn-primary od-btn-sm" onClick={() => copyLink(inviteUrl)}>Copy</button>
            <button className="od-link-banner-dismiss" onClick={() => setInviteUrl('')}>✕</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="od-stats">
        {[
          { label: 'Pending Review', value: submissions.filter((s) => s.status === 'pending_verification').length, color: '#f59e0b' },
          { label: 'Approved', value: submissions.filter((s) => s.status === 'approved').length, color: '#10b981' },
          { label: 'Rejected', value: submissions.filter((s) => s.status === 'rejected').length, color: '#ef4444' },
          { label: 'Active Links', value: tokens.filter((t) => t.status === 'active').length, color: '#3b82f6' },
        ].map((stat) => (
          <div key={stat.label} className="od-stat-card">
            <p className="od-stat-value" style={{ color: stat.color }}>{stat.value}</p>
            <p className="od-stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="od-tabs">
        <button className={`od-tab ${tab === 'submissions' ? 'od-tab--active' : ''}`}
          onClick={() => setTab('submissions')}>
          📋 Submissions
        </button>
        <button className={`od-tab ${tab === 'links' ? 'od-tab--active' : ''}`}
          onClick={() => setTab('links')}>
          🔗 Invite Links
        </button>
      </div>

      {/* Submissions tab */}
      {tab === 'submissions' && (
        <div className="od-table-card">
          <div className="od-table-toolbar">
            <div className="od-filter-group">
              {(['', 'pending_verification', 'approved', 'rejected'] as const).map((s) => (
                <button key={s} className={`od-filter-btn ${statusFilter === s ? 'od-filter-btn--active' : ''}`}
                  onClick={() => setStatusFilter(s)}>
                  {s === '' ? 'All' : s === 'pending_verification' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button className="od-btn-icon" onClick={fetchSubmissions} title="Refresh">↻</button>
          </div>

          {loading ? (
            <div className="od-loading">Loading submissions…</div>
          ) : submissions.length === 0 ? (
            <div className="od-empty">
              <p>📭 No submissions yet</p>
              <span>Share an invite link to get candidates started</span>
            </div>
          ) : (
            <div className="od-table-wrap">
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Contact</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const badge = statusBadge(sub.status);
                    return (
                      <tr key={sub.$id} className="od-table-row">
                        <td>
                          <div className="od-candidate-cell">
                            <div className="od-avatar">{sub.fullName?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div>
                              <p className="od-candidate-name">{sub.fullName}</p>
                              {sub.employeeId && <p className="od-candidate-empid">{sub.employeeId}</p>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="od-contact-email">{sub.email}</p>
                          <p className="od-contact-phone">{sub.phone}</p>
                        </td>
                        <td className="od-date-cell">{formatDate(sub.submittedAt || sub.$createdAt)}</td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                        <td>
                          <button className="od-btn-view" onClick={() => setSelectedSub(sub)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Links tab */}
      {tab === 'links' && (
        <div className="od-table-card">
          <div className="od-table-toolbar">
            <span className="od-toolbar-title">All Invite Links</span>
            <button className="od-btn-icon" onClick={fetchTokens} title="Refresh">↻</button>
          </div>

          {loading ? (
            <div className="od-loading">Loading links…</div>
          ) : tokens.length === 0 ? (
            <div className="od-empty">
              <p>🔗 No invite links created yet</p>
              <span>Click "Invite Candidate" to get started</span>
            </div>
          ) : (
            <div className="od-table-wrap">
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Created By</th>
                    <th>Expires</th>
                    <th>Uses</th>
                    <th>Status</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tok) => {
                    const badge = tokenStatusBadge(tok.status);
                    const isExpired = new Date(tok.expiresAt) < new Date();
                    const url = `${appUrl}/onboard/${tok.token}`;
                    return (
                      <tr key={tok.$id} className="od-table-row">
                        <td>
                          <p className="od-token-label">{tok.label}</p>
                          <p className="od-token-date">Created {formatDate(tok.$createdAt)}</p>
                        </td>
                        <td className="od-contact-email">{tok.createdBy}</td>
                        <td className={`od-date-cell ${isExpired ? 'od-expired' : ''}`}>
                          {formatDate(tok.expiresAt)}
                        </td>
                        <td>
                          <span className="od-uses">
                            {tok.usedCount}{tok.maxUses > 0 ? ` / ${tok.maxUses}` : ''} used
                          </span>
                        </td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                        <td>
                          {!isExpired && tok.status === 'active' ? (
                            <button className="od-btn-view" onClick={() => copyLink(url)}>
                              📋 Copy Link
                            </button>
                          ) : (
                            <span className="od-expired">Inactive</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onCreated={handleInviteCreated} />
      )}
      {selectedSub && (
        <SubmissionModal sub={selectedSub} onClose={() => setSelectedSub(null)} onRefresh={fetchSubmissions} />
      )}
    </div>
  );
}
