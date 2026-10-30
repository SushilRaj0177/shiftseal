import React, { useState } from 'react';
import type { LeaveRequest } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import type { LeaveResponse } from '../lib/types.js';
import { Card, Empty, Field, Notice, Pill, Sheet, Skeleton } from '../ui/index.js';
import { STATUS_TONE } from '../worker/Leave.js';
import { useEmployer } from './EmployerApp.js';

const TYPE: Record<LeaveRequest['type'], string> = {
  casual: 'Casual leave',
  sick: 'Sick leave',
  earned: 'Earned leave',
  comp_off: 'Comp-off',
  unpaid: 'Unpaid leave',
  wfh: 'Work from home',
};

const span = (r: LeaveRequest) =>
  `${dayLabel(r.from)}${r.to !== r.from ? ` – ${dayLabel(r.to)}` : ''} · ${r.days} day(s)`;

export const Leave: React.FC = () => {
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
      setMsg({
        kind: res.flags?.length ? 'error' : 'info',
        text: res.flags?.length ? `${ok} This has been flagged for the owner.` : ok,
      });
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
          {r.workerName} · {TYPE[r.type]}
        </span>
        <span className="t-caption muted">
          {span(r)} · {r.reason}
        </span>
      </span>
      <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill>
    </button>
  );

  return (
    <>
      <h1 className="t-title">Leave</h1>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="cols">
        <div className="stack">
          <Card flush>
            <div style={{ padding: '16px 16px 8px' }}>
              <h2 className="t-headline">Waiting for a decision</h2>
            </div>
            {pending.length === 0 ? <Empty icon="check">Nothing waiting.</Empty> : pending.map(row)}
          </Card>
          <Card flush>
            <div style={{ padding: '16px 16px 8px' }}>
              <h2 className="t-headline">Approved, coming up</h2>
            </div>
            {approved.length === 0 ? (
              <Empty icon="clock">No approved leave ahead.</Empty>
            ) : (
              approved.map(row)
            )}
          </Card>
        </div>
        <Card flush>
          <div style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">History</h2>
          </div>
          {past.length === 0 ? <Empty icon="doc">No history yet.</Empty> : past.map(row)}
        </Card>
      </div>

      {selected && (
        <Sheet
          title={`${selected.workerName}: ${TYPE[selected.type]}`}
          onClose={() => setSelected(null)}
        >
          <span className="muted">{span(selected)}</span>
          <p>“{selected.reason}”</p>
          {selected.status === 'pending' && (
            <>
              <Field label="Note to the worker (required to reject)">
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
                      'Rejected. The worker has been told why.'
                    )
                  }
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    act(
                      'decide',
                      { leaveId: selected.id, decision: 'approved', reason: reason || undefined },
                      'Approved.'
                    )
                  }
                >
                  Approve
                </button>
              </div>
            </>
          )}
          {selected.status === 'approved' && selected.to >= today && (
            <>
              <Notice kind="warn">
                Withdrawing leave that was already approved is recorded, flagged for the owner, and
                told to the worker.
              </Notice>
              <Field label="Reason (required)">
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
                onClick={() => act('revoke', { leaveId: selected.id, reason }, 'Leave withdrawn.')}
              >
                Withdraw approved leave
              </button>
            </>
          )}
        </Sheet>
      )}
    </>
  );
};
