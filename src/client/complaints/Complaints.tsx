import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Complaint, ComplaintStatus } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel, timeAgo } from '../lib/format.js';
import { useApi } from '../lib/useApi.js';
import type { CommitteeInfo } from '../lib/types.js';
import { countryPack } from '../../shared/countries/index.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { AppBar, Card, Field, Notice, Pill, Sheet, Skeleton, type Tone } from '../ui/index.js';

const STATUS: Record<ComplaintStatus, [StringKey, Tone]> = {
  received: ['cStatusReceived', 'warn'],
  inquiry: ['cStatusInquiry', 'accent'],
  report_submitted: ['cStatusReport', 'good'],
  closed: ['cStatusClosed', 'neutral'],
};

interface ComplaintList {
  mine: Complaint[];
  committee: Complaint[];
}

/** The conversation between a complainant and the committee. */
const Thread: React.FC<{
  c: Complaint;
  wpId: string;
  onChange(c: Complaint): void;
  committee?: boolean;
}> = ({ c, wpId, onChange, committee }) => {
  const { t, lang } = useLang();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    try {
      const res = await api<{ complaint: Complaint }>(`/workplaces/${wpId}/complaints/message`, {
        body: { complaintId: c.id, text },
      });
      setText('');
      onChange(res.complaint);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  const setStatus = async (status: ComplaintStatus) => {
    try {
      const res = await api<{ complaint: Complaint }>(`/workplaces/${wpId}/complaints/status`, {
        body: { complaintId: c.id, status },
      });
      onChange(res.complaint);
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="stack">
      <Card tone="subtle">
        <span className="t-caption muted">
          {committee ? `${c.complainantName} · ` : ''}
          {dayLabel(c.incidentDate, lang)} · {c.place}
        </span>
        <span className="t-strong">{c.respondentName}</span>
        <p style={{ whiteSpace: 'pre-wrap' }}>{c.description}</p>
        {c.witnesses && <span className="t-caption muted">{c.witnesses}</span>}
      </Card>
      {c.messages.map((m) => (
        <Card key={m.id} tone={m.fromRole === 'committee' ? undefined : 'subtle'}>
          <span className="t-caption muted">
            {m.fromName} · {timeAgo(m.at, lang)}
          </span>
          <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
        </Card>
      ))}
      {c.status !== 'closed' && (
        <>
          <Field label={t('writeMessage')}>
            <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!text.trim()}
            onClick={send}
          >
            {t('send')}
          </button>
        </>
      )}
      {committee && (
        <div className="segmented" role="group" aria-label={t('eStatus')}>
          {(Object.keys(STATUS) as ComplaintStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={c.status === s}
              onClick={() => setStatus(s)}
            >
              {t(STATUS[s][0])}
            </button>
          ))}
        </div>
      )}
      {error && <Notice kind="error">{error}</Notice>}
    </div>
  );
};

/** File and follow confidential complaints. Shared by the worker app and staff. */
export const Complaints: React.FC<{ back: string }> = ({ back }) => {
  const { wp = '' } = useParams();
  const { t, tx, lang } = useLang();
  const info = useApi<CommitteeInfo>(`/workplaces/${wp}/committee`);
  const list = useApi<ComplaintList>(`/workplaces/${wp}/complaints`);
  const [form, setForm] = useState({
    respondentName: '',
    incidentDate: '',
    place: '',
    description: '',
    witnesses: '',
  });
  const [excluded, setExcluded] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const [open, setOpen] = useState<Complaint | null>(null);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const file = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/workplaces/${wp}/complaints`, {
        body: { ...form, witnesses: form.witnesses || undefined, excludedCommitteeUids: excluded },
      });
      setForm({ respondentName: '', incidentDate: '', place: '', description: '', witnesses: '' });
      setExcluded([]);
      setMsg({ kind: 'info', text: t('complaintSent') });
      await list.reload();
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const valid =
    form.respondentName.trim() &&
    form.incidentDate &&
    form.place.trim() &&
    form.description.trim().length >= 10;

  return (
    <main className="screen">
      <AppBar back={back} title={t('complaintTitle')} />
      <div className="screen-body">
        <p className="muted">{t('complaintBody')}</p>
        <Notice kind="info">{t('complaintPrivacy')}</Notice>
        {!info.data ? (
          <Skeleton height={80} />
        ) : info.data.committee.length === 0 ? (
          <Notice kind="warn">{t('noCommittee')}</Notice>
        ) : (
          <Card>
            <span className="t-label">{t('committeeLabel')}</span>
            {info.data.committee.map((m) => (
              <label key={m.uid} className="between">
                <span>
                  {m.name}
                  {m.presiding ? ` · ${t('presiding')}` : ''}
                </span>
                <span className="row-flex t-caption muted">
                  <input
                    type="checkbox"
                    checked={excluded.includes(m.uid)}
                    onChange={(e) =>
                      setExcluded(
                        e.target.checked
                          ? [...excluded, m.uid]
                          : excluded.filter((u) => u !== m.uid)
                      )
                    }
                    aria-label={`${t('excludeLabel')}: ${m.name}`}
                  />
                </span>
              </label>
            ))}
            <span className="t-caption muted">{t('excludeLabel')}</span>
          </Card>
        )}

        {list.data && list.data.mine.length > 0 && (
          <>
            <h2 className="t-headline">{t('myComplaints')}</h2>
            <div className="card flush">
              {list.data.mine.map((c) => (
                <button key={c.id} type="button" className="list-row" onClick={() => setOpen(c)}>
                  <span className="grow stack-sm">
                    <span className="t-strong">{c.respondentName}</span>
                    <span className="t-caption muted">{dayLabel(c.incidentDate, lang)}</span>
                  </span>
                  <Pill tone={STATUS[c.status][1]}>{t(STATUS[c.status][0])}</Pill>
                </button>
              ))}
            </div>
          </>
        )}

        <Field label={t('respondent')}>
          <input className="input" value={form.respondentName} onChange={set('respondentName')} />
        </Field>
        <div className="grid-2">
          <Field label={t('incidentDate')}>
            <input
              type="date"
              className="input"
              value={form.incidentDate}
              onChange={set('incidentDate')}
            />
          </Field>
          <Field label={t('place')}>
            <input className="input" value={form.place} onChange={set('place')} />
          </Field>
        </div>
        <Field label={t('whatHappened')}>
          <textarea
            className="textarea"
            style={{ minHeight: 160 }}
            value={form.description}
            onChange={set('description')}
          />
        </Field>
        <Field label={t('witnesses')}>
          <input className="input" value={form.witnesses} onChange={set('witnesses')} />
        </Field>
        <p className="t-caption faint">{t('lawNote')}</p>
        {info.data && info.data.external.length > 0 && (
          <Card tone="subtle">
            <span className="t-label">{t('externalTitle')}</span>
            {info.data.external.map((e) => (
              <a key={e.key} href={e.url} target="_blank" rel="noreferrer" className="t-strong">
                {tx(`ext_${e.key}`)}
              </a>
            ))}
          </Card>
        )}
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <button type="button" className="btn btn-primary" disabled={!valid || busy} onClick={file}>
          {t('fileComplaint')}
        </button>
      </div>
      {open && (
        <Sheet title={open.respondentName} onClose={() => setOpen(null)}>
          <Thread
            c={open}
            wpId={wp}
            onChange={(c) => {
              setOpen(c);
              void list.reload();
            }}
          />
        </Sheet>
      )}
    </main>
  );
};

/** The complaint handlers' inbox. Only complaints this member may see are ever sent here. */
export const CommitteeInbox: React.FC<{ back: string }> = ({ back }) => {
  const { wp = '' } = useParams();
  const { t, lang, country } = useLang();
  const inquiryDays = countryPack({ country }).complaints.inquiryDays;
  const list = useApi<ComplaintList>(`/workplaces/${wp}/complaints`);
  const [open, setOpen] = useState<Complaint | null>(null);
  return (
    <main className="screen">
      <AppBar back={back} title={t('committeeInbox')} />
      <div className="screen-body">
        <Notice kind="info">{t('complaintPrivacy')}</Notice>
        {!list.data ? (
          <Skeleton height={120} />
        ) : list.data.committee.length === 0 ? (
          <Card tone="subtle">
            <p className="muted">{t('eNoComplaints')}</p>
          </Card>
        ) : (
          <div className="card flush">
            {list.data.committee.map((c) => {
              const days = Math.floor((Date.now() - Date.parse(c.createdAt)) / 86_400_000);
              return (
                <button key={c.id} type="button" className="list-row" onClick={() => setOpen(c)}>
                  <span className="grow stack-sm">
                    <span className="t-strong">
                      {t('eComplaintAbout', c.complainantName, c.respondentName)}
                    </span>
                    <span className="t-caption muted">
                      {dayLabel(c.incidentDate, lang)} · {t('eFiledAgo', days)}
                      {inquiryDays &&
                      c.status !== 'closed' &&
                      c.status !== 'report_submitted' &&
                      days > inquiryDays - 15
                        ? ` · ${t('eDeadlineNear')}`
                        : ''}
                    </span>
                  </span>
                  <Pill tone={STATUS[c.status][1]}>{t(STATUS[c.status][0])}</Pill>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {open && (
        <Sheet
          title={`${open.complainantName}: ${open.respondentName}`}
          onClose={() => setOpen(null)}
        >
          <Thread
            c={open}
            wpId={wp}
            committee
            onChange={(c) => {
              setOpen(c);
              void list.reload();
            }}
          />
        </Sheet>
      )}
    </main>
  );
};
