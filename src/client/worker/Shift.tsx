import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { LedgerEditPayload, LedgerEvent } from '../../shared/types.js';
import type { CheckEvidence } from '../../shared/model.js';
import { computeShiftDurationHours } from '../../shared/rules/hours.js';
import { api, errorMessage } from '../lib/api.js';
import { hoursLabel, longDay } from '../lib/format.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { AppBar, Card, Kv, Notice, Tile } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

interface CheckPayload {
  date: string;
  timestamp: string;
  zoneCode: string;
  evidence?: CheckEvidence;
}

const PHONE_COPY = (wp: string) => `shiftseal.chain.${wp}`;

/** Compares the server's chain with the copy this phone saved last time. */
function comparePhoneCopy(wpId: string, chain: LedgerEvent[]): 'match' | 'mismatch' {
  let saved: { id: string; hash: string }[] = [];
  try {
    saved = JSON.parse(localStorage.getItem(PHONE_COPY(wpId)) ?? '[]');
  } catch {
    saved = [];
  }
  const byId = new Map(chain.map((e) => [e.id, e.hash]));
  const ok = saved.every((s) => byId.get(s.id) === s.hash);
  if (ok) {
    try {
      localStorage.setItem(
        PHONE_COPY(wpId),
        JSON.stringify(chain.map((e) => ({ id: e.id, hash: e.hash })))
      );
    } catch {
      // phone storage full
    }
  }
  return ok ? 'match' : 'mismatch';
}

export const Shift: React.FC = () => {
  const { date = '' } = useParams();
  const { t, lang } = useLang();
  const { wp, overview, reload } = useWorker();
  const [msg, setMsg] = useState<string | null>(null);
  if (!overview) return null;

  const shift = overview.shifts.find((s) => s.date === date);
  const inId = shift?.checkInEventId;
  const outId = shift?.checkOutEventId;
  const events = overview.chain.filter(
    (e) =>
      e.id === inId ||
      e.id === outId ||
      (e.type === 'EDIT' && [inId, outId].includes((e.payload as LedgerEditPayload).targetEventId))
  );
  const intact =
    overview.chainVerification.ok && comparePhoneCopy(wp.id, overview.chain) === 'match';
  const flags = overview.flags.filter((f) => events.some((e) => e.id === f.subject.id));
  const editNote = overview.notifications.find(
    (n) => n.type === 'SHIFT_EDITED' && n.date === date && n.status !== 'disputed'
  );

  const recorded =
    shift?.originalCheckOutTime && shift.checkInTime
      ? computeShiftDurationHours(shift.originalCheckInTime, shift.originalCheckOutTime).hours
      : null;
  const current =
    shift?.checkOutTime && shift.checkInTime
      ? computeShiftDurationHours(shift.checkInTime, shift.checkOutTime).hours
      : null;

  const dispute = async () => {
    if (!editNote) return;
    try {
      await api(`/workplaces/${wp.id}/notifications/respond`, {
        body: { notificationId: editNote.id, response: 'disputed' },
      });
      setMsg(t('disputeSent'));
      await reload();
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  return (
    <main className="screen">
      <AppBar back={`/w/${wp.id}`} />
      <div className="screen-body">
        <header className="stack-sm">
          <h1 className="t-title">{longDay(date, lang)}</h1>
          <span className="muted">{wp.name}</span>
        </header>

        <Card tone={intact ? 'good' : 'danger'}>
          <div className="row-flex" style={{ alignItems: 'flex-start' }}>
            <Tile icon="shield" tone={intact ? 'good' : 'danger'} small />
            <div className="grow stack-sm">
              <span className={`t-strong ${intact ? 'c-good' : 'c-danger'}`}>
                {intact ? t('recordIntact') : t('recordBroken')}
              </span>
              {intact && (
                <span className="t-caption muted">
                  {t('recordIntactBody', overview.chain.length)}
                </span>
              )}
            </div>
          </div>
        </Card>

        <div className="card" style={{ gap: 0, padding: '4px 16px' }}>
          {events.map((e, i) => {
            const isEdit = e.type === 'EDIT';
            const p = e.payload as CheckPayload & LedgerEditPayload;
            const ev = isEdit ? undefined : p.evidence;
            return (
              <div
                key={e.id}
                className="row-flex"
                style={{
                  alignItems: 'flex-start',
                  padding: '12px 0',
                  borderTop: i ? '1px solid var(--line)' : undefined,
                }}
              >
                <Tile icon={isEdit ? 'pencil' : 'check'} tone={isEdit ? 'warn' : undefined} small />
                <div className="grow stack-sm">
                  <span className="t-strong">
                    {isEdit
                      ? t('changedTo', p.newValue)
                      : e.type === 'CHECK_IN'
                        ? t('checkedInEv')
                        : t('checkedOutEv')}
                    {!isEdit && ` · ${p.timestamp}`}
                  </span>
                  {isEdit ? (
                    <>
                      <span className="t-caption muted">
                        {t('byOn', p.editorName, new Date(e.createdAt).toLocaleString())}
                      </span>
                      <span className="t-caption faint">{t('reasonQ', p.reason)}</span>
                    </>
                  ) : (
                    ev && (
                      <span className="t-caption muted">
                        {ev.insideSite ? t('signedOnSite') : t('signedOffSite')}
                        {ev.location ? ` · ±${Math.round(ev.location.accuracyM)} m` : ''}
                      </span>
                    )
                  )}
                  <span className="mono faint">{e.hash.slice(0, 16)}…</span>
                </div>
              </div>
            );
          })}
        </div>

        {recorded !== null && current !== null && recorded !== current && (
          <Card>
            <Kv k={t('yourRecord')} v={hoursLabel(recorded)} />
            <Kv k={t('afterChange')} v={hoursLabel(current)} vClass="c-warn" />
          </Card>
        )}

        {flags.length > 0 && (
          <Card tone="subtle">
            <span className="t-strong">{t('flagsAboutYou')}</span>
            {flags.map((f) => (
              <span key={f.id} className="t-caption">
                {t(`flag_${f.code}` as StringKey) || f.message}
              </span>
            ))}
          </Card>
        )}

        {msg && <Notice kind="info">{msg}</Notice>}
        <div className="spacer" />
        {editNote && (
          <button type="button" className="btn btn-primary" onClick={dispute}>
            {t('disagreeChange')}
          </button>
        )}
      </div>
    </main>
  );
};
