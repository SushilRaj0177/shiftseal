import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { useLang } from '../i18n/LangProvider.js';
import { useAuth } from '../auth/AuthProvider.js';
import { AppBar, Card, Field, Kv, LanguagePicker, Notice } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

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
        <LanguagePicker value={lang} onChange={choose} label={t('language')} />
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
        <StudentCard />
        <Link className="btn btn-secondary" to={`/w/${wp.id}/complaints`}>
          {t('complaintEntry')}
        </Link>
        {me.icMember && (
          <Link className="btn btn-secondary" to={`/w/${wp.id}/committee`}>
            {t('committeeInbox')}
          </Link>
        )}
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

type StudentKind = 'none' | 'student' | 'international';

/**
 * Studies and age travel with the person, not the workplace: a student visa
 * caps all their jobs together, and the under-18 rules follow their age.
 */
const StudentCard: React.FC = () => {
  const { t, tx } = useLang();
  const { overview, reload } = useWorker();
  const saved = overview?.student ?? {};
  const [kind, setKind] = useState<StudentKind>(saved.student ?? 'none');
  const [breakUntil, setBreakUntil] = useState(saved.breakUntil ?? '');
  const [birthDate, setBirthDate] = useState(saved.birthDate ?? '');
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const save = async () => {
    setStatus('busy');
    try {
      await api('/me', {
        method: 'PATCH',
        body: {
          student: kind === 'none' ? null : kind,
          breakUntil: kind !== 'none' && breakUntil ? breakUntil : null,
          birthDate: birthDate || null,
        },
      });
      await reload();
      setStatus('saved');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    }
  };

  return (
    <Card>
      <h2 className="t-headline">{t('studentTitle')}</h2>
      <div className="stack-sm" role="radiogroup" aria-label={t('studentTitle')}>
        {(
          [
            ['none', 'studentNone'],
            ['student', 'studentYes'],
            ['international', 'studentIntl'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            className="choice"
            onClick={() => {
              setKind(k);
              setStatus('idle');
            }}
          >
            <span className="t-strong">{t(label)}</span>
          </button>
        ))}
      </div>
      {kind === 'international' && <p className="t-caption muted">{t('studentAllJobs')}</p>}
      {kind !== 'none' && (
        <Field label={t('studentBreak')} hint={t('studentBreakHint')}>
          <input
            className="input"
            type="date"
            value={breakUntil}
            onChange={(e) => {
              setBreakUntil(e.target.value);
              setStatus('idle');
            }}
          />
        </Field>
      )}
      <Field label={t('birthDate')} hint={t('birthDateHint')}>
        <input
          className="input"
          type="date"
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            setBirthDate(e.target.value);
            setStatus('idle');
          }}
        />
      </Field>
      <p className="t-note muted">{tx('studentRule')}</p>
      {status === 'error' && <Notice kind="error">{error}</Notice>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={status === 'busy'}
        onClick={() => void save()}
      >
        {status === 'saved' ? t('studentSaved') : t('studentSave')}
      </button>
    </Card>
  );
};
