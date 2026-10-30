import React, { useState } from 'react';
import { api, errorMessage } from '../lib/api.js';
import { useLang } from '../i18n/LangProvider.js';
import { HoldToTalk } from '../components/HoldToTalk.js';
import { Icon } from '../components/Icon.js';
import { Card, Notice, Spinner, Tile } from '../ui/index.js';
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

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="stack-sm" style={{ paddingTop: 8 }}>
          <h1 className="t-title">{t('speakTitle')}</h1>
          <span className="muted">{t('speakBody')}</span>
        </header>
        <Card>
          {(
            [
              ['eye', 'privacy1', 'privacy1b'],
              ['lock', 'privacy2', 'privacy2b'],
              ['users', 'privacy3', 'privacy3b'],
            ] as const
          ).map(([icon, a, b]) => (
            <div key={a} className="row-flex" style={{ alignItems: 'flex-start' }}>
              <Tile icon={icon} small />
              <div className="stack-sm">
                <span className="t-strong">{t(a)}</span>
                <span className="t-caption muted">{t(b)}</span>
              </div>
            </div>
          ))}
        </Card>
        {sent && <Notice kind="info">{t('sentAnon')}</Notice>}
        {!preview ? (
          <>
            <span className="t-label">{t('whatsOnMind')}</span>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) void clean({ text: text.trim() });
              }}
            >
              <textarea
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label={t('whatsOnMind')}
              />
              <button type="submit" className="btn btn-secondary" disabled={!text.trim() || busy}>
                {t('continue')}
              </button>
            </form>
            <HoldToTalk
              disabled={busy}
              onRecorded={(b64, mime) => clean({ audioBase64: b64, audioMimeType: mime })}
            />
          </>
        ) : (
          <Card tone="subtle">
            <span className="t-caption muted">{t('willBeSaved')}</span>
            <p>{preview.cleanText}</p>
            <button
              type="button"
              className="link-btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setPreview(null)}
            >
              {t('edit')}
            </button>
          </Card>
        )}
        {busy && <Spinner label={t('loading')} />}
        {error && <Notice kind="error">{error}</Notice>}
        {g && (
          <div className="row-flex t-caption muted">
            <Icon name="users" size={18} />
            {t('groupProgress', Math.min(g.count, g.threshold), g.threshold)}
          </div>
        )}
        {preview && (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={send}>
            {t('sendAnon')}
          </button>
        )}
      </div>
      <TabBar />
    </main>
  );
};
