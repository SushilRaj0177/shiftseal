import React, { useState, Suspense, lazy } from 'react';
import { Icon } from './components/Icon.js';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import type { Language } from '../shared/types.js';
import { t } from '../shared/i18n/index.js';
import { LangSwitch } from './components/LangSwitch.js';

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

  const workers = [
    {
      id: 'w-murugan',
      lang: 'ta' as Language,
      initials: 'MK',
      tone: 'amber',
      title: t(lang, 'muruganCardTitle'),
      role: t(lang, 'muruganCardRole'),
      note: t(lang, 'muruganCardNote'),
    },
    {
      id: 'w-lakshmi',
      lang: 'en' as Language,
      initials: 'LS',
      tone: 'teal',
      title: t(lang, 'lakshmiCardTitle'),
      role: t(lang, 'lakshmiCardRole'),
      note: t(lang, 'lakshmiCardNote'),
    },
  ];
  const admins = [
    {
      id: 'wp-tower-b',
      icon: 'crane' as const,
      title: t(lang, 'adminTowerTitle'),
      role: t(lang, 'adminTowerRole'),
      note: t(lang, 'adminTowerNote'),
    },
    {
      id: 'wp-campus',
      icon: 'building' as const,
      title: t(lang, 'adminCampusTitle'),
      role: t(lang, 'adminCampusRole'),
      note: t(lang, 'adminCampusNote'),
    },
  ];

  return (
    <div className="container-narrow signin">
      <section className="signin-hero">
        <span className="signin-mark" aria-hidden="true">
          <Icon name="shield" size={30} />
        </span>
        <h1>{t(lang, 'tagline')}</h1>
        <p>{t(lang, 'pitchLine')}</p>
      </section>

      <section aria-labelledby="worker-roles-heading" className="account-group">
        <h2 id="worker-roles-heading" className="group-label">
          {t(lang, 'workerRoles')}
        </h2>
        <div className="account-list">
          {workers.map((w) => (
            <button
              key={w.id}
              type="button"
              className="account-row"
              onClick={() => handleWorkerSignIn(w.id, w.lang)}
            >
              <span className={`avatar avatar-${w.tone}`} aria-hidden="true">
                {w.initials}
              </span>
              <span className="account-text">
                <strong>{w.title}</strong>
                <span>{w.role}</span>
                <small>{w.note}</small>
              </span>
              <Icon name="arrowRight" className="chevron" />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="admin-roles-heading" className="account-group">
        <h2 id="admin-roles-heading" className="group-label">
          {t(lang, 'adminRoles')}
        </h2>
        <div className="account-list">
          {admins.map((a) => (
            <button
              key={a.id}
              type="button"
              className="account-row"
              onClick={() => handleAdminSignIn(a.id)}
            >
              <span className="avatar avatar-accent" aria-hidden="true">
                <Icon name={a.icon} size={22} />
              </span>
              <span className="account-text">
                <strong>{a.title}</strong>
                <span>{a.role}</span>
                <small>{a.note}</small>
              </span>
              <Icon name="arrowRight" className="chevron" />
            </button>
          ))}
        </div>
      </section>

      <p className="signin-foot">
        <Icon name="lock" size={14} />
        {t(lang, 'principleBanner')}
      </p>
      <p className="signin-foot muted">{t(lang, 'demoSignIn')}</p>
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
              <Icon name="shield" size={20} />
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
