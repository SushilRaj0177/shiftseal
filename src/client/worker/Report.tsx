import React, { useEffect, useRef, useState } from 'react';
import type { HazardType, Language, SeverityLevel } from '../../shared/types.js';
import type { LocationFix } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { compressPhoto } from '../lib/photo.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { Composer } from '../components/Composer.js';
import { Icon, zoneIcon } from '../components/Icon.js';
import { Link } from 'react-router-dom';
import { Card, FormHead, Notice, Pill, Sealed, Spinner, Step, Tile } from '../ui/index.js';
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
  const { t, tx, lang } = useLang();
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

  if (done)
    return (
      <main className="screen has-tabs">
        <div className="screen-body">
          <div className="spacer" />
          <Sealed
            title={done}
            action={
              <button type="button" className="btn btn-primary" onClick={() => setDone(null)}>
                {t('done')}
              </button>
            }
          />
          <div className="spacer" />
        </div>
        <TabBar />
      </main>
    );

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <FormHead icon="alert" tone="hazard" title={t('reportTitle')}>
          {t('reportBody')}
        </FormHead>

        {fixedForMe.slice(0, 1).map((h) => (
          <FixCheck key={h.id} hazardId={h.id} zoneName={h.zoneName} />
        ))}

        <Step n={1} title={t('where')} />
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

        <Step n={2} title={t('whatSaw')} />
        {!result ? (
          <Composer
            value={text}
            onChange={setText}
            label={t('describeHazard')}
            placeholder={t('describeHazard')}
            submitLabel={t('understand')}
            busy={busy}
            onSubmit={(v) => void understand({ text: v })}
            onVoice={(b64, mime) => void understand({ audioBase64: b64, audioMimeType: mime })}
          />
        ) : (
          <section className={`card hazard-slip sev-${sev?.finalSeverity ?? 'low'}`}>
            <div className="between">
              <span className="t-headline" style={{ textTransform: 'capitalize' }}>
                {tx(`hz_${result.structuredHazard.hazardType}`)}
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
            <p>{result.structuredHazard.description}</p>
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
              <Icon name="pencil" size={16} />
              {t('edit')}
            </button>
          </section>
        )}

        <Step n={3} title={t('takePhoto')} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void onPhoto(e.target.files?.[0])}
        />
        <button
          type="button"
          className={`photo-drop${photo ? ' has-photo' : ''}`}
          onClick={() => fileRef.current?.click()}
        >
          {photo ? (
            <>
              <img src={photo.dataUrl} alt="" width={72} height={72} />
              <span className="t-strong">{t('retake')}</span>
            </>
          ) : (
            <>
              <span className="photo-drop-icon" aria-hidden="true">
                <Icon name="camera" size={24} />
              </span>
              <span className="t-strong">{t('takePhoto')}</span>
            </>
          )}
        </button>

        {busy && result && <Spinner label={t('loading')} />}
        {error && <Notice kind="error">{error}</Notice>}
        <button type="button" className="btn btn-primary" disabled={!result || busy} onClick={send}>
          {t('sendReport')}
        </button>

        <Link
          to={`/w/${wp.id}/complaints`}
          className="card flush"
          style={{ textDecoration: 'none', color: 'inherit', marginTop: 8 }}
        >
          <span className="list-row">
            <Tile icon="lock" tone="neutral" />
            <span className="grow stack-sm" style={{ gap: 0 }}>
              <span className="t-strong">{t('complaintEntry')}</span>
              <span className="t-caption muted">{t('complaintEntrySub')}</span>
            </span>
            <Icon name="chev" size={18} />
          </span>
        </Link>
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
