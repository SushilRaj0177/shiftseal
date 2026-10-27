import React, { useState } from 'react';
import type {
  Language,
  WorkerProfile,
  Workplace,
  ShiftRecord,
  LedgerEvent,
  HoursCalculationResult,
  PayslipCalculationResult,
  WorkerNotification,
} from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import { ListenButton } from '../components/ListenButton.js';

interface WorkerHomeProps {
  lang: Language;
  worker: WorkerProfile;
  workplace: Workplace;
  todayDate: string;
  todayShift: ShiftRecord | null;
  shifts: ShiftRecord[];
  chain: LedgerEvent[];
  clientChainValid: boolean;
  serverChainValid: boolean;
  hoursResult: HoursCalculationResult;
  payslip: PayslipCalculationResult;
  notifications: WorkerNotification[];
  onRefresh: () => void;
}

export const WorkerHome: React.FC<WorkerHomeProps> = ({
  lang,
  worker,
  workplace,
  todayShift,
  shifts,
  chain,
  clientChainValid,
  serverChainValid,
  hoursResult,
  payslip,
  notifications,
  onRefresh,
}) => {
  const [zoneCode, setZoneCode] = useState(workplace.checkinCode);
  const [showQrInput, setShowQrInput] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowReceipts(false);
        setShowQrInput(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const isCheckedIn = Boolean(todayShift && todayShift.checkInTime && !todayShift.checkOutTime);
  const isCompletedToday = Boolean(todayShift && todayShift.checkInTime && todayShift.checkOutTime);
  const intact = clientChainValid && serverChainValid;

  const handleCheckInOut = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setBusy(true);
    try {
      await fetch('/api/worker/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          action,
          zoneCode: zoneCode.trim() || workplace.checkinCode,
          source: 'qr',
        }),
      });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleCameraQrScan = async () => {
    setScanNotice(null);
    if ('BarcodeDetector' in window) {
      setScanNotice('BarcodeDetector ready: simulated scan of gate sticker ' + workplace.checkinCode);
      setZoneCode(workplace.checkinCode);
    } else {
      setScanNotice('Camera QR scanner not supported on this browser. Code pre-filled below.');
      setShowQrInput(true);
    }
  };

  const handleNotificationResponse = async (
    notificationId: string,
    response: 'ok' | 'disagree'
  ) => {
    setBusy(true);
    try {
      await fetch('/api/worker/notifications/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          notificationId,
          response,
        }),
      });
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const summarySpeech =
    lang === 'ta'
      ? `இந்த வாரம் சாதாரண நேரம் ${hoursResult.normalHours} மணி, ஓவர்டைம் ${hoursResult.otHours} மணி, நிகர சம்பளம் ரூபாய் ${payslip.netPay}.`
      : lang === 'hi'
        ? `इस सप्ताह सामान्य घंटे ${hoursResult.normalHours}, ओवरटाइम ${hoursResult.otHours} घंटे, कुल वेतन ${payslip.netPay} रुपये।`
        : `This week you have ${hoursResult.normalHours} normal hours, ${hoursResult.otHours} overtime hours, and estimated net pay of ${payslip.netPay} rupees.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Notifications Card (Live Supervisor Edit Alerts) */}
      {notifications.length > 0 && (
        <section className="card" aria-labelledby="notif-heading" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 id="notif-heading">🔔 {t(lang, 'notificationsTitle')}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map((n) => {
              const msg =
                lang === 'ta'
                  ? `உங்கள் ${n.date} பணி முடிவு நேரம் ${n.oldValue} → ${n.newValue} என ${n.supervisorName ?? 'மேற்பார்வையாளர்'} மாற்றியுள்ளார். காரணம்: "${n.reason}"`
                  : lang === 'hi'
                    ? `आपका ${n.date} चेक-आउट समय ${n.oldValue} → ${n.newValue} (${n.supervisorName ?? 'सुपरवाइजर'}) द्वारा बदला गया। कारण: "${n.reason}"`
                    : `Your ${n.date} checkout was changed ${n.oldValue} → ${n.newValue} by ${n.supervisorName ?? 'Supervisor'}. Reason: "${n.reason}"`;

              return (
                <div
                  key={n.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <p style={{ fontWeight: 500, fontSize: '14px' }}>{msg}</p>
                    <ListenButton lang={lang} text={msg} />
                  </div>
                  {n.status === 'unread' ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-good"
                        disabled={busy}
                        onClick={() => handleNotificationResponse(n.id, 'ok')}
                        style={{ flex: 1 }}
                      >
                        ✓ {t(lang, 'okUnderstood')}
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={busy}
                        onClick={() => handleNotificationResponse(n.id, 'disagree')}
                        style={{ flex: 1 }}
                      >
                        ✋ {t(lang, 'iDisagree')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className={n.status === 'disputed' ? 'badge badge-danger' : 'badge badge-good'}>
                        {n.status === 'disputed' ? t(lang, 'disputedBadge') : t(lang, 'acknowledgedBadge')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Check-in / Check-out Card */}
      <section className="card" aria-labelledby="checkin-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span className={isCheckedIn ? 'badge badge-good' : 'badge'}>
              {isCheckedIn ? t(lang, 'checkedInStatus') : t(lang, 'notCheckedInStatus')}
            </span>
            <h3 id="checkin-heading" style={{ marginTop: '6px' }}>
              {lang === 'ta' ? workplace.nameTa : lang === 'hi' ? workplace.nameHi : workplace.name}
            </h3>
          </div>
          <button
            type="button"
            className="btn-subtle"
            onClick={handleCameraQrScan}
            style={{ fontSize: '13px', padding: '8px 12px' }}
          >
            📷 QR ({workplace.checkinCode})
          </button>
        </div>

        {scanNotice && (
          <p role="status" style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '10px' }}>
            {scanNotice}
          </p>
        )}

        {showQrInput && (
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="zone-code-input" style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
              Zone / Gate Code
            </label>
            <input
              id="zone-code-input"
              type="text"
              value={zoneCode}
              onChange={(e) => setZoneCode(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
              }}
            />
          </div>
        )}

        {!isCheckedIn && !isCompletedToday && (
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => handleCheckInOut('CHECK_IN')}
            style={{ width: '100%', minHeight: '56px', fontSize: '17px' }}
          >
            <span aria-hidden="true">🟢</span>
            <span>{t(lang, 'checkIn')}</span>
          </button>
        )}

        {isCheckedIn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-secondary)' }}>
              Checked in at <strong>{todayShift?.checkInTime}</strong> ({todayShift?.zoneCode})
            </p>
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => handleCheckInOut('CHECK_OUT')}
              style={{ width: '100%', minHeight: '56px', fontSize: '17px' }}
            >
              <span aria-hidden="true">🔴</span>
              <span>{t(lang, 'checkOut')}</span>
            </button>
          </div>
        )}

        {isCompletedToday && (
          <div style={{ padding: '12px', background: 'var(--good-soft)', borderRadius: 'var(--radius-sm)', color: 'var(--good)', fontWeight: 600 }}>
            ✓ Shift sealed today: {todayShift?.checkInTime} – {todayShift?.checkOutTime}
          </div>
        )}
      </section>

      {/* Week at a glance */}
      <section className="card" aria-labelledby="week-glance-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 id="week-glance-heading">{t(lang, 'weekAtAGlance')}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={intact ? 'badge badge-good' : 'badge badge-danger'}>
              {intact ? t(lang, 'recordIntact') : t(lang, 'recordTampered')}
            </span>
            <ListenButton lang={lang} text={summarySpeech} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block' }}>
              {t(lang, 'normalHours')}
            </span>
            <strong style={{ fontSize: '20px' }}>{hoursResult.normalHours}h</strong>
          </div>
          <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block' }}>
              {t(lang, 'overtimeHours')}
            </span>
            <strong style={{ fontSize: '20px', color: 'var(--accent)' }}>{hoursResult.otHours}h</strong>
          </div>
          <div style={{ padding: '12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block' }}>
              {t(lang, 'totalPayThisWeek')}
            </span>
            <strong style={{ fontSize: '20px', color: 'var(--good)' }}>₹{payslip.netPay}</strong>
          </div>
        </div>

        <button
          type="button"
          className="btn-subtle"
          onClick={() => setShowReceipts((v) => !v)}
          style={{ width: '100%' }}
        >
          <span aria-hidden="true">🔗</span>
          <span>
            {t(lang, 'myReceipts')} ({chain.length} SHA-256 events)
          </span>
        </button>

        {showReceipts && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
              Client & server SHA-256 chain verification: <strong>{intact ? 'PASSED' : 'FAILED'}</strong>
            </p>
            {shifts.map((s) => (
              <div
                key={s.date}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{s.date} ({s.zoneCode})</span>
                  <span>
                    {s.checkInTime} – {s.checkOutTime ?? 'Active'}
                  </span>
                </div>
                {s.edits.map((ed) => (
                  <div
                    key={ed.editEventId}
                    style={{
                      marginTop: '6px',
                      padding: '6px 8px',
                      background: 'var(--warning-soft)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    ⚠️ Edited {ed.oldValue} → {ed.newValue} by {ed.editorName} ({ed.reason})
                  </div>
                ))}
              </div>
            ))}

            <div style={{ marginTop: '6px' }}>
              <strong style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Cryptographic Hash Chain Timeline
              </strong>
              {chain.slice(-6).map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span>
                    {ev.type} · {ev.createdAt.slice(0, 10)}
                  </span>
                  <span style={{ color: 'var(--accent)' }}>
                    #{ev.hash.slice(0, 8)} ← {ev.prevHash.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
