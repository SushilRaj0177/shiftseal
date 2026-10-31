import React, { useState } from 'react';
import { api, errorMessage } from '../lib/api.js';
import { useLang } from '../i18n/LangProvider.js';
import { Composer } from '../components/Composer.js';
import { Icon } from '../components/Icon.js';
import { FormHead, Notice, Sealed, Tile } from '../ui/index.js';
import { TabBar, useWorker } from './WorkerApp.js';

interface Preview {
  preview: {
    cleanText: string;
    cleanTextEnglish: string;
    removed: string[];
    themes: string[];
    sentiment: number;
  };
}

export const SpeakUp: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview, reload } = useWorker();
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Preview['preview'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const clean = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      setPreview(
        (
          await api<Preview>(`/workplaces/${wp.id}/ai/feedback-preview`, {
            body: { lang, ...body },
          })
        ).preview
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      await api(`/workplaces/${wp.id}/feedback`, { body: preview });
      setSent(true);
      setPreview(null);
      setText('');
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const g = overview?.feedbackGroup;

  if (sent)
    return (
      <main className="screen has-tabs">
        <div className="screen-body">
          <div className="spacer" />
          <Sealed
            title={t('sentAnon')}
            action={
              <button type="button" className="btn btn-primary" onClick={() => setSent(false)}>
                {t('done')}
              </button>
            }
          >
            {g ? t('groupProgress', Math.min(g.count, g.threshold), g.threshold) : null}
          </Sealed>
          <div className="spacer" />
        </div>
        <TabBar />
      </main>
    );

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <FormHead icon="chat" tone="voice" title={t('speakTitle')}>
          {t('speakBody')}
        </FormHead>
        <ol className="promise">
          {(
            [
              ['eye', 'privacy1', 'privacy1b'],
              ['lock', 'privacy2', 'privacy2b'],
              ['users', 'privacy3', 'privacy3b'],
            ] as const
          ).map(([icon, a, b]) => (
            <li key={a}>
              <Tile icon={icon} small />
              <span className="stack-sm" style={{ gap: 2 }}>
                <span className="t-strong">{t(a)}</span>
                <span className="t-caption muted">{t(b)}</span>
              </span>
            </li>
          ))}
        </ol>
        {g && (
          <div
            className="group-meter"
            aria-label={t('groupProgress', Math.min(g.count, g.threshold), g.threshold)}
          >
            <span className="group-dots" aria-hidden="true">
              {Array.from({ length: g.threshold }, (_, i) => (
                <i key={i} className={i < g.count ? 'on' : ''} />
              ))}
            </span>
            <span className="t-caption muted">
              {t('groupProgress', Math.min(g.count, g.threshold), g.threshold)}
            </span>
          </div>
        )}
        <h2 className="step">
          <span className="grow">{t('whatsOnMind')}</span>
        </h2>
        {!preview ? (
          <Composer
            value={text}
            onChange={setText}
            label={t('whatsOnMind')}
            submitLabel={t('continue')}
            busy={busy}
            onSubmit={(v) => void clean({ text: v })}
            onVoice={(b64, mime) => void clean({ audioBase64: b64, audioMimeType: mime })}
          />
        ) : (
          <section className="card quote-slip">
            <span className="t-label">{t('willBeSaved')}</span>
            <blockquote className="t-note">{preview.cleanText}</blockquote>
            <button
              type="button"
              className="link-btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setPreview(null)}
            >
              <Icon name="pencil" size={16} />
              {t('edit')}
            </button>
          </section>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        {preview && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={send}>
            {busy ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon name="lock" size={18} />
            )}
            {t('sendAnon')}
          </button>
        )}
      </div>
      <TabBar />
    </main>
  );
};
