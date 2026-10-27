import React, { useState } from 'react';
import type {
  Language,
  WorkerProfile,
  Workplace,
  HazardReport,
  HazardType,
  SeverityLevel,
} from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import { HoldToTalk } from '../components/HoldToTalk.js';

interface WorkerReportProps {
  lang: Language;
  worker: WorkerProfile;
  workplace: Workplace;
  hazards: HazardReport[];
  onRefresh: () => void;
}

const HINDI_CAMPUS_HAZARD_SAMPLE =
  'हॉस्टल ब्लॉक A में बिजली का तार खुला लटक रहा है';

export const WorkerReport: React.FC<WorkerReportProps> = ({
  lang,
  worker,
  workplace,
  hazards,
  onRefresh,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState(workplace.zones[0]?.id || '');
  const [text, setText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [draftHazard, setDraftHazard] = useState<{
    hazardType: HazardType;
    description: string;
    englishSummary: string;
    aiSeverity: SeverityLevel;
    finalSeverity: SeverityLevel;
    floorApplied: boolean;
    detectedLanguage: Language;
    isDemoFallback: boolean;
  } | null>(null);

  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 640;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          const b64 = dataUrl.split(',')[1] || '';
          const approxKb = Math.round((b64.length * 0.75) / 1024);
          setPhotoBase64(b64);
          setPhotoSizeKb(approxKb);
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const runStructureHazard = async (payload: {
    text?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setLoading(true);
    setSubmittedNotice(null);
    try {
      const res = await fetch('/api/ai/hazard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workplaceId: workplace.id,
          zoneId: selectedZoneId,
          lang,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftHazard({
          hazardType: data.structuredHazard.hazardType,
          description: data.structuredHazard.description,
          englishSummary: data.structuredHazard.englishSummary,
          aiSeverity: data.structuredHazard.aiSeverity,
          finalSeverity: data.severityEvaluation.finalSeverity,
          floorApplied: data.severityEvaluation.floorApplied,
          detectedLanguage: data.structuredHazard.detectedLanguage,
          isDemoFallback: Boolean(data.structuredHazard.isDemoFallback),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHazard = async () => {
    if (!draftHazard) return;
    setLoading(true);
    try {
      const res = await fetch('/api/worker/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workplaceId: workplace.id,
          zoneId: selectedZoneId,
          workerId: worker.id,
          hazardType: draftHazard.hazardType,
          description: draftHazard.description,
          englishSummary: draftHazard.englishSummary,
          aiSeverity: draftHazard.aiSeverity,
          detectedLanguage: draftHazard.detectedLanguage,
          photoBase64,
          isDemoFallback: draftHazard.isDemoFallback,
        }),
      });
      if (res.ok) {
        setSubmittedNotice('✓ Hazard report sent to site safety queue with SLA countdown.');
        setDraftHazard(null);
        setText('');
        setPhotoBase64(undefined);
        setPhotoSizeKb(null);
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <section className="card" aria-labelledby="report-hazard-heading">
        <h3 id="report-hazard-heading">⚠️ {t(lang, 'reportHazardTitle')}</h3>

        <p style={{ fontSize: '13px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
          {t(lang, 'selectZone')}
        </p>

        <div
          role="group"
          aria-label="Workplace zones"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          {workplace.zones.map((z) => {
            const active = z.id === selectedZoneId;
            return (
              <button
                key={z.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedZoneId(z.id)}
                className={active ? 'btn-primary' : 'btn-subtle'}
                style={{
                  justifyContent: 'flex-start',
                  padding: '10px 12px',
                  fontSize: '13px',
                }}
              >
                <span aria-hidden="true">{z.icon}</span>
                <span>{lang === 'ta' ? z.nameTa : lang === 'hi' ? z.nameHi : z.name}</span>
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          {t(lang, 'describeHazard')}
        </p>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
            {t(lang, 'samplePromptLabel')}
          </span>
          <button
            type="button"
            className="btn-subtle"
            disabled={loading}
            onClick={() => {
              const hostelZone = workplace.zones.find((z) => z.id === 'z-hostel-a');
              if (hostelZone) setSelectedZoneId(hostelZone.id);
              setText(HINDI_CAMPUS_HAZARD_SAMPLE);
              runStructureHazard({ text: HINDI_CAMPUS_HAZARD_SAMPLE });
            }}
            style={{ textAlign: 'left', fontSize: '13px', width: '100%', justifyContent: 'flex-start' }}
          >
            <span>🇮🇳 हिंदी sample:</span>
            <span style={{ fontWeight: 400 }}>"{HINDI_CAMPUS_HAZARD_SAMPLE}"</span>
          </button>
        </div>

        <HoldToTalk
          lang={lang}
          disabled={loading}
          onRecorded={(audioBase64, audioMimeType) =>
            runStructureHazard({ audioBase64, audioMimeType })
          }
        />

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <label htmlFor="hazard-text-input" className="sr-only">
            {t(lang, 'describeHazard')}
          </label>
          <input
            id="hazard-text-input"
            aria-label={t(lang, 'describeHazard')}
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
            onClick={() => runStructureHazard({ text: text.trim() })}
          >
            Check
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label
            htmlFor="hazard-photo-input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            📷 Optional photo (compressed &lt;300 KB on phone)
          </label>
          <input
            id="hazard-photo-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}
          />
          {photoSizeKb !== null && (
            <span style={{ fontSize: '12px', color: 'var(--good)', display: 'block', marginTop: '4px' }}>
              ✓ Compressed on phone to {photoSizeKb} KB (only description stored on server).
            </span>
          )}
        </div>

        {loading && <div className="skeleton" style={{ height: '100px', marginTop: '12px' }} />}

        {draftHazard && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <span className="badge badge-danger">
                Severity: {draftHazard.finalSeverity.toUpperCase()}
              </span>
              {draftHazard.floorApplied && (
                <span className="badge badge-warning">⚖️ {t(lang, 'severityFloorNote')}</span>
              )}
              {draftHazard.isDemoFallback && (
                <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
              )}
            </div>

            <div>
              <label htmlFor="hazard-type-select" style={{ fontSize: '12px', display: 'block' }}>
                Hazard Category
              </label>
              <input
                id="hazard-type-select"
                type="text"
                value={draftHazard.hazardType}
                onChange={(e) =>
                  setDraftHazard({ ...draftHazard, hazardType: e.target.value as HazardType })
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                }}
              />
            </div>

            <div>
              <label htmlFor="hazard-summary-edit" style={{ fontSize: '12px', display: 'block' }}>
                Summary understood
              </label>
              <input
                id="hazard-summary-edit"
                type="text"
                value={draftHazard.englishSummary}
                onChange={(e) =>
                  setDraftHazard({ ...draftHazard, englishSummary: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                }}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={handleConfirmHazard}
            >
              ✓ {t(lang, 'confirmAndSubmit')}
            </button>
          </div>
        )}

        {submittedNotice && (
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
            {submittedNotice}
          </div>
        )}
      </section>

      {/* Status Tracking */}
      <section className="card" aria-labelledby="hazard-status-heading">
        <h3 id="hazard-status-heading">Reported Hazards & Status Tracking</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {hazards.map((h) => (
            <div
              key={h.id}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong>
                  {h.zoneName} · {h.hazardType.replace(/_/g, ' ')}
                </strong>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {h.isDemoFallback && (
                    <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
                  )}
                  <span
                    className={
                      h.finalSeverity === 'critical' || h.finalSeverity === 'high'
                        ? 'badge badge-danger'
                        : 'badge badge-warning'
                    }
                  >
                    {h.finalSeverity.toUpperCase()}
                  </span>
                  <span
                    className={
                      h.status === 'resolved'
                        ? 'badge badge-good'
                        : h.status === 'acknowledged'
                          ? 'badge badge-accent'
                          : 'badge badge-warning'
                    }
                  >
                    {h.status}
                  </span>
                </div>
              </div>
              <p style={{ marginTop: '6px' }}>{h.description}</p>
              <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                Received: {h.createdAt.slice(0, 16).replace('T', ' ')}
                {h.acknowledgedAt && ` · Acknowledged: ${h.acknowledgedAt.slice(11, 16)}`}
                {h.resolvedAt && ` · Resolved: ${h.resolvedAt.slice(11, 16)}`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
