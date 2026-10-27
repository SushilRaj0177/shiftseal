import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';

interface WorkerAppProps {
  lang: Language;
}

export const WorkerApp: React.FC<WorkerAppProps> = ({ lang }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workerId = searchParams.get('workerId') || 'w-murugan';
  const tab = searchParams.get('tab') || 'home';

  const setTab = (nextTab: string) => {
    setSearchParams({ workerId, tab: nextTab });
  };

  return (
    <div className="container-narrow">
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <span className="badge badge-good">{t(lang, 'recordIntact')}</span>
          <h2 style={{ marginTop: '6px' }}>
            {workerId === 'w-lakshmi' ? t(lang, 'lakshmiCardTitle') : t(lang, 'muruganCardTitle')}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
            {workerId === 'w-lakshmi' ? t(lang, 'lakshmiCardRole') : t(lang, 'muruganCardRole')}
          </p>
        </div>
        <Link to="/" className="btn-subtle" style={{ textDecoration: 'none', padding: '8px 12px' }}>
          {t(lang, 'switchRole')}
        </Link>
      </div>

      <section aria-live="polite" className="card">
        <h3>
          {tab === 'home' && t(lang, 'navHome')}
          {tab === 'pay' && t(lang, 'navPay')}
          {tab === 'report' && t(lang, 'navReport')}
          {tab === 'speakup' && t(lang, 'navSpeakUp')}
        </h3>
        <p style={{ marginTop: '8px', color: 'var(--ink-secondary)' }}>
          {t(lang, 'principleBanner')}
        </p>
      </section>

      <nav className="worker-bottom-nav" aria-label="Worker navigation">
        <button
          type="button"
          className="worker-tab-btn"
          aria-current={tab === 'home' ? 'page' : undefined}
          onClick={() => setTab('home')}
        >
          <span aria-hidden="true">🏠</span>
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
