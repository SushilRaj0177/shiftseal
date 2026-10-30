import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { api } from '../lib/api.js';
import { useLang } from '../i18n/LangProvider.js';
import { useAuth } from '../auth/AuthProvider.js';
import { AppBar, Card, Kv } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

const LANGS: [Language, string][] = [
  ['en', 'English'],
  ['ta', 'தமிழ்'],
  ['hi', 'हिन्दी'],
];

export const Settings: React.FC = () => {
  const { t, lang, setLang } = useLang();
  const { user, signOut } = useAuth();
  const { wp, me, deviceStatus } = useWorker();
  const navigate = useNavigate();

  const choose = (l: Language) => {
    setLang(l);
    void api('/me', { method: 'PATCH', body: { language: l } }).catch(() => undefined);
  };

  return (
    <main className="screen">
      <AppBar back={`/w/${wp.id}`} title={t('settings')} />
      <div className="screen-body">
        <span className="t-label">{t('language')}</span>
        <div className="segmented" role="group" aria-label={t('language')}>
          {LANGS.map(([code, label]) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => choose(code)}
              lang={code}
            >
              {label}
            </button>
          ))}
        </div>
        <Card>
          <Kv k={t('workplace')} v={wp.name} />
          <Kv k={t('yourName')} v={me.name} />
          {user?.phone && <Kv k={t('phoneLabel')} v={user.phone} />}
          <Kv
            k={t('thisPhone')}
            v={deviceStatus === 'pending' ? t('phonePending') : t('phoneApproved')}
            vClass={deviceStatus === 'pending' ? 'c-warn' : 'c-good'}
          />
        </Card>
        <div className="spacer" />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={async () => {
            await signOut();
            navigate('/welcome', { replace: true });
          }}
        >
          {t('signOut')}
        </button>
      </div>
    </main>
  );
};
