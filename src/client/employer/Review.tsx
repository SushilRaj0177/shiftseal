import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HazardReport, OvertimeClaim } from '../../shared/types.js';
import type { FlagRecord } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { compressPhoto } from '../lib/photo.js';
import { timeAgo } from '../lib/format.js';
import { AuthImage, Card, Empty, Field, Notice, Pill, Sheet, Skeleton } from '../ui/index.js';
import { FLAG_TITLES, flagTone } from './Overview.js';
import { useEmployer } from './EmployerApp.js';

type Tab = 'claims' | 'hazards' | 'flags';

export const Review: React.FC = () => {
  const { base, dash, reload } = useEmployer();
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
    dash.people.find((p) => p.uid === uid)?.name ?? (uid === me.uid ? me.name : 'Someone');

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      setMsg({ kind: 'info', text: ok });
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
      <h1 className="t-title">Review</h1>
      <div className="segmented" role="group" style={{ maxWidth: 480 }}>
        {(
          [
            ['claims', `Claims (${openClaims.length})`],
            ['hazards', `Hazards (${openHazards.length})`],
            ['flags', `Flags (${openFlags.length})`],
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
          {dash.claims.length === 0 && <Empty icon="clock">No claims.</Empty>}
          {dash.claims.map((c) => (
            <button
              key={c.id}
              type="button"
              className="list-row"
              onClick={() => setClaim(c)}
              disabled={c.resolutionStatus !== 'pending'}
            >
              <span className="grow stack-sm" style={{ gap: 0 }}>
                <span className="t-strong">
                  {c.kind === 'edit_disagree' ? 'Disputed change' : `${c.extraHours} h overtime`} ·{' '}
                  {c.workerName}
                </span>
                <span className="t-caption muted">
                  {c.date} · {c.reason.slice(0, 80)}
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
                  ? 'Records support it'
                  : c.matchStatus === 'partly_supported'
                    ? 'Partly supported'
                    : 'Not on record'}
              </Pill>
              {c.resolutionStatus !== 'pending' && <Pill>{c.resolutionStatus}</Pill>}
            </button>
          ))}
        </Card>
      )}

      {tab === 'hazards' && (
        <Card flush>
          {dash.hazards.length === 0 && <Empty icon="alert">No hazards reported.</Empty>}
          {dash.hazards.map((h) => (
            <button key={h.id} type="button" className="list-row" onClick={() => setHazard(h)}>
              <span className="grow stack-sm" style={{ gap: 0 }}>
                <span className="t-strong">
                  {h.zoneName} · {h.hazardType.replace(/_/g, ' ')}
                </span>
                <span className="t-caption muted">
                  {h.englishSummary.slice(0, 90)} · {timeAgo(h.createdAt)}
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
                {h.finalSeverity}
              </Pill>
              <Pill tone={h.status === 'resolved' ? 'good' : h.fixDisputed ? 'danger' : 'neutral'}>
                {h.fixDisputed ? 'fix disputed' : h.status}
              </Pill>
            </button>
          ))}
        </Card>
      )}

      {tab === 'flags' && (
        <>
          <p className="muted">
            Flags are places where a claim and the evidence disagree. They are for a person to look
            at; nothing is decided automatically. Flags that question the employer can only be
            closed by the owner.
          </p>
          <Card flush>
            {dash.flags.length === 0 && <Empty icon="flag">No flags.</Empty>}
            {dash.flags.map((f) => (
              <button
                key={f.id}
                type="button"
                className="list-row"
                onClick={() => setFlag(f)}
                disabled={f.status !== 'open'}
              >
                <span className="grow stack-sm" style={{ gap: 0 }}>
                  <span className="t-strong">
                    {FLAG_TITLES[f.code] ?? f.code} ·{' '}
                    {f.subject.kind === 'supervisor'
                      ? nameOf(f.subject.id)
                      : nameOf(f.subject.workerUid)}
                  </span>
                  <span className="t-caption muted">{f.message}</span>
                </span>
                <Pill tone={f.concerns === 'employer' ? 'accent' : 'neutral'}>
                  {f.concerns === 'employer' ? 'About us' : 'About worker'}
                </Pill>
                <Pill tone={f.status === 'open' ? flagTone(f) : 'neutral'}>
                  {f.status === 'open' ? f.severity : f.status}
                </Pill>
              </button>
            ))}
          </Card>
        </>
      )}

      {claim && (
        <Sheet
          title={`${claim.workerName}: ${claim.kind === 'edit_disagree' ? 'disputed change' : 'overtime claim'}`}
          onClose={() => setClaim(null)}
        >
          <Card tone={claim.matchStatus === 'supported' ? 'good' : 'subtle'}>
            <span className="t-strong">
              {claim.matchStatus === 'supported'
                ? 'The records support this'
                : 'The records do not fully support this'}
            </span>
            <span className="t-caption">{claim.evidence.explanation}</span>
          </Card>
          <p className="t-caption muted">“{claim.reason}”</p>
          <Field label="Your reason (the worker sees this)">
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
                  'Rejected. The worker has been told why.'
                )
              }
            >
              Reject
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
                  'Approved. It will be paid on payday.'
                )
              }
            >
              Approve
            </button>
          </div>
        </Sheet>
      )}

      {hazard && (
        <Sheet
          title={`${hazard.zoneName}: ${hazard.hazardType.replace(/_/g, ' ')}`}
          onClose={() => setHazard(null)}
        >
          <p>{hazard.englishSummary}</p>
          {hazard.photoId && (
            <AuthImage path={`/workplaces/${wp}/photos/${hazard.photoId}`} alt="Reported hazard" />
          )}
          <span className="t-caption muted">
            Severity {hazard.finalSeverity}
            {hazard.floorApplied ? ' (raised by the safety floor)' : ''} · respond by{' '}
            {new Date(hazard.deadlineAt).toLocaleString()}
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
                  'Reporters told it is being handled.'
                )
              }
            >
              Mark as being handled
            </button>
          )}
          {hazard.status !== 'resolved' && (
            <>
              <Field label="Photo of the fix (recommended)">
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
                    'Marked fixed. The reporter will be asked to confirm.'
                  )
                }
              >
                Mark fixed
              </button>
            </>
          )}
        </Sheet>
      )}

      {flag && (
        <Sheet title={FLAG_TITLES[flag.code] ?? flag.code} onClose={() => setFlag(null)}>
          <p>{flag.message}</p>
          <Card tone="subtle">
            {Object.entries(flag.facts).map(([k, v]) => (
              <div key={k} className="kv">
                <span>{k}</span>
                <span>{String(v)}</span>
              </div>
            ))}
          </Card>
          <Field label="What you found (kept with the flag)">
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
                  'Dismissed.'
                )
              }
            >
              Dismiss
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
                  'Resolved.'
                )
              }
            >
              Resolved
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
};
