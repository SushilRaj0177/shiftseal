import { toast } from '../ui/toast.js';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CheckEvidence } from '../../shared/model.js';
import type { ShiftRecord } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { currencySymbol, dayLabel } from '../lib/format.js';
import { compOffAllowed, countryPack } from '../../shared/countries/index.js';
import { baseOf } from '../../shared/languages.js';
import { useLang } from '../i18n/LangProvider.js';
import { useApi } from '../lib/useApi.js';
import type { WorkerRecord } from '../lib/types.js';
import { AppBar, Card, Field, Kv, Notice, Pill, Sheet, Skeleton } from '../ui/index.js';
import { flagTitle, flagTone } from './Overview.js';
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

const TrustPill: React.FC<{ ev?: CheckEvidence }> = ({ ev }) => {
  const { t } = useLang();
  return !ev ? null : (
    <Pill tone={ev.trust === 'high' ? 'good' : ev.trust === 'medium' ? 'neutral' : 'danger'}>
      {ev.insideSite ? t('eOnSiteShort') : ev.location ? t('eAwayFromSite') : t('eNoLocationShort')}
      {ev.qrValid ? ' · QR' : ''}
    </Pill>
  );
};

export const PersonRecord: React.FC = () => {
  const { uid = '' } = useParams();
  const { base, reload: reloadDash } = useEmployer();
  const { t, tx, lang, currency } = useLang();
  const wp = base.workplace;
  const pack = countryPack(wp);
  const cur = currencySymbol(lang, currency);
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
      toast(ok);
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
          serviceFrom: form.serviceFrom || undefined,
        },
      });
      setForm({});
    }, t('eSaved'));

  const submitEdit = () =>
    run(
      async () => {
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
            t('eSavedFlagged', res.flags.map((f) => flagTitle(f.code, tx)).join(', '))
          );
      },
      t('eSavedTold', w.name)
    );

  return (
    <>
      <AppBar back=".." title={w.name} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {!rec.data.verification.ok && <Notice kind="error">{t('eChainBroken')}</Notice>}

      <div className="cols">
        <Card flush>
          <div style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">{t('eShifts')}</h2>
          </div>
          {rec.data.shifts.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              {t('eNoShifts')}
            </p>
          )}
          {rec.data.shifts.slice(0, 30).map((s) => (
            <div key={s.date} className="list-row" style={{ cursor: 'default', flexWrap: 'wrap' }}>
              <span className="grow stack-sm" style={{ minWidth: 140 }}>
                <span className="t-strong">{dayLabel(s.date, lang)}</span>
                <span className="t-caption muted">
                  {s.checkInTime} – {s.checkOutTime ?? t('eOnSiteShort')}
                  {s.edits.length
                    ? ` · ${t('eEditedWas', `${s.originalCheckInTime}–${s.originalCheckOutTime ?? ''}`)}`
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
                  {t('eCorrect')}
                </button>
              )}
            </div>
          ))}
        </Card>

        <div className="stack">
          <Card>
            <h2 className="t-headline">{t('eDetails')}</h2>
            <Field label={t('eJobTitle')}>
              <input
                className="input"
                value={val('title', w.title)}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label={t('eTeamField')}>
              <input
                className="input"
                value={val('team', w.team)}
                onChange={(e) => setForm({ ...form, team: e.target.value })}
              />
            </Field>
            <Field label={tx('serviceFromLabel')} hint={t('eServiceHint')}>
              <input
                type="date"
                className="input"
                value={val('serviceFrom', w.serviceFrom ?? w.joinedAt.slice(0, 10))}
                onChange={(e) => setForm({ ...form, serviceFrom: e.target.value })}
              />
            </Field>
            <Field label={t('ePaid')}>
              <div className="segmented" role="group">
                {(['hourly', 'daily', 'monthly'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={payType === k}
                    onClick={() => setForm({ ...form, payType: k })}
                  >
                    {k === 'hourly' ? t('eByHour') : k === 'daily' ? t('eByDay') : t('lineSalary')}
                  </button>
                ))}
              </div>
            </Field>
            {payType === 'hourly' && (
              <Field label={`${t('eHourlyRate')} (${cur})`}>
                <input
                  className="input"
                  inputMode="decimal"
                  value={val('hourlyRate', w.hourlyRate)}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                />
              </Field>
            )}
            {payType === 'daily' && (
              <Field label={`${t('eDailyWage')} (${cur})`}>
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
                <Field label={`${t('lineSalary')} (${cur})`}>
                  <input
                    className="input"
                    inputMode="decimal"
                    value={val('monthlySalary', w.monthlySalary ?? 0)}
                    onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })}
                  />
                </Field>
                <Field label={t('eExtraHours')}>
                  <select
                    className="select"
                    value={val('overtime', w.overtime ?? 'paid')}
                    onChange={(e) => setForm({ ...form, overtime: e.target.value })}
                  >
                    <option value="paid">{t('eOtPaid')}</option>
                    {compOffAllowed(wp) && <option value="comp_off">{t('eOtCompOff')}</option>}
                    <option value="none">{t('eOtExempt')}</option>
                  </select>
                </Field>
              </>
            )}
            <Field
              label={t('eDeductions')}
              hint={t('eDeductionsHint', pack.pay.deductions.map((d) => tx(`ded_${d}`)).join(', '))}
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
              {t('eSave')}
            </button>
          </Card>
          <Card>
            <h2 className="t-headline">{t('eColPhone')}</h2>
            <Kv
              k={t('eRegistered')}
              v={
                w.device
                  ? `${w.device.platform}, ${dayLabel(w.device.boundAt.slice(0, 10), lang)}`
                  : t('eNoneYet')
              }
            />
            {w.pendingDevice && (
              <>
                <Notice kind="warn">{t('eNewPhoneWaiting', w.name)}</Notice>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => api(`/workplaces/${wp.id}/members/${uid}/device/approve`, { body: {} }),
                      t('eApproved')
                    )
                  }
                >
                  {t('eApprovePhone')}
                </button>
              </>
            )}
          </Card>
          {rec.data.flags.length > 0 && (
            <Card>
              <h2 className="t-headline">{t('eFlags')}</h2>
              {rec.data.flags.slice(0, 10).map((f) => (
                <div key={f.id} className="between">
                  <span className="stack-sm">
                    <span className="t-strong">{flagTitle(f.code, tx)}</span>
                    {baseOf(lang) === 'en' && <span className="t-caption muted">{f.message}</span>}
                  </span>
                  <Pill tone={f.status === 'open' ? flagTone(f) : 'neutral'}>
                    {f.status === 'open' ? t('eOpen') : t('eResolved')}
                  </Pill>
                </div>
              ))}
            </Card>
          )}
          {isOwner && (
            <Card>
              <h2 className="t-headline">{t('committeeLabel')}</h2>
              <span className="t-caption muted">{t('handlerSectionBody')}</span>
              <span className="t-caption muted">{t('eHandlersPrivacy')}</span>
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
                      t('eUpdated')
                    )
                  }
                />
                {t('handlerMember')}
              </label>
              {w.icMember && pack.complaints.presiding && (
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
                        t('eUpdated')
                      )
                    }
                  />
                  {t('presiding')}
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
                  t('eUpdated')
                )
              }
            >
              {w.role === 'worker' ? t('eMakeSupervisor') : t('eMakeWorker')}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <Sheet
          title={t('eCorrectDay', dayLabel(editing.shift.date, lang))}
          onClose={() => setEditing(null)}
        >
          <p className="muted">{t('eCorrectBody', w.name)}</p>
          <Field label={t('eCheckOutTime')}>
            <input
              type="time"
              className="input"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </Field>
          <Field label={t('eReasonRequired')}>
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
            {t('eSaveCorrection')}
          </button>
        </Sheet>
      )}
    </>
  );
};
