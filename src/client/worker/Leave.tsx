import { toast } from '../ui/toast.js';
import React, { useState } from 'react';
import type { LeaveRequest, LeaveType } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import type { LeaveResponse } from '../lib/types.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { Card, Empty, Field, Notice, Pill, Sheet, Skeleton, type Tone } from '../ui/index.js';
import { TabBar, useWorker } from './WorkerApp.js';

export const TYPE_KEY: Record<LeaveType, StringKey> = {
  casual: 'typeCasual',
  sick: 'typeSick',
  earned: 'typeEarned',
  comp_off: 'typeCompOff',
  unpaid: 'typeUnpaid',
  wfh: 'typeWfh',
};

const BALANCE_KEY: Record<string, StringKey> = {
  casual: 'balanceCasual',
  sick: 'balanceSick',
  earned: 'balanceEarned',
  comp_off: 'balanceCompOff',
};

export const STATUS_TONE: Record<LeaveRequest['status'], Tone> = {
  pending: 'warn',
  approved: 'good',
  rejected: 'danger',
  cancelled: 'neutral',
  revoked: 'danger',
};

export const STATUS_KEY: Record<LeaveRequest['status'], StringKey> = {
  pending: 'statusPending',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  cancelled: 'statusCancelled',
  revoked: 'statusRevoked',
};

export const Leave: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview, reload: reloadOverview } = useWorker();
  const data = useApi<LeaveResponse>(`/workplaces/${wp.id}/leave`);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>('earned');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/workplaces/${wp.id}/leave`, {
        body: { type, from, to: to || from, halfDay: halfDay || undefined, reason },
      });
      setOpen(false);
      setReason('');
      toast(t('requestSent'));
      await Promise.all([data.reload(), reloadOverview()]);
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    try {
      await api(`/workplaces/${wp.id}/leave/cancel`, { body: { leaveId: id } });
      await data.reload();
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="stack-sm" style={{ paddingTop: 8 }}>
          <h1 className="t-title">{t('leaveTitle')}</h1>
          <span className="muted">{t('leaveBody')}</span>
        </header>
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        {!data.data ? (
          <Skeleton height={120} />
        ) : (
          <div className="grid-2">
            {data.data.balances
              .filter((b) => b.type !== 'comp_off' || b.entitled > 0 || b.used > 0)
              .map((b) => (
                <Card key={b.type} className="balance">
                  <span className="t-label">{t(BALANCE_KEY[b.type])}</span>
                  <span className="balance-num t-num">
                    {b.available}
                    <small> / {b.entitled}</small>
                  </span>
                  <span className="balance-bar" aria-hidden="true">
                    <i
                      style={{
                        width: `${b.entitled ? Math.round((b.available / b.entitled) * 100) : 0}%`,
                      }}
                    />
                  </span>
                  {b.kind === 'law' && <span className="t-caption muted">{t('law')}</span>}
                </Card>
              ))}
          </div>
        )}
        <p className="t-note muted">{t('leaveLawNote')}</p>
        {overview?.leave.minTaken && (
          <Card tone="subtle">
            <span className="t-caption">
              {t('minLeave', overview.leave.minTaken.taken, overview.leave.minTaken.required)}
            </span>
            <div className="limit-track">
              <span
                style={{
                  width: `${Math.min(100, (overview.leave.minTaken.taken / overview.leave.minTaken.required) * 100)}%`,
                  background: 'var(--seal)',
                }}
              />
            </div>
          </Card>
        )}
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          {t('applyLeave')}
        </button>

        <h2 className="t-headline">{t('myRequests')}</h2>
        {data.data && data.data.requests.length === 0 && (
          <Card>
            <Empty icon="clock">{t('noRequests')}</Empty>
          </Card>
        )}
        {data.data && data.data.requests.length > 0 && (
          <div className="card flush">
            {data.data.requests.map((r) => (
              <div
                key={r.id}
                className="list-row"
                style={{ cursor: 'default', alignItems: 'flex-start' }}
              >
                <div className="grow stack-sm">
                  <span className="t-strong">{t(TYPE_KEY[r.type])}</span>
                  <span className="t-caption muted">
                    {dayLabel(r.from, lang)}
                    {r.to !== r.from ? ` – ${dayLabel(r.to, lang)}` : ''} · {t('daysCount', r.days)}
                  </span>
                  {r.decisionReason && <span className="t-caption faint">{r.decisionReason}</span>}
                  {(r.status === 'pending' ||
                    (r.status === 'approved' && r.from > data.data!.today)) && (
                    <button
                      type="button"
                      className="link-btn t-caption"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => cancel(r.id)}
                    >
                      {t('cancelRequest')}
                    </button>
                  )}
                </div>
                <Pill tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</Pill>
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar />

      {open && (
        <Sheet title={t('applyLeave')} onClose={() => setOpen(false)}>
          <Field label={t('leaveType')}>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as LeaveType)}
            >
              {(data.data?.types ?? []).map((k) => (
                <option key={k.type} value={k.type}>
                  {t(TYPE_KEY[k.type])}
                  {k.paid ? '' : ` (${t('leaveUnpaid')})`}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid-2">
            <Field label={t('fromDate')}>
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label={t('toDate')}>
              <input
                type="date"
                className="input"
                value={to || from}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </div>
          {(!to || to === from) && (
            <label className="row-flex">
              <input
                type="checkbox"
                checked={halfDay}
                onChange={(e) => setHalfDay(e.target.checked)}
              />
              {t('halfDay')}
            </label>
          )}
          <Field label={t('leaveReason')}>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          {msg?.kind === 'error' && <Notice kind="error">{msg.text}</Notice>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !from || reason.trim().length < 2}
            onClick={submit}
          >
            {t('sendRequest')}
          </button>
        </Sheet>
      )}
    </main>
  );
};
