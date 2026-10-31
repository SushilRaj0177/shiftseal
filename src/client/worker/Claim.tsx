import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { useLang } from '../i18n/LangProvider.js';
import { Composer } from '../components/Composer.js';
import { AppBar, Card, Field, FormHead, Notice, Sealed, Spinner } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

interface Understood {
  structuredClaim: {
    date: string;
    extraHours: number;
    reason: string;
    detectedLanguage: Language;
    confidence: number;
  };
  matchResult: {
    status: 'supported' | 'partly_supported' | 'unsupported';
    evidence: { explanation: string };
  };
}

export const Claim: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview, reload } = useWorker();
  const [text, setText] = useState('');
  const [result, setResult] = useState<Understood | null>(null);
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const understand = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<Understood>(`/workplaces/${wp.id}/ai/claim`, { body: { lang, ...body } });
      setResult(r);
      setDate(r.structuredClaim.date);
      setHours(String(r.structuredClaim.extraHours));
      setReason(r.structuredClaim.reason);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/workplaces/${wp.id}/claims`, {
        body: {
          date,
          extraHours: Number(hours),
          reason,
          detectedLanguage: result?.structuredClaim.detectedLanguage ?? lang,
        },
      });
      setSent(true);
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <main className="screen">
        <div className="screen-body">
          <div className="spacer" />
          <Sealed
            title={t('claimSent')}
            action={
              <Link className="btn btn-primary" to={`/w/${wp.id}/pay`}>
                {t('done')}
              </Link>
            }
          />
          <div className="spacer" />
        </div>
      </main>
    );

  const tone =
    result?.matchResult.status === 'supported'
      ? 'good'
      : result?.matchResult.status === 'partly_supported'
        ? 'warn'
        : 'subtle';

  return (
    <main className="screen">
      <AppBar back={`/w/${wp.id}/pay`} />
      <div className="screen-body">
        <FormHead icon="clock" tone="pay" title={t('claimTitle')}>
          {t('claimBody')}
        </FormHead>
        {overview?.overtime === 'comp_off' && <Notice kind="info">{t('compOffNote')}</Notice>}
        {!result && (
          <Composer
            value={text}
            onChange={setText}
            label={t('typeInstead')}
            placeholder={t('typeInstead')}
            submitLabel={t('understand')}
            busy={busy}
            onSubmit={(v) => void understand({ text: v })}
            onVoice={(b64, mime) => void understand({ audioBase64: b64, audioMimeType: mime })}
          />
        )}
        {busy && result && <Spinner label={t('loading')} />}
        {result && (
          <>
            <Card>
              <span className="t-label">{t('weUnderstood')}</span>
              {result.structuredClaim.confidence < 0.6 && (
                <Notice kind="warn">{t('pleaseCheck')}</Notice>
              )}
              <div className="grid-2">
                <Field label={t('date')}>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    max={overview?.today}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Field>
                <Field label={t('extraHours')}>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={hours}
                    onChange={(e) => setHours(e.target.value.replace(/[^\d.]/g, ''))}
                  />
                </Field>
              </div>
              <Field label={t('reasonLabel')}>
                <input
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
            </Card>
            <Card tone={tone}>
              <span
                className={`t-strong ${tone === 'good' ? 'c-good' : tone === 'warn' ? 'c-warn' : ''}`}
              >
                {result.matchResult.status === 'supported'
                  ? t('supported')
                  : result.matchResult.status === 'partly_supported'
                    ? t('partlySupported')
                    : t('unsupported')}
              </span>
              <span className="t-caption muted">{result.matchResult.evidence.explanation}</span>
            </Card>
          </>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="spacer" />
        {result && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !date || !(Number(hours) > 0) || !reason.trim()}
            onClick={submit}
          >
            {t('sendClaim')}
          </button>
        )}
      </div>
    </main>
  );
};
