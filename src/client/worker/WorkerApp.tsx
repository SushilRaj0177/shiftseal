import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type {
  Language,
  WorkerProfile,
  Workplace,
  ShiftRecord,
  LedgerEvent,
  HoursCalculationResult,
  PayslipCalculationResult,
  OvertimeClaim,
  WorkerNotification,
  HazardReport,
} from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import { verifyAsync } from '../../shared/ledger/ledger.js';
import { WorkerHome } from './WorkerHome.js';
import { WorkerPay } from './WorkerPay.js';
import { WorkerReport } from './WorkerReport.js';
import { WorkerSpeakUp } from './WorkerSpeakUp.js';

interface WorkerAppProps {
  lang: Language;
}

interface WorkerOverviewPayload {
  worker: WorkerProfile;
  workplace: Workplace;
  todayDate: string;
  todayShift: ShiftRecord | null;
  chain: LedgerEvent[];
  chainVerification: { ok: boolean };
  shifts: ShiftRecord[];
  hoursResult: HoursCalculationResult;
  payslip: PayslipCalculationResult;
  claims: OvertimeClaim[];
  notifications: WorkerNotification[];
  hazards: HazardReport[];
  feedbackGroupStatus: {
    team: string;
    count: number;
    threshold: number;
    visible: boolean;
    statusMessage: string;
  };
}

export const WorkerApp: React.FC<WorkerAppProps> = ({ lang }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workerId = searchParams.get('workerId') || 'w-murugan';
  const tab = searchParams.get('tab') || 'home';

  const [data, setData] = useState<WorkerOverviewPayload | null>(null);
  const [clientChainValid, setClientChainValid] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/worker/${encodeURIComponent(workerId)}/overview`);
      if (!res.ok) return;
      const json = (await res.json()) as WorkerOverviewPayload;
      setData(json);

      // Keep local receipt copy on the worker's phone and run client-side SHA-256 verification
      try {
        localStorage.setItem(`shiftseal_receipts_${workerId}`, JSON.stringify(json.chain));
      } catch {
        // ignore quota errors
      }
      const verified = await verifyAsync(json.chain);
      setClientChainValid(verified.ok);
    } catch {
      // network error handled gracefully
    }
  }, [workerId]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const setTab = (nextTab: string) => {
    setSearchParams({ workerId, tab: nextTab });
  };

  if (!data) {
    return (
      <div className="container-narrow">
        <div className="card skeleton" style={{ height: '90px', marginBottom: '16px' }} />
        <div className="card skeleton" style={{ height: '240px' }} />
      </div>
    );
  }

  const unreadNotifs = data.notifications.filter((n) => n.status === 'unread').length;

  return (
    <div className="container-narrow">
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span
            className={
              clientChainValid && data.chainVerification.ok
                ? 'badge badge-good'
                : 'badge badge-danger'
            }
          >
            {clientChainValid && data.chainVerification.ok
              ? t(lang, 'recordIntact')
              : t(lang, 'recordTampered')}
          </span>
          <h2 style={{ marginTop: '6px' }}>
            {lang === 'ta'
              ? data.worker.nameTa
              : lang === 'hi'
                ? data.worker.nameHi
                : data.worker.name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
            {lang === 'ta'
              ? `${data.worker.roleTa} · ${data.workplace.nameTa}`
              : lang === 'hi'
                ? `${data.worker.roleHi} · ${data.workplace.nameHi}`
                : `${data.worker.role} · ${data.workplace.name}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-subtle"
            onClick={() =>
              setSearchParams({
                workerId: workerId === 'w-murugan' ? 'w-lakshmi' : 'w-murugan',
                tab,
              })
            }
            style={{
              fontSize: '12px',
              padding: '4px 9px',
              minHeight: '34px',
              color: 'var(--ink-secondary)',
            }}
          >
            ⇄ {t(lang, 'switchDemoWorker')}
          </button>
          <Link
            to="/"
            className="btn-subtle"
            style={{
              textDecoration: 'none',
              padding: '4px 9px',
              minHeight: '34px',
              fontSize: '12px',
              color: 'var(--ink-secondary)',
            }}
          >
            {t(lang, 'switchRole')}
          </Link>
        </div>
      </div>

      {tab === 'home' && (
        <WorkerHome
          lang={lang}
          worker={data.worker}
          workplace={data.workplace}
          todayDate={data.todayDate}
          todayShift={data.todayShift}
          shifts={data.shifts}
          chain={data.chain}
          clientChainValid={clientChainValid}
          serverChainValid={data.chainVerification.ok}
          hoursResult={data.hoursResult}
          payslip={data.payslip}
          notifications={data.notifications}
          onRefresh={fetchOverview}
        />
      )}

      {tab === 'pay' && (
        <WorkerPay
          lang={lang}
          worker={data.worker}
          payslip={data.payslip}
          claims={data.claims}
          onRefresh={fetchOverview}
        />
      )}

      {tab === 'report' && (
        <WorkerReport
          lang={lang}
          worker={data.worker}
          workplace={data.workplace}
          hazards={data.hazards}
          onRefresh={fetchOverview}
        />
      )}

      {tab === 'speakup' && (
        <WorkerSpeakUp
          lang={lang}
          worker={data.worker}
          workplace={data.workplace}
          feedbackGroupStatus={data.feedbackGroupStatus}
          onRefresh={fetchOverview}
        />
      )}

      <nav className="worker-bottom-nav" aria-label="Worker navigation">
        <button
          type="button"
          className="worker-tab-btn"
          aria-current={tab === 'home' ? 'page' : undefined}
          onClick={() => setTab('home')}
        >
          <span aria-hidden="true">
            🏠{unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}
          </span>
          <span>{t(lang, 'navHome')}</span>
        </button>
        <button
          type="button"
          className="worker-tab-btn"
          aria-current={tab === 'pay' ? 'page' : undefined}
          onClick={() => setTab('pay')}
        >
          <span aria-hidden="true">₹</span>
          <span>{t(lang, 'navPay')}</span>
        </button>
        <button
          type="button"
          className="worker-tab-btn"
          aria-current={tab === 'report' ? 'page' : undefined}
          onClick={() => setTab('report')}
        >
          <span aria-hidden="true">⚠️</span>
          <span>{t(lang, 'navReport')}</span>
        </button>
        <button
          type="button"
          className="worker-tab-btn"
          aria-current={tab === 'speakup' ? 'page' : undefined}
          onClick={() => setTab('speakup')}
        >
          <span aria-hidden="true">🛡️</span>
          <span>{t(lang, 'navSpeakUp')}</span>
        </button>
      </nav>
    </div>
  );
};

export default WorkerApp;
