import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { useLang } from '../i18n/LangProvider.js';
import { useAuth } from './AuthProvider.js';
import { Brand } from '../ui/index.js';

const LANGS: { code: Language; native: string; english: string }[] = [
  { code: 'en', native: 'English', english: '' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
];

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
      <div className="screen-body" style={{ paddingTop: 24 }}>
        <Brand />
        <div className="spacer" />
        <h1 className="t-display" style={{ whiteSpace: 'pre-line' }}>
          {t('welcomeTitle')}
        </h1>
        <p className="muted">{t('welcomeBody')}</p>
        <div className="stack" style={{ marginTop: 16 }}>
          <span className="t-label">{t('language')}</span>
          <div className="card flush" role="radiogroup" aria-label={t('language')}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                role="radio"
                aria-checked={lang === l.code}
                className="list-row"
                style={lang === l.code ? { background: 'var(--accent-soft)' } : undefined}
                onClick={() => setLang(l.code)}
              >
                <span className="grow t-strong" lang={l.code}>
                  {l.native}
                </span>
                {l.english && <span className="t-caption faint">{l.english}</span>}
                <span className="radio-dot" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="stack" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-primary" onClick={() => start('worker')}>
            {t('getStarted')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => start('employer')}>
            {t('iManage')}
          </button>
        </div>
      </div>
    </main>
  );
};
