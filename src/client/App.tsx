import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import type { Language } from '../shared/types.js';
import { t } from '../shared/i18n/index.js';
import { LangSwitch } from './components/LangSwitch.js';
import { ListenButton } from './components/ListenButton.js';

const WorkerApp = lazy(() => import('./worker/WorkerApp.js'));
const AdminApp = lazy(() => import('./admin/AdminApp.js'));

const STORAGE_LANG_KEY = 'shiftseal_lang';

function getInitialLang(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'ta' || saved === 'hi') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

interface SignInScreenProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ lang, onSelectLang }) => {
  const navigate = useNavigate();

  const handleWorkerSignIn = (workerId: string, preferredLang?: Language) => {
    if (preferredLang) {
      onSelectLang(preferredLang);
    }
    navigate(`/worker?workerId=${workerId}`);
  };

  const handleAdminSignIn = (workplaceId: string) => {
    navigate(`/admin?workplaceId=${workplaceId}`);
  };

  return (
    <div className="container-wide">
      <section
        className="card"
        style={{
          marginBottom: '24px',
          borderLeft: '4px solid var(--accent)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span className="badge badge-accent">{t(lang, 'demoSignIn')}</span>
            <h1 style={{ marginTop: '8px' }}>{t(lang, 'tagline')}</h1>
            <p style={{ color: 'var(--ink-secondary)', marginTop: '4px', fontSize: '17px' }}>
              {t(lang, 'pitchLine')}
            </p>
          </div>
          <ListenButton
            lang={lang}
            text={`${t(lang, 'tagline')} ${t(lang, 'demoSignInSubtitle')}`}
          />
        </div>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '14px' }}>
          {t(lang, 'demoSignInSubtitle')}
        </p>
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          🛡️ {t(lang, 'principleBanner')}
        </div>
      </section>

      <section aria-labelledby="worker-roles-heading" style={{ marginBottom: '28px' }}>
        <h2 id="worker-roles-heading">{t(lang, 'workerRoles')}</h2>
        <div className="role-grid">
          <button
            type="button"
            className="role-card"
            onClick={() => handleWorkerSignIn('w-murugan', 'ta')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="badge badge-warning">Construction · தமிழ்</span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>
                👷
              </span>
            </div>
            <h3>{t(lang, 'muruganCardTitle')}</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '14px' }}>
              {t(lang, 'muruganCardRole')}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              → {t(lang, 'muruganCardNote')}
            </p>
          </button>

          <button
            type="button"
            className="role-card"
            onClick={() => handleWorkerSignIn('w-lakshmi', 'en')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="badge badge-danger">Campus · தமிழ் / EN</span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>
                🔦
              </span>
            </div>
            <h3>{t(lang, 'lakshmiCardTitle')}</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '14px' }}>
              {t(lang, 'lakshmiCardRole')}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              → {t(lang, 'lakshmiCardNote')}
            </p>
          </button>
        </div>
      </section>

      <section aria-labelledby="admin-roles-heading">
        <h2 id="admin-roles-heading">{t(lang, 'adminRoles')}</h2>
        <div className="role-grid">
          <button
            type="button"
            className="role-card"
            onClick={() => handleAdminSignIn('wp-tower-b')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="badge badge-accent">Sector 1: Construction</span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>
                🏗️
              </span>
            </div>
            <h3>{t(lang, 'adminTowerTitle')}</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '14px' }}>
              {t(lang, 'adminTowerRole')}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              → {t(lang, 'adminTowerNote')}
            </p>
          </button>

          <button
            type="button"
            className="role-card"
            onClick={() => handleAdminSignIn('wp-campus')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="badge badge-accent">Sector 2: College Campus</span>
              <span aria-hidden="true" style={{ fontSize: '20px' }}>
                🏛️
              </span>
            </div>
            <h3>{t(lang, 'adminCampusTitle')}</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '14px' }}>
              {t(lang, 'adminCampusRole')}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
              → {t(lang, 'adminCampusNote')}
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};

export const App: React.FC = () => {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const handleChangeLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        {t(lang, 'skipToContent')}
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="brand-mark">
            <span className="brand-seal" aria-hidden="true">
              S
            </span>
            <div>
              <strong style={{ fontSize: '17px', display: 'block', lineHeight: 1.1 }}>
                {t(lang, 'appName')}
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
                FairShift · SDG 8
              </span>
            </div>
          </Link>
          <LangSwitch lang={lang} onChange={handleChangeLang} />
        </div>
      </header>
      <main id="main-content">
        <Suspense
          fallback={
            <div className="container-narrow">
              <div className="card skeleton" style={{ height: '140px' }} />
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={<SignInScreen lang={lang} onSelectLang={handleChangeLang} />}
            />
            <Route path="/worker/*" element={<WorkerApp lang={lang} />} />
            <Route path="/admin/*" element={<AdminApp lang={lang} />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
};

export default App;
