import React, { useState } from 'react';
import type {
  Language,
  WorkerProfile,
  Workplace,
  RemovedPiiCategory,
  FeedbackTheme,
} from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import { HoldToTalk } from '../components/HoldToTalk.js';

interface WorkerSpeakUpProps {
  lang: Language;
  worker: WorkerProfile;
  workplace: Workplace;
  feedbackGroupStatus: {
    team: string;
    count: number;
    threshold: number;
    visible: boolean;
    statusMessage: string;
  };
  onRefresh: () => void;
}

const ENGLISH_FEEDBACK_SAMPLE =
  'Supervisor Ravi shouted at me near Gate 2 at 7:15 PM when I asked why my Tuesday overtime hours were reduced.';

export const WorkerSpeakUp: React.FC<WorkerSpeakUpProps> = ({
  lang,
  worker,
  workplace,
  feedbackGroupStatus,
  onRefresh,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    cleanText: string;
    cleanTextEnglish: string;
    removed: RemovedPiiCategory[];
    themes: FeedbackTheme[];
    sentiment: number;
    isDemoFallback: boolean;
  } | null>(null);
  const [sentDone, setSentDone] = useState(false);

  const runPreview = async (payload: {
    text?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setLoading(true);
    setSentDone(false);
    try {
      const res = await fetch('/api/ai/feedback-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workplaceId: workplace.id,
          team: worker.team,
          lang,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data.preview);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnonymously = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch('/api/worker/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workplaceId: workplace.id,
          team: worker.team,
          cleanText: preview.cleanText,
          cleanTextEnglish: preview.cleanTextEnglish,
          removed: preview.removed,
          themes: preview.themes,
          sentiment: preview.sentiment,
        }),
      });
      if (res.ok) {
        setSentDone(true);
        setPreview(null);
        setText('');
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.min(100, Math.round((feedbackGroupStatus.count / feedbackGroupStatus.threshold) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="card" aria-labelledby="speak-up-heading">
        <h3 id="speak-up-heading">🛡️ {t(lang, 'speakUpTitle')}</h3>
        <p
          style={{
            marginTop: '6px',
            padding: '10px 12px',
            background: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          🔒 {t(lang, 'privacyGuarantee')}
        </p>

        {/* Anonymity Group Threshold Progress Bar */}
        <div style={{ marginTop: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span>Group: <strong>{feedbackGroupStatus.team}</strong></span>
            <strong>
              {feedbackGroupStatus.count}/{feedbackGroupStatus.threshold} responses
            </strong>
          </div>
          <div
            role="progressbar"
            aria-valuenow={feedbackGroupStatus.count}
            aria-valuemin={0}
            aria-valuemax={feedbackGroupStatus.threshold}
            style={{
              height: '10px',
              background: 'var(--surface-subtle)',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: feedbackGroupStatus.visible ? 'var(--good)' : 'var(--accent)',
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '6px' }}>
            {t(lang, 'anonymityThresholdNote')} ({feedbackGroupStatus.count}/
            {feedbackGroupStatus.threshold} {t(lang, 'anonymityGroupProgress')})
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
            {t(lang, 'samplePromptLabel')}
          </span>
          <button
            type="button"
            className="btn-subtle"
            disabled={loading}
            onClick={() => {
              setText(ENGLISH_FEEDBACK_SAMPLE);
              runPreview({ text: ENGLISH_FEEDBACK_SAMPLE });
            }}
            style={{ textAlign: 'left', fontSize: '13px', width: '100%', justifyContent: 'flex-start' }}
          >
            <span>{t(lang, 'piiScrubSampleLabel')}</span>
            <span style={{ fontWeight: 400 }}>"{ENGLISH_FEEDBACK_SAMPLE}"</span>
          </button>
        </div>

        <HoldToTalk
          lang={lang}
          disabled={loading}
          onRecorded={(audioBase64, audioMimeType) =>
            runPreview({ audioBase64, audioMimeType })
          }
        />

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <label htmlFor="speakup-input" className="sr-only">
            {t(lang, 'speakUpTitle')}
          </label>
          <input
            id="speakup-input"
            aria-label={t(lang, 'speakUpTitle')}
            type="text"
            placeholder={t(lang, 'orTypeHere')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              minHeight: '46px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
            }}
          />
          <button
            type="button"
            className="btn-subtle"
            disabled={loading || !text.trim()}
            onClick={() => runPreview({ text: text.trim() })}
          >
            {t(lang, 'previewButton')}
          </button>
        </div>

        {loading && <div className="skeleton" style={{ height: '100px', marginTop: '12px' }} />}

        {preview && (
          <div
            aria-live="polite"
            style={{
              marginTop: '14px',
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-subtle)',
              border: '1px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="badge badge-good">
                ✓ {t(lang, 'removedDetailsLabel')} {preview.removed.join(', ') || 'none'}
              </span>
              {preview.isDemoFallback && (
                <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
              )}
            </div>

            <div>
              <label htmlFor="cleaned-feedback-text" style={{ fontSize: '12px', display: 'block', fontWeight: 600 }}>
                {t(lang, 'cleanedAnonymousTextLabel')}
              </label>
              <textarea
                id="cleaned-feedback-text"
                rows={3}
                value={preview.cleanText}
                onChange={(e) =>
                  setPreview({
                    ...preview,
                    cleanText: e.target.value,
                    cleanTextEnglish: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                }}
              />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>
              🔒 {t(lang, 'privacyGuarantee')}
            </p>

            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={handleSendAnonymously}
            >
              🛡️ {t(lang, 'sendAnonymously')}
            </button>
          </div>
        )}

        {sentDone && (
          <div
            role="status"
            style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--good-soft)',
              color: 'var(--good)',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            ✓ Sent anonymously. Original input was discarded and never stored.
          </div>
        )}
      </section>
    </div>
  );
};
