import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LANGUAGES, localeOf } from '../../shared/languages.js';
import { useLang } from '../i18n/LangProvider.js';
import { useAuth } from './AuthProvider.js';
import { Brand, LanguagePicker, Sheet } from '../ui/index.js';
import { Grain, TimeCard } from '../ui/visuals.js';
import { Icon } from '../components/Icon.js';

export const Welcome: React.FC = () => {
  const { t, lang, setLang } = useLang();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  if (ready && user) return <Navigate to="/" replace />;

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const start = (intent: 'worker' | 'employer') => {
    sessionStorage.setItem('shiftseal.intent', intent);
    navigate(`/sign-in?as=${intent}`);
  };

  return (
    <main className="screen welcome">
      <Grain />
      <header className="welcome-top">
        <Brand />
        <button type="button" className="lang-pill" onClick={() => setPicking(true)}>
          <span lang={current.code}>{current.native}</span>
          <span className="lang-pill-region">{current.region}</span>
          <Icon name="chev" size={14} />
        </button>
      </header>

      <TimeCard locale={localeOf(lang)} />

      <section className="welcome-copy">
        <span className="seal-line">
          <Icon name="lock" size={14} />
          {t('sealed')}
        </span>
        <h1 className="t-display">
          {t('welcomeTitle')
            .split('\n')
            .map((line, i) => (
              <span key={i} className={i ? 't-accent' : undefined} style={{ display: 'block' }}>
                {line}
              </span>
            ))}
        </h1>
        <p>{t('welcomeBody')}</p>
      </section>

      <div className="welcome-actions">
        <button type="button" className="btn btn-paper" onClick={() => start('worker')}>
          {t('getStarted')}
          <Icon name="arrowRight" size={18} />
        </button>
        <button type="button" className="btn btn-on-dark" onClick={() => start('employer')}>
          {t('iManage')}
        </button>
      </div>

      {picking && (
        <Sheet title={t('language')} onClose={() => setPicking(false)}>
          <LanguagePicker
            value={lang}
            onChange={(l) => {
              setLang(l);
              setPicking(false);
            }}
            label={t('language')}
          />
        </Sheet>
      )}
    </main>
  );
};
