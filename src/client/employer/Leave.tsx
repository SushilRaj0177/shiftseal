import { toast } from '../ui/toast.js';
import React, { useState } from 'react';
import type { LeaveRequest } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import type { LeaveResponse } from '../lib/types.js';
import { Card, Empty, Field, Notice, Pill, Sheet, Skeleton } from '../ui/index.js';
import { STATUS_KEY, STATUS_TONE, TYPE_KEY } from '../worker/Leave.js';
import { useLang } from '../i18n/LangProvider.js';
import { PageHead, useEmployer } from './EmployerApp.js';

export const Leave: React.FC = () => {
  const { t, lang } = useLang();
  const span = (r: LeaveRequest) =>
    `${dayLabel(r.from, lang)}${r.to !== r.from ? ` – ${dayLabel(r.to, lang)}` : ''} · ${t('daysCount', r.days)}`;
  const { base, reload: reloadDash } = useEmployer();
  const wp = base.workplace.id;
  const data = useApi<LeaveResponse>(`/workplaces/${wp}/leave`);
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  if (!data.data)
    return data.error ? <Notice kind="error">{data.error}</Notice> : <Skeleton height={300} />;

  const today = data.data.today;
  const pending = data.data.team.filter((r) => r.status === 'pending');
  const approved = data.data.team.filter((r) => r.status === 'approved' && r.to >= today);
  const past = data.data.team
    .filter((r) => !pending.includes(r) && !approved.includes(r))
    .slice(-20)
    .reverse();

  const act = async (path: string, body: object, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api<{ flags?: { code: string }[] }>(`/workplaces/${wp}/leave/${path}`, {
        body,
      });
      if (res.flags?.length) setMsg({ kind: 'error', text: `${ok} ${t('eFlaggedForOwner')}` });
      else toast(ok);
      setSelected(null);
      setReason('');
      await Promise.all([data.reload(), reloadDash()]);
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const row = (r: LeaveRequest) => (
    <button key={r.id} type="button" className="list-row" onClick={() => setSelected(r)}>
      <span className="grow stack-sm" style={{ gap: 0 }}>
        <span className="t-strong">
          {r.workerName} · {t(TYPE_KEY[r.type])}
        </span>
        <span className="t-caption muted">
          {span(r)} · {r.reason}
        </span>
      </span>
      <Pill tone={STATUS_TONE[r.status]}>{t(STATUS_KEY[r.status])}</Pill>
    </button>
  );

  return (
    <>
      <PageHead title={t('eNavLeave')} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="cols">
        <div className="stack">
          <Card flush>
            <div style={{ padding: '16px 16px 8px' }}>
              <h2 className="t-headline">{t('eLeaveWaiting')}</h2>
            </div>
            {pending.length === 0 ? (
              <Empty icon="check">{t('eLeaveNothing')}</Empty>
            ) : (
              pending.map(row)
            )}
          </Card>
          <Card flush>
            <div style={{ padding: '16px 16px 8px' }}>
              <h2 className="t-headline">{t('eLeaveAhead')}</h2>
            </div>
            {approved.length === 0 ? (
              <Empty icon="clock">{t('eLeaveNoneAhead')}</Empty>
            ) : (
              approved.map(row)
            )}
          </Card>
        </div>
        <Card flush>
          <div style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">{t('eHistory')}</h2>
          </div>
          {past.length === 0 ? <Empty icon="doc">{t('eNoHistory')}</Empty> : past.map(row)}
        </Card>
      </div>

      {selected && (
        <Sheet
          title={`${selected.workerName}: ${t(TYPE_KEY[selected.type])}`}
          onClose={() => setSelected(null)}
        >
          <span className="muted">{span(selected)}</span>
          <p>“{selected.reason}”</p>
          {selected.status === 'pending' && (
            <>
              <Field label={t('eLeaveNote')}>
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
                    act(
                      'decide',
                      { leaveId: selected.id, decision: 'rejected', reason },
                      t('eRejectedDone')
                    )
                  }
                >
                  {t('eReject')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    act(
                      'decide',
                      { leaveId: selected.id, decision: 'approved', reason: reason || undefined },
                      t('eApproved')
                    )
                  }
                >
                  {t('eApprove')}
                </button>
              </div>
            </>
          )}
          {selected.status === 'approved' && selected.to >= today && (
            <>
              <Notice kind="warn">{t('eWithdrawWarn')}</Notice>
              <Field label={t('eReasonRequired')}>
                <textarea
                  className="textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy || reason.trim().length < 5}
                onClick={() => act('revoke', { leaveId: selected.id, reason }, t('eWithdrawn'))}
              >
                {t('eWithdraw')}
              </button>
            </>
          )}
        </Sheet>
      )}
    </>
  );
};
