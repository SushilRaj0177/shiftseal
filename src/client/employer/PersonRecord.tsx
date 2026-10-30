import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CheckEvidence } from '../../shared/model.js';
import type { ShiftRecord } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import type { WorkerRecord } from '../lib/types.js';
import { AppBar, Card, Field, Kv, Notice, Pill, Sheet, Skeleton } from '../ui/index.js';
import { FLAG_TITLES, flagTone } from './Overview.js';
import { useEmployer } from './EmployerApp.js';

/** "PF, 1800, Employee PF" lines into deduction items. Lines that do not parse are ignored. */
function parseDeductions(text: string) {
  return text
    .split('\n')
    .map((line) => line.split(',').map((x) => x.trim()))
    .filter(
      ([type, amount, ...reason]) => type && Number(amount) > 0 && reason.join(',').length >= 3
    )
    .map(([type, amount, ...reason]) => ({
      type,
      amount: Number(amount),
      reason: reason.join(', '),
    }));
}

function evidenceOf(rec: WorkerRecord, eventId?: string): CheckEvidence | undefined {
  const ev = rec.chain.find((e) => e.id === eventId);
  return ev ? (ev.payload as { evidence?: CheckEvidence }).evidence : undefined;
}

const TrustPill: React.FC<{ ev?: CheckEvidence }> = ({ ev }) =>
  !ev ? null : (
    <Pill tone={ev.trust === 'high' ? 'good' : ev.trust === 'medium' ? 'neutral' : 'danger'}>
      {ev.insideSite ? 'On site' : ev.location ? 'Away' : 'No location'}
      {ev.qrValid ? ' · QR' : ''}
    </Pill>
  );

export const PersonRecord: React.FC = () => {
  const { uid = '' } = useParams();
  const { base, reload: reloadDash } = useEmployer();
  const wp = base.workplace;
  const isOwner = base.member.role === 'owner';
  const rec = useApi<WorkerRecord>(`/workplaces/${wp.id}/workers/${uid}/record`);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ shift: ShiftRecord; kind: 'in' | 'out' } | null>(null);
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (rec.error) return <Notice kind="error">{rec.error}</Notice>;
  if (!rec.data) return <Skeleton height={300} />;
  const w = rec.data.worker;
  const val = (k: string, fallback: string | number) => form[k] ?? String(fallback);
  // With nothing set yet, offices default to a monthly salary and other sites to an hourly rate.
  const unset = !w.payType && w.hourlyRate <= 0 && w.dailyWage <= 0;
  const payType = (form.payType ??
    w.payType ??
    (unset
      ? wp.payCycle === 'monthly'
        ? 'monthly'
        : 'hourly'
      : w.hourlyRate > 0
        ? 'hourly'
        : 'daily')) as 'hourly' | 'daily' | 'monthly';

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: 'info', text: ok });
      await Promise.all([rec.reload(), reloadDash()]);
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      await api(`/workplaces/${wp.id}/members/${uid}`, {
        method: 'PATCH',
        body: {
          title: val('title', w.title),
          team: val('team', w.team),
          payType,
          hourlyRate: Number(val('hourlyRate', w.hourlyRate)),
          dailyWage: Number(val('dailyWage', w.dailyWage)),
          monthlySalary: Number(val('monthlySalary', w.monthlySalary ?? 0)),
          overtime: val('overtime', w.overtime ?? 'paid'),
          recurringDeductions: parseDeductions(val('deductions', '')),
        },
      });
      setForm({});
    }, 'Saved.');

  const submitEdit = () =>
    run(async () => {
      if (!editing) return;
      const target =
        editing.kind === 'in' ? editing.shift.checkInEventId : editing.shift.checkOutEventId;
      const res = await api<{ flags: { code: string }[] }>(`/workplaces/${wp.id}/shifts/edit`, {
        body: { workerUid: uid, targetEventId: target, newTime, reason },
      });
      setEditing(null);
      setReason('');
      if (res.flags.length)
        throw new Error(
          `Saved, and flagged for the owner: ${res.flags.map((f) => FLAG_TITLES[f.code]).join(', ')}.`
        );
    }, `Saved. ${w.name} has been told, with your reason.`);

  return (
    <>
      <AppBar back=".." title={w.name} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {!rec.data.verification.ok && (
        <Notice kind="error">
          This worker's record chain is broken. Do not edit; contact support.
        </Notice>
      )}

      <div className="cols">
        <Card flush>
          <div style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">Shifts</h2>
          </div>
          {rec.data.shifts.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              No shifts yet.
            </p>
          )}
          {rec.data.shifts.slice(0, 30).map((s) => (
            <div key={s.date} className="list-row" style={{ cursor: 'default', flexWrap: 'wrap' }}>
              <span className="grow stack-sm" style={{ minWidth: 140 }}>
                <span className="t-strong">{dayLabel(s.date)}</span>
                <span className="t-caption muted">
                  {s.checkInTime} – {s.checkOutTime ?? 'on site'}
                  {s.edits.length
                    ? ` · edited (was ${s.originalCheckInTime}–${s.originalCheckOutTime ?? ''})`
                    : ''}
                </span>
              </span>
              <TrustPill ev={evidenceOf(rec.data!, s.checkInEventId)} />
              <TrustPill ev={evidenceOf(rec.data!, s.checkOutEventId)} />
              {s.checkOutEventId && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setEditing({ shift: s, kind: 'out' });
                    setNewTime(s.checkOutTime ?? '');
                  }}
                >
                  Correct
                </button>
              )}
            </div>
          ))}
        </Card>

        <div className="stack">
          <Card>
            <h2 className="t-headline">Details</h2>
            <Field label="Job title">
              <input
                className="input"
                value={val('title', w.title)}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Team (anonymous feedback is grouped by team)">
              <input
                className="input"
                value={val('team', w.team)}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
              />
            </Field>
            <Field label="Paid">
              <div className="segmented" role="group">
                {(['hourly', 'daily', 'monthly'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={payType === k}
                    onClick={() => setForm({ ...form, payType: k })}
                  >
                    {k === 'hourly'
                      ? 'By the hour'
                      : k === 'daily'
                        ? 'By the day'
                        : 'Monthly salary'}
                  </button>
                ))}
              </div>
            </Field>
            {payType === 'hourly' && (
              <Field label="Hourly rate (₹)">
                <input
                  className="input"
                  inputMode="decimal"
                  value={val('hourlyRate', w.hourlyRate)}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                />
              </Field>
            )}
            {payType === 'daily' && (
              <Field label="Daily wage (₹)">
                <input
                  className="input"
                  inputMode="decimal"
                  value={val('dailyWage', w.dailyWage)}
                  onChange={(e) => setForm({ ...form, dailyWage: e.target.value })}
                />
              </Field>
            )}
            {payType === 'monthly' && (
              <>
                <Field label="Monthly salary (₹)">
                  <input
                    className="input"
                    inputMode="decimal"
                    value={val('monthlySalary', w.monthlySalary ?? 0)}
                    onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
                  />
                </Field>
                <Field label="Extra hours">
                  <select
                    className="select"
                    value={val('overtime', w.overtime ?? 'paid')}
                    onChange={(e) => setForm({ ...form, overtime: e.target.value })}
                  >
                    <option value="paid">Paid as overtime (2×)</option>
                    <option value="comp_off">Given back as comp-off leave</option>
                    <option value="none">Not compensated (exempt role)</option>
                  </select>
                </Field>
              </>
            )}
            <Field
              label="Monthly deductions (one per line: type, amount, reason)"
              hint="For example: PF, 1800, Employee PF 12% of basic"
            >
              <textarea
                className="textarea"
                value={val(
                  'deductions',
                  (w.recurringDeductions ?? [])
                    .map((d) => `${d.type}, ${d.amount}, ${d.reason}`)
                    .join('\n')
                )}
                onChange={(e) => setForm({ ...form, deductions: e.target.value })}
              />
            </Field>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy || Object.keys(form).length === 0}
              onClick={save}
            >
              Save
            </button>
          </Card>
          <Card>
            <h2 className="t-headline">Phone</h2>
            <Kv
              k="Registered"
              v={
                w.device
                  ? `${w.device.platform}, ${new Date(w.device.boundAt).toLocaleDateString()}`
                  : 'Not yet'
              }
            />
            {w.pendingDevice && (
              <>
                <Notice kind="warn">
                  A new phone is waiting. Approve it only if {w.name} told you they changed phones.
                </Notice>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => api(`/workplaces/${wp.id}/members/${uid}/device/approve`, { body: {} }),
                      'Approved.'
                    )
                  }
                >
                  Approve new phone
                </button>
              </>
            )}
          </Card>
          {rec.data.flags.length > 0 && (
            <Card>
              <h2 className="t-headline">Flags</h2>
              {rec.data.flags.slice(0, 10).map((f) => (
                <div key={f.id} className="between">
                  <span className="stack-sm">
                    <span className="t-strong">{FLAG_TITLES[f.code] ?? f.code}</span>
                    <span className="t-caption muted">{f.message}</span>
                  </span>
                  <Pill tone={f.status === 'open' ? flagTone(f) : 'neutral'}>{f.status}</Pill>
                </div>
              ))}
            </Card>
          )}
          {isOwner && (
            <Card>
              <h2 className="t-headline">Internal Committee (POSH)</h2>
              <span className="t-caption muted">
                Committee members read confidential complaints. Nobody else, including you, can see
                them unless you are a member.
              </span>
              <label className="row-flex">
                <input
                  type="checkbox"
                  checked={Boolean(w.icMember)}
                  onChange={(e) =>
                    run(
                      () =>
                        api(`/workplaces/${wp.id}/members/${uid}`, {
                          method: 'PATCH',
                          body: {
                            icMember: e.target.checked,
                            icPresiding: e.target.checked ? w.icPresiding : false,
                          },
                        }),
                      'Committee updated.'
                    )
                  }
                />
                On the committee
              </label>
              {w.icMember && (
                <label className="row-flex">
                  <input
                    type="checkbox"
                    checked={Boolean(w.icPresiding)}
                    onChange={(e) =>
                      run(
                        () =>
                          api(`/workplaces/${wp.id}/members/${uid}`, {
                            method: 'PATCH',
                            body: { icPresiding: e.target.checked },
                          }),
                        'Committee updated.'
                      )
                    }
                  />
                  Presiding officer
                </label>
              )}
            </Card>
          )}
          {isOwner && w.role !== 'owner' && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                run(
                  () =>
                    api(`/workplaces/${wp.id}/members/${uid}`, {
                      method: 'PATCH',
                      body: { role: w.role === 'worker' ? 'supervisor' : 'worker' },
                    }),
                  'Role updated.'
                )
              }
            >
              {w.role === 'worker' ? 'Make supervisor' : 'Make worker'}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <Sheet title={`Correct ${dayLabel(editing.shift.date)}`} onClose={() => setEditing(null)}>
          <p className="muted">
            The original time stays in the record. {w.name} is told immediately, with your reason,
            and can disagree.
          </p>
          <Field label="Check-out time">
            <input
              type="time"
              className="input"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </Field>
          <Field label="Reason (required)">
            <textarea
              className="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || reason.trim().length < 5 || !newTime}
            onClick={submitEdit}
          >
            Save correction
          </button>
        </Sheet>
      )}
    </>
  );
};
