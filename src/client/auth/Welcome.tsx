import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LangProvider.js';
import { useAuth } from './AuthProvider.js';
import { Brand, LanguagePicker } from '../ui/index.js';
import { Guilloche } from '../ui/visuals.js';
import { Icon } from '../components/Icon.js';

export const Welcome: React.FC = () => {
  const { t, lang, setLang } = useLang();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  if (ready && user) return <Navigate to="/" replace />;

  const start = (intent: 'worker' | 'employer') => {
    sessionStorage.setItem('shiftseal.intent', intent);
    navigate(`/sign-in?as=${intent}`);
  };

  return (
    <main className="screen">
      <section className="welcome-hero">
        <Guilloche className="guilloche" opacity={0.35} />
        <Brand />
        <div style={{ height: 72 }} />
        <span className="seal-line">
          <Icon name="lock" size={14} />
          {t('sealed')}
        </span>
        <h1 className="t-display" style={{ whiteSpace: 'pre-line', marginTop: 10 }}>
          {t('welcomeTitle')}
        </h1>
        <p style={{ marginTop: 12 }}>{t('welcomeBody')}</p>
      </section>
      <div className="screen-body" style={{ paddingTop: 24 }}>
        <span className="t-label">{t('language')}</span>
        <LanguagePicker value={lang} onChange={setLang} label={t('language')} />
        <div className="spacer" />
        <button type="button" className="btn btn-primary" onClick={() => start('worker')}>
          {t('getStarted')}
          <Icon name="arrowRight" size={18} />
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => start('employer')}>
          {t('iManage')}
        </button>
      </div>
    </main>
  );
};
