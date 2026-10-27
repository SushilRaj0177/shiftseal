import React, { useState, useEffect, useCallback } from 'react';
import { adminAuthHeaders } from './adminSession.js';
import { Icon, zoneIcon } from '../components/Icon.js';
import { useSearchParams, Link } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import type { DashboardPayload } from './dashboardTypes.js';
import { formatCountdown } from './formatCountdown.js';
import { FeedbackThemesCard } from './FeedbackThemesCard.js';
import { AttendanceCard } from './AttendanceCard.js';
import { FatigueSignalsCard } from './FatigueSignalsCard.js';
import { HotspotsCard } from './HotspotsCard.js';

interface AdminAppProps {
  lang: Language;
}

export const AdminApp: React.FC<AdminAppProps> = ({ lang }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workplaceId = searchParams.get('workplaceId') || 'wp-tower-b';
  const viewMode = searchParams.get('view') || 'dashboard'; // 'dashboard' | 'zones'

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [busy, setBusy] = useState(false);

  // Dispute resolution input state
  const [disputeReasons, setDisputeReasons] = useState<Record<string, string>>({});

  // Shift edit modal/inline state
  const [editingShift, setEditingShift] = useState<{
    workerId: string;
    workerName: string;
    targetEventId: string;
    date: string;
    currentTimestamp: string;
  } | null>(null);
  const [newShiftTime, setNewShiftTime] = useState('18:00');
  const [editShiftReason, setEditShiftReason] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dashboard/${encodeURIComponent(workplaceId)}`, {
        headers: await adminAuthHeaders(workplaceId),
      });
      if (res.ok) {
        const json = (await res.json()) as DashboardPayload;
        setData(json);
      }
    } catch {
      // ignore transient errors
    }
  }, [workplaceId]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingShift(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleResolveDispute = async (claimId: string, decision: 'approved' | 'rejected') => {
    const reason =
      (disputeReasons[claimId] || '').trim() ||
      (decision === 'approved'
        ? 'Verified with site shift supervisor log'
        : 'Outside scheduled concrete pour hours');
    setBusy(true);
    try {
      await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await adminAuthHeaders(workplaceId)),
        },
        body: JSON.stringify({
          claimId,
          decision,
          reason,
          resolvedBy: data?.workplace.supervisorName || 'Site Admin',
        }),
      });
      fetchDashboard();
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateHazard = async (hazardId: string, status: 'acknowledged' | 'resolved') => {
    setBusy(true);
    try {
      await fetch('/api/admin/hazards/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await adminAuthHeaders(workplaceId)),
        },
        body: JSON.stringify({ hazardId, status }),
      });
      fetchDashboard();
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmShiftEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift || editShiftReason.trim().length < 3) return;
    setBusy(true);
    setEditSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/shifts/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await adminAuthHeaders(workplaceId)),
        },
        body: JSON.stringify({
          workerId: editingShift.workerId,
          targetEventId: editingShift.targetEventId,
          newTimestamp: newShiftTime,
          reason: editShiftReason.trim(),
          editorName: data?.workplace.supervisorName || 'Supervisor Ravi',
        }),
      });
      if (res.ok) {
        setEditSuccessMsg(
          `✓ Appended EDIT event to ${editingShift.workerName}'s SHA-256 ledger and sent instant notification in worker's language.`
        );
        setEditingShift(null);
        setEditShiftReason('');
        fetchDashboard();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return (
      <div className="container-wide">
        <div className="card skeleton" style={{ height: '84px', marginBottom: '20px' }} />
        <div className="card skeleton" style={{ height: '320px' }} />
      </div>
    );
  }

  const paydayCountdown = formatCountdown(data.workplace.nextPayDate, data.todayDate);

  return (
    <div className="container-wide">
      {/* Header: Workplace switch and today's date */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-accent">SDG 8 · Employer & Admin View</span>
            <span className="badge">Today: {data.todayDate}</span>
            <span className="badge badge-warning">Payday: {paydayCountdown.label}</span>
          </div>
          <h2 style={{ marginTop: '6px' }}>{data.workplace.name}</h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
            Supervisor: {data.workplace.supervisorName} · Sector: {data.workplace.sector}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={workplaceId === 'wp-tower-b' ? 'btn-primary' : 'btn-subtle'}
            onClick={() => setSearchParams({ workplaceId: 'wp-tower-b', view: viewMode })}
          >
            <Icon name="crane" />
            Tower B Construction Site
          </button>
          <button
            type="button"
            className={workplaceId === 'wp-campus' ? 'btn-primary' : 'btn-subtle'}
            onClick={() => setSearchParams({ workplaceId: 'wp-campus', view: viewMode })}
          >
            <Icon name="building" />
            Campus Facilities
          </button>
          <button
            type="button"
            className={viewMode === 'zones' ? 'btn-primary' : 'btn-subtle'}
            onClick={() =>
              setSearchParams({
                workplaceId,
                view: viewMode === 'zones' ? 'dashboard' : 'zones',
              })
            }
          >
            <Icon name="printer" />
            {viewMode === 'zones' ? 'Back to Dashboard' : 'Printable Zone QRs'}
          </button>
          <Link to="/" className="btn-subtle" style={{ textDecoration: 'none' }}>
            {t(lang, 'switchRole')}
          </Link>
        </div>
      </div>

      {editSuccessMsg && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--good-soft)',
            color: 'var(--good)',
            fontWeight: 600,
          }}
        >
          {editSuccessMsg}
        </div>
      )}

      {viewMode === 'zones' ? (
        <section className="card" aria-labelledby="zones-print-heading">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <h3 id="zones-print-heading">
                Printable Zone & Check-in QR Stickers — {data.workplace.name}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                Place at the workplace gate for shift check-in/out and at each zone for 1-scan voice
                hazard reports.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              <Icon name="printer" />
              Print Stickers
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Workplace Check-in QR */}
            <div
              style={{
                padding: '16px',
                border: '2px solid var(--accent)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}
            >
              <span className="badge badge-accent">SHIFT CHECK-IN / OUT</span>
              <h4 style={{ marginTop: '8px' }}>{data.workplace.name}</h4>
              <img
                src={`/api/qr-svg?code=${encodeURIComponent(data.workplace.checkinCode)}`}
                alt={`QR code for ${data.workplace.checkinCode}`}
                width={148}
                height={148}
                style={{ display: 'block', margin: '10px auto', borderRadius: '8px' }}
              />
              <code style={{ fontWeight: 700, fontSize: '14px' }}>
                {data.workplace.checkinCode}
              </code>
            </div>

            {data.workplace.zones.map((z) => (
              <div
                key={z.id}
                style={{
                  padding: '16px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <span className="badge">SAFETY ZONE STICKER</span>
                <h4 style={{ marginTop: '8px' }}>
                  <Icon name={zoneIcon(z.name)} /> {z.name}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
                  {z.nameTa} · {z.nameHi}
                </p>
                <img
                  src={`/api/qr-svg?code=${encodeURIComponent(z.code)}`}
                  alt={`QR code for zone ${z.name} (${z.code})`}
                  width={148}
                  height={148}
                  style={{ display: 'block', margin: '10px auto', borderRadius: '8px' }}
                />
                <code style={{ fontWeight: 700, fontSize: '14px' }}>{z.code}</code>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="admin-grid">
          <div className="admin-col">
            {/* 1. Disputes before payday */}
            <section className="card" aria-labelledby="card-disputes">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h3 id="card-disputes">1. Disputes Before Payday</h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                    Voice overtime claims and contested shift edits requiring resolution before
                    payday ({paydayCountdown.label}).
                  </p>
                </div>
                <span className="badge badge-warning">
                  {data.disputes.filter((d) => d.resolutionStatus === 'pending').length} pending
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.disputes.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      background: 'var(--surface-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <strong>
                          {d.workerName} · {d.date} · +{d.extraHours}h claimed
                        </strong>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--ink-secondary)',
                            marginLeft: '8px',
                          }}
                        >
                          (
                          {d.kind === 'edit_disagree'
                            ? 'Disagreed with shift edit'
                            : 'Voice overtime claim'}
                          )
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          className={
                            d.matchStatus === 'supported'
                              ? 'badge badge-good'
                              : d.matchStatus === 'partly_supported'
                                ? 'badge badge-warning'
                                : 'badge badge-danger'
                          }
                        >
                          Ledger: {d.matchStatus.replace('_', ' ')} ({d.supportedHours}h)
                        </span>
                        <span className="badge">
                          <Icon name="hourglass" />
                          {paydayCountdown.label}
                        </span>
                        <span
                          className={
                            d.resolutionStatus === 'approved'
                              ? 'badge badge-good'
                              : d.resolutionStatus === 'rejected'
                                ? 'badge badge-danger'
                                : 'badge badge-accent'
                          }
                        >
                          {d.resolutionStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '14px', marginTop: '6px' }}>
                      <strong>Worker statement:</strong> "{d.reason}"
                    </p>
                    <p
                      style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px' }}
                    >
                      <strong>Evidence:</strong> {d.evidence.explanation}
                    </p>

                    {d.resolutionStatus === 'pending' ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '10px',
                          flexWrap: 'wrap',
                          alignItems: 'flex-end',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '220px' }}>
                          <label
                            htmlFor={`reason-${d.id}`}
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: 600,
                              marginBottom: '4px',
                            }}
                          >
                            Decision reason (required to reject)
                          </label>
                          <input
                            id={`reason-${d.id}`}
                            type="text"
                            placeholder="Enter decision reason..."
                            value={disputeReasons[d.id] || ''}
                            onChange={(e) =>
                              setDisputeReasons({ ...disputeReasons, [d.id]: e.target.value })
                            }
                            style={{
                              width: '100%',
                              minHeight: '42px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--line)',
                              background: 'var(--surface)',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-good"
                          disabled={busy}
                          onClick={() => handleResolveDispute(d.id, 'approved')}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          disabled={busy || (disputeReasons[d.id] || '').trim().length < 3}
                          onClick={() => handleResolveDispute(d.id, 'rejected')}
                        >
                          ✕ Reject (reason required)
                        </button>
                      </div>
                    ) : (
                      d.resolutionReason && (
                        <p
                          style={{
                            fontSize: '12px',
                            marginTop: '6px',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          Resolved by {d.resolvedBy}: "{d.resolutionReason}"
                        </p>
                      )
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Hazards sorted by deadline */}
            <section className="card" aria-labelledby="card-hazards">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <h3 id="card-hazards">2. Safety Hazards (Sorted by SLA Deadline)</h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                    Life-safety hazards have a mandatory High severity floor. Past-deadline hazards
                    escalate automatically.
                  </p>
                </div>
                <span className="badge badge-danger">
                  {data.hazards.filter((h) => h.status !== 'resolved').length} active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.hazards.map((h) => {
                  const cd = formatCountdown(h.deadlineAt, data.todayDate);
                  const isEscalated = cd.overdue && h.status !== 'resolved';

                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        border: isEscalated ? '2px solid var(--danger)' : '1px solid var(--line)',
                        background: 'var(--surface-subtle)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            className={
                              h.finalSeverity === 'critical' || h.finalSeverity === 'high'
                                ? 'badge badge-danger'
                                : 'badge badge-warning'
                            }
                          >
                            {h.finalSeverity.toUpperCase()}
                          </span>
                          <strong>
                            {h.zoneName} · {h.hazardType.replace(/_/g, ' ')}
                          </strong>
                          {h.floorApplied && (
                            <span className="badge badge-warning">
                              <Icon name="scale" />
                              Floor raised ({h.aiSeverity} → {h.finalSeverity})
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          {isEscalated && (
                            <span className="badge badge-danger">
                              <Icon name="siren" />
                              ESCALATED ({cd.label})
                            </span>
                          )}
                          {!isEscalated && h.status !== 'resolved' && (
                            <span className="badge">
                              <Icon name="hourglass" />
                              {cd.label}
                            </span>
                          )}
                          <span
                            className={
                              h.status === 'resolved'
                                ? 'badge badge-good'
                                : h.status === 'acknowledged'
                                  ? 'badge badge-accent'
                                  : 'badge badge-warning'
                            }
                          >
                            {h.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <p style={{ marginTop: '8px', fontWeight: 500 }}>{h.englishSummary}</p>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--ink-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        Original ({h.detectedLanguage.toUpperCase()}): "{h.description}"
                      </p>

                      {h.status !== 'resolved' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          {h.status === 'received' && (
                            <button
                              type="button"
                              className="btn-subtle"
                              disabled={busy}
                              onClick={() => handleUpdateHazard(h.id, 'acknowledged')}
                            >
                              <Icon name="eye" />
                              Acknowledge
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-good"
                            disabled={busy}
                            onClick={() => handleUpdateHazard(h.id, 'resolved')}
                          >
                            ✓ Resolve Hazard
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="admin-col">
            {/* 3. Near-miss hotspots (inline SVG bar chart) */}
            <HotspotsCard data={data} />

            {/* 4. Fatigue and attrition signals */}
            <FatigueSignalsCard data={data} />

            {/* 5. Overtime owed this week summary */}
            <section className="card" aria-labelledby="card-overtime">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <h3 id="card-overtime">5. Overtime Owed This Week</h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                    Calculated at 2× statutory rate from sealed shift receipts and supported claims.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block' }}
                  >
                    Total Overtime ({data.overtimeSummary.totalHours}h at 2×)
                  </span>
                  <strong style={{ fontSize: '24px', color: 'var(--accent)' }}>
                    ₹{data.overtimeSummary.totalAmount}
                  </strong>
                </div>
              </div>
            </section>

            {/* 7. Attendance today */}
            <AttendanceCard data={data} />
          </div>

          {/* Bottom spanning both columns: 6. Feedback themes & Tamper-Evident Shift Ledger */}
          <FeedbackThemesCard data={data} />

          <section className="card admin-span-full" aria-labelledby="card-ledger-list">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <div>
                <h3 id="card-ledger-list">Tamper-Evident Shift Ledger & Per-Worker Overtime</h3>
                <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
                  Any shift time correction requires a written reason, appends an EDIT event to the
                  worker's SHA-256 chain, and notifies the worker immediately.
                </p>
              </div>
            </div>

            {editingShift && (
              <form
                onSubmit={handleConfirmShiftEdit}
                style={{
                  marginBottom: '16px',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--accent)',
                  background: 'var(--accent-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <strong>
                  Edit Checkout Time — {editingShift.workerName} ({editingShift.date}, current:{' '}
                  {editingShift.currentTimestamp})
                </strong>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div>
                    <label htmlFor="new-shift-time" style={{ fontSize: '12px', display: 'block' }}>
                      New Checkout (HH:mm)
                    </label>
                    <input
                      id="new-shift-time"
                      type="text"
                      value={newShiftTime}
                      onChange={(e) => setNewShiftTime(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <label
                      htmlFor="edit-shift-reason"
                      style={{ fontSize: '12px', display: 'block' }}
                    >
                      Mandatory Supervisor Reason (sent to worker in their language)
                    </label>
                    <input
                      id="edit-shift-reason"
                      type="text"
                      required
                      placeholder="e.g., Gate register showed 18:00 sign-out"
                      value={editShiftReason}
                      onChange={(e) => setEditShiftReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy || editShiftReason.trim().length < 3}
                  >
                    Log Edit Event & Notify Worker
                  </button>
                  <button
                    type="button"
                    className="btn-subtle"
                    onClick={() => setEditingShift(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.overtimeSummary.workers.map((item) => {
                const lastCompletedShift = [...item.shifts]
                  .reverse()
                  .find((s) => Boolean(s.checkOutEventId && s.checkOutTime));

                return (
                  <div
                    key={item.worker.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong>{item.worker.name}</strong>
                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--ink-secondary)',
                          marginLeft: '8px',
                        }}
                      >
                        {item.worker.role}
                      </span>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--ink-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        Normal: {item.normalHours}h · Overtime: <strong>{item.otHours}h</strong> ·
                        Net Pay: ₹{item.netPay}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong style={{ color: 'var(--accent)' }}>OT: ₹{item.otAmountOwed}</strong>
                      {lastCompletedShift && lastCompletedShift.checkOutEventId && (
                        <button
                          type="button"
                          className="btn-subtle"
                          onClick={() => {
                            setEditingShift({
                              workerId: item.worker.id,
                              workerName: item.worker.name,
                              targetEventId: lastCompletedShift.checkOutEventId!,
                              date: lastCompletedShift.date,
                              currentTimestamp: lastCompletedShift.checkOutTime!,
                            });
                            setNewShiftTime('18:00');
                            setEditShiftReason('Gate sheet matched 18:00 closing');
                          }}
                          style={{ fontSize: '12px', minHeight: '36px', padding: '6px 10px' }}
                        >
                          <Icon name="pencil" />
                          Edit {lastCompletedShift.date} shift ({lastCompletedShift.checkOutTime})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminApp;
