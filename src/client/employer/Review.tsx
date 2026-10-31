import { toast } from '../ui/toast.js';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HazardReport, OvertimeClaim } from '../../shared/types.js';
import type { FlagRecord } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { compressPhoto } from '../lib/photo.js';
import { dayLabel, initials, timeAgo } from '../lib/format.js';
import { baseOf, localeOf } from '../../shared/languages.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { AuthImage, Card, Empty, Field, Notice, Pill, Sheet, Skeleton, Tile } from '../ui/index.js';
import { flagTitle, flagTone, SEV_KEY } from './Overview.js';

const HAZARD_STATUS: Record<string, StringKey> = {
  received: 'eHazardReceived',
  acknowledged: 'eHazardHandling',
  resolved: 'eHazardFixed',
};

const FLAG_SEV: Record<string, StringKey> = {
  serious: 'eSerious',
  review: 'eReview',
  info: 'eInfo',
};
import { PageHead, useEmployer } from './EmployerApp.js';

type Tab = 'claims' | 'hazards' | 'flags';

export const Review: React.FC = () => {
  const { base, dash, reload } = useEmployer();
  const { t, tx, lang } = useLang();
  const en = baseOf(lang) === 'en';
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'claims';
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [claim, setClaim] = useState<OvertimeClaim | null>(null);
  const [hazard, setHazard] = useState<HazardReport | null>(null);
  const [flag, setFlag] = useState<FlagRecord | null>(null);
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!dash) return <Skeleton height={300} />;
  const wp = base.workplace.id;
  const me = base.member;
  const nameOf = (uid?: string) =>
    dash.people.find((p) => p.uid === uid)?.name ?? (uid === me.uid ? me.name : t('eSomeone'));

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      setMsg(null);
      toast(ok);
      setClaim(null);
      setHazard(null);
      setFlag(null);
      setReason('');
      setPhoto(null);
      await reload();
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const openClaims = dash.claims.filter((c) => c.resolutionStatus === 'pending');
  const openHazards = dash.hazards.filter((h) => h.status !== 'resolved');
  const openFlags = dash.flags.filter((f) => f.status === 'open');

  return (
    <>
      <PageHead title={t('eNavReview')} />
      <div className="segmented" role="group" style={{ maxWidth: 480 }}>
        {(
          [
            ['claims', `${t('eClaims')} (${openClaims.length})`],
            ['hazards', `${t('eHazards')} (${openHazards.length})`],
            ['flags', `${t('eFlags')} (${openFlags.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => setParams({ tab: k })}
          >
            {label}
          </button>
        ))}
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {tab === 'claims' && (
        <Card flush>
          {dash.claims.length === 0 && <Empty icon="clock">{t('eNoClaims')}</Empty>}
          {dash.claims.map((c) => (
            <button
              key={c.id}
              type="button"
              className="list-row"
              onClick={() => setClaim(c)}
              disabled={c.resolutionStatus !== 'pending'}
            >
              <span className="avatar sm" aria-hidden="true">
                {initials(c.workerName)}
              </span>
              <span className="grow stack-sm" style={{ gap: 0 }}>
                <span className="t-strong">
                  {c.kind === 'edit_disagree'
                    ? t('eDisputedChange')
                    : t('eHoursOvertime', c.extraHours)}{' '}
                  · {c.workerName}
                </span>
                <span className="t-caption muted">
                  {dayLabel(c.date, lang)} · {c.reason.slice(0, 80)}
                </span>
              </span>
              <Pill
                tone={
                  c.matchStatus === 'supported'
                    ? 'good'
                    : c.matchStatus === 'partly_supported'
                      ? 'warn'
                      : 'neutral'
                }
              >
                {c.matchStatus === 'supported'
                  ? t('eSupported')
                  : c.matchStatus === 'partly_supported'
                    ? t('ePartly')
                    : t('eNotOnRecord')}
              </Pill>
              {c.resolutionStatus !== 'pending' && (
                <Pill>
                  {c.resolutionStatus === 'approved' ? t('statusApproved') : t('statusRejected')}
                </Pill>
              )}
            </button>
          ))}
        </Card>
      )}

      {tab === 'hazards' && (
        <Card flush>
          {dash.hazards.length === 0 && <Empty icon="alert">{t('eNoHazards')}</Empty>}
          {dash.hazards.map((h) => (
            <button key={h.id} type="button" className="list-row" onClick={() => setHazard(h)}>
              <Tile
                icon="alert"
                tone={
                  h.status === 'resolved'
                    ? 'good'
                    : h.finalSeverity === 'low'
                      ? 'neutral'
                      : h.finalSeverity === 'medium'
                        ? 'warn'
                        : 'danger'
                }
              />
              <span className="grow stack-sm" style={{ gap: 0 }}>
                <span className="t-strong">
                  {h.zoneName} · {tx(`hz_${h.hazardType}`) || h.hazardType}
                </span>
                <span className="t-caption muted">
                  {(en ? h.englishSummary : h.description).slice(0, 90)} ·{' '}
                  {timeAgo(h.createdAt, lang)}
                </span>
              </span>
              <Pill
                tone={
                  h.finalSeverity === 'low'
                    ? 'neutral'
                    : h.finalSeverity === 'medium'
                      ? 'warn'
                      : 'danger'
                }
              >
                {t(SEV_KEY[h.finalSeverity])}
              </Pill>
              <Pill tone={h.status === 'resolved' ? 'good' : h.fixDisputed ? 'danger' : 'neutral'}>
                {h.fixDisputed ? t('eFixDisputed') : t(HAZARD_STATUS[h.status])}
              </Pill>
            </button>
          ))}
        </Card>
      )}

      {tab === 'flags' && (
        <>
          <p className="muted">{t('eFlagsIntro')}</p>
          <Card flush>
            {dash.flags.length === 0 && <Empty icon="flag">{t('eNoFlags')}</Empty>}
            {dash.flags.map((f) => (
              <button
                key={f.id}
                type="button"
                className="list-row"
                onClick={() => setFlag(f)}
                disabled={f.status !== 'open'}
              >
                <Tile
                  icon="flag"
                  tone={
                    f.status !== 'open' ? 'neutral' : f.severity === 'serious' ? 'danger' : 'warn'
                  }
                />
                <span className="grow stack-sm" style={{ gap: 0 }}>
                  <span className="t-strong">
                    {flagTitle(f.code, tx)} ·{' '}
                    {f.subject.kind === 'supervisor'
                      ? nameOf(f.subject.id)
                      : nameOf(f.subject.workerUid)}
                  </span>
                  <span className="t-caption muted">
                    {en ? f.message : timeAgo(f.createdAt, lang)}
                  </span>
                </span>
                <Pill tone={f.concerns === 'employer' ? 'accent' : 'neutral'}>
                  {f.concerns === 'employer' ? t('eAboutUs') : t('eAboutWorker')}
                </Pill>
                <Pill tone={f.status === 'open' ? flagTone(f) : 'neutral'}>
                  {f.status === 'open' ? t(FLAG_SEV[f.severity]) : t('eResolved')}
                </Pill>
              </button>
            ))}
          </Card>
        </>
      )}

      {claim && (
        <Sheet
          title={`${claim.workerName}: ${claim.kind === 'edit_disagree' ? t('eDisputedChange') : t('eOvertimeClaim')}`}
          onClose={() => setClaim(null)}
        >
          <Card tone={claim.matchStatus === 'supported' ? 'good' : 'subtle'}>
            <span className="t-strong">
              {claim.matchStatus === 'supported' ? t('eRecordsSupport') : t('eRecordsDoNot')}
            </span>
            {en && <span className="t-caption">{claim.evidence.explanation}</span>}
          </Card>
          <p className="t-caption muted">“{claim.reason}”</p>
          <Field label={t('eYourReason')}>
            <textarea
              className="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="grid-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || reason.trim().length < 3}
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp}/claims/resolve`, {
                      body: { claimId: claim.id, decision: 'rejected', reason },
                    }),
                  t('eRejectedDone')
                )
              }
            >
              {t('eReject')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || reason.trim().length < 3}
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp}/claims/resolve`, {
                      body: { claimId: claim.id, decision: 'approved', reason },
                    }),
                  t('eApprovedDone')
                )
              }
            >
              {t('eApprove')}
            </button>
          </div>
        </Sheet>
      )}

      {hazard && (
        <Sheet
          title={`${hazard.zoneName}: ${tx(`hz_${hazard.hazardType}`) || hazard.hazardType}`}
          onClose={() => setHazard(null)}
        >
          <p>{hazard.description}</p>
          {!en || hazard.description === hazard.englishSummary ? null : (
            <p className="t-caption muted">{hazard.englishSummary}</p>
          )}
          {hazard.photoId && (
            <AuthImage
              path={`/workplaces/${wp}/photos/${hazard.photoId}`}
              alt={t('eHazardPhoto')}
            />
          )}
          <span className="t-caption muted">
            {t('eSeverity', t(SEV_KEY[hazard.finalSeverity]))}
            {hazard.floorApplied ? ` (${t('eFloorRaised')})` : ''} ·{' '}
            {t('eRespondBy', new Date(hazard.deadlineAt).toLocaleString(localeOf(lang)))}
          </span>
          {hazard.status === 'received' && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp}/hazards/status`, {
                      body: { hazardId: hazard.id, status: 'acknowledged' },
                    }),
                  t('eHandlingDone')
                )
              }
            >
              {t('eMarkHandling')}
            </button>
          )}
          {hazard.status !== 'resolved' && (
            <>
              <Field label={t('eFixPhoto')}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhoto(await compressPhoto(f));
                  }}
                />
              </Field>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      api(`/workplaces/${wp}/hazards/status`, {
                        body: {
                          hazardId: hazard.id,
                          status: 'resolved',
                          photo: photo
                            ? {
                                dataUrl: photo,
                                takenAt: new Date().toISOString(),
                                source: 'camera',
                              }
                            : undefined,
                        },
                      }),
                    t('eFixedDone')
                  )
                }
              >
                {t('eMarkFixed')}
              </button>
            </>
          )}
        </Sheet>
      )}

      {flag && (
        <Sheet title={flagTitle(flag.code, tx)} onClose={() => setFlag(null)}>
          <p>{en ? flag.message : tx(`flag_${flag.code}`) || flagTitle(flag.code, tx)}</p>
          <Card tone="subtle">
            {Object.entries(flag.facts).map(([k, v]) => (
              <div key={k} className="kv">
                <span>{k}</span>
                <span>{String(v)}</span>
              </div>
            ))}
          </Card>
          <Field label={t('eWhatYouFound')}>
            <textarea
              className="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="grid-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || reason.trim().length < 3}
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp}/flags/resolve`, {
                      body: { flagId: flag.id, status: 'dismissed', resolution: reason },
                    }),
                  t('eDismissedDone')
                )
              }
            >
              {t('eDismiss')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || reason.trim().length < 3}
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp}/flags/resolve`, {
                      body: { flagId: flag.id, status: 'resolved', resolution: reason },
                    }),
                  t('eResolvedDone')
                )
              }
            >
              {t('eMarkResolved')}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
};
