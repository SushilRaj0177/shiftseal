import React, { useEffect, useRef, useState } from 'react';
import type { HazardType, Language, SeverityLevel } from '../../shared/types.js';
import type { LocationFix } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { compressPhoto } from '../lib/photo.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { HoldToTalk } from '../components/HoldToTalk.js';
import { Icon, zoneIcon } from '../components/Icon.js';
import { Card, Notice, Pill, Spinner } from '../ui/index.js';
import { TabBar, useWorker } from './WorkerApp.js';

interface Structured {
  structuredHazard: {
    hazardType: HazardType;
    description: string;
    englishSummary: string;
    aiSeverity: SeverityLevel;
    detectedLanguage: Language;
    isDemoFallback: boolean;
  };
  severityEvaluation: {
    finalSeverity: SeverityLevel;
    floorSeverity: SeverityLevel;
    floorApplied: boolean;
  };
}

const SEV_KEY: Record<SeverityLevel, StringKey> = {
  low: 'sevLow',
  medium: 'sevMedium',
  high: 'sevHigh',
  critical: 'sevCritical',
};

export const Report: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview, reload } = useWorker();
  const [zone, setZone] = useState(wp.zones[0]?.code ?? '');
  const [text, setText] = useState('');
  const [result, setResult] = useState<Structured | null>(null);
  const [photo, setPhoto] = useState<{ dataUrl: string; takenAt: string } | null>(null);
  const [fix, setFix] = useState<LocationFix | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getFix().then((r) => r.ok && setFix(r.fix));
  }, []);

  const understand = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      setResult(
        await api<Structured>(`/workplaces/${wp.id}/ai/hazard`, {
          body: { lang, zoneCode: zone, ...body },
        })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto({ dataUrl: await compressPhoto(file), takenAt: new Date().toISOString() });
    } catch {
      setError('Could not read that photo.');
    }
  };

  const send = async () => {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const s = result.structuredHazard;
      const res = await api<{ hazard: { deadlineAt: string }; merged: boolean }>(
        `/workplaces/${wp.id}/hazards`,
        {
          body: {
            zoneCode: zone,
            hazardType: s.hazardType,
            description: s.description,
            englishSummary: s.englishSummary,
            aiSeverity: s.aiSeverity,
            detectedLanguage: s.detectedLanguage,
            location: fix,
            photo: photo ? { ...photo, source: 'camera' } : undefined,
            aiUnavailable: s.isDemoFallback,
          },
        }
      );
      setDone(
        res.merged
          ? t('reportMerged')
          : t(
              'reportSent',
              new Date(res.hazard.deadlineAt).toLocaleString(undefined, {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            )
      );
      setResult(null);
      setText('');
      setPhoto(null);
      void reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const fixedForMe =
    overview?.hazards.filter((h) => h.status === 'resolved' && !h.fixDisputed) ?? [];
  const sev = result?.severityEvaluation;

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="stack-sm" style={{ paddingTop: 8 }}>
          <h1 className="t-title">{t('reportTitle')}</h1>
          <span className="muted">{t('reportBody')}</span>
        </header>
        {done && <Notice kind="info">{done}</Notice>}

        {fixedForMe.slice(0, 1).map((h) => (
          <FixCheck key={h.id} hazardId={h.id} zoneName={h.zoneName} />
        ))}

        <span className="t-label">{t('where')}</span>
        <div className="grid-2" role="radiogroup" aria-label={t('where')}>
          {wp.zones.map((z) => (
            <button
              key={z.code}
              type="button"
              role="radio"
              aria-checked={zone === z.code}
              className="choice"
              onClick={() => {
                setZone(z.code);
                setResult(null);
              }}
            >
              <Icon name={zoneIcon(z.kind || z.name)} />
              <span className="t-strong">{z.name}</span>
            </button>
          ))}
        </div>

        <span className="t-label">{t('whatSaw')}</span>
        {!result ? (
          <>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) void understand({ text: text.trim() });
              }}
            >
              <textarea
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('describeHazard')}
                aria-label={t('describeHazard')}
              />
              <button type="submit" className="btn btn-secondary" disabled={!text.trim() || busy}>
                {t('understand')}
              </button>
            </form>
            <HoldToTalk
              disabled={busy}
              onRecorded={(b64, mime) => understand({ audioBase64: b64, audioMimeType: mime })}
            />
          </>
        ) : (
          <Card>
            <div className="between">
              <span className="t-strong" style={{ textTransform: 'capitalize' }}>
                {result.structuredHazard.hazardType.replace(/_/g, ' ')}
              </span>
              {sev && (
                <Pill
                  tone={
                    sev.finalSeverity === 'low'
                      ? 'neutral'
                      : sev.finalSeverity === 'medium'
                        ? 'warn'
                        : 'danger'
                  }
                >
                  {t(SEV_KEY[sev.finalSeverity])}
                </Pill>
              )}
            </div>
            <p className="t-caption">{result.structuredHazard.description}</p>
            {sev?.floorApplied && (
              <span className="t-caption muted">
                {t('severityFloorNote', t(SEV_KEY[sev.floorSeverity]))}
              </span>
            )}
            <button
              type="button"
              className="link-btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setResult(null)}
            >
              {t('edit')}
            </button>
          </Card>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        {photo ? (
          <div className="row-flex">
            <img
              src={photo.dataUrl}
              alt=""
              width={64}
              height={64}
              style={{ borderRadius: 12, objectFit: 'cover' }}
            />
            <button type="button" className="link-btn" onClick={() => fileRef.current?.click()}>
              {t('retake')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="camera" />
            {t('takePhoto')}
          </button>
        )}

        {busy && <Spinner label={t('loading')} />}
        {error && <Notice kind="error">{error}</Notice>}
        <button type="button" className="btn btn-primary" disabled={!result || busy} onClick={send}>
          {t('sendReport')}
        </button>
      </div>
      <TabBar />
    </main>
  );
};

/** Asks the reporter whether a hazard marked fixed is really fixed. */
const FixCheck: React.FC<{ hazardId: string; zoneName: string }> = ({ hazardId, zoneName }) => {
  const { t } = useLang();
  const { wp, reload } = useWorker();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const notFixed = async () => {
    await api(`/workplaces/${wp.id}/hazards/dispute`, {
      body: { hazardId, note: 'Reporter says it is not fixed' },
    }).catch(() => undefined);
    setHidden(true);
    void reload();
  };
  return (
    <Card tone="subtle">
      <span className="t-strong">{t('fixedQuestion', zoneName)}</span>
      <div className="row-flex">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHidden(true)}>
          {t('done')}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={notFixed}>
          {t('notFixed')}
        </button>
      </div>
    </Card>
  );
};
