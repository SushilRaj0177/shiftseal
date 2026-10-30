import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calculateWeekHours } from '../../shared/rules/hours.js';
import { isWithin } from '../../shared/time.js';
import { getRule } from '../../shared/rules/index.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel, hoursLabel, initials, minutesSince, nowHHMM } from '../lib/format.js';
import { queuedCount } from '../lib/queue.js';
import { useLang } from '../i18n/LangProvider.js';
import { Icon } from '../components/Icon.js';
import { Card, Notice, Pill, SectionHead, Skeleton, Tile } from '../ui/index.js';
import { TabBar, useWorker } from './WorkerApp.js';
import { PaymentPrompt } from './Pay.js';

export const Home: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, me, overview, offline, deviceStatus, reload } = useWorker();
  const navigate = useNavigate();
  const [note, setNote] = useState<string | null>(null);
  const base = `/w/${wp.id}`;

  const respond = async (notificationId: string, response: 'acknowledged' | 'disputed') => {
    try {
      await api(`/workplaces/${wp.id}/notifications/respond`, {
        body: { notificationId, response },
      });
      if (response === 'disputed') setNote(t('disputeSent'));
      await reload();
    } catch (err) {
      setNote(errorMessage(err));
    }
  };

  const unread = overview?.notifications.filter((n) => n.status === 'unread') ?? [];
  const edits = unread.filter((n) => n.type === 'SHIFT_EDITED');
  const open = overview?.openShift ?? null;
  const inPeriod = overview
    ? overview.shifts.filter((s) => isWithin(s.date, overview.period.start, overview.period.end))
    : [];
  const week = calculateWeekHours(inPeriod, wp.sector);
  const weeklyLimit = getRule(wp.sector, 'ot.weekly').value;
  const pending = queuedCount(wp.id);
  const elapsed = open ? minutesSince(open.checkInTime, nowHHMM(wp.timezone)) / 60 : 0;

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="row-flex" style={{ paddingTop: 8 }}>
          <span className="avatar" aria-hidden="true">
            {initials(me.name)}
          </span>
          <div className="grow stack-sm" style={{ gap: 0 }}>
            <span className="t-headline">{me.name}</span>
            <span className="t-caption muted">
              {wp.name} · {me.title}
            </span>
          </div>
          <Link to={`${base}/notifications`} className="icon-btn" aria-label={t('notifications')}>
            <Icon name="bell" size={22} />
            {unread.length > 0 && <span className="sr-only">{unread.length}</span>}
          </Link>
          <Link to={`${base}/settings`} className="icon-btn" aria-label={t('settings')}>
            <Icon name="settings" size={22} />
          </Link>
        </header>

        {offline && <Notice kind="warn">{t('offline')}</Notice>}
        {pending > 0 && <Notice kind="info">{t('queuedCount', pending)}</Notice>}
        {deviceStatus === 'pending' && (
          <Notice kind="warn">
            <span>
              <strong>{t('newPhoneTitle')}.</strong> {t('newPhoneBody')}
            </span>
          </Notice>
        )}
        {note && <Notice kind="info">{note}</Notice>}

        {edits.map((n) => (
          <Card key={n.id} tone="warn">
            <div className="row-flex" style={{ alignItems: 'flex-start' }}>
              <span className="c-warn">
                <Icon name="pencil" size={18} />
              </span>
              <div className="grow stack-sm">
                <span className="t-strong">{t('changedNotice', dayLabel(n.date, lang))}</span>
                <span className="t-caption muted">
                  {t(
                    'changedDetail',
                    n.oldValue ?? '',
                    n.newValue ?? '',
                    n.supervisorName ?? '',
                    n.reason
                  )}
                </span>
                <div className="row-flex" style={{ gap: 20, paddingTop: 6 }}>
                  <button
                    type="button"
                    className="link-btn c-warn"
                    onClick={() => navigate(`${base}/shift/${n.date}`)}
                  >
                    {t('review')}
                  </button>
                  <button
                    type="button"
                    className="link-btn c-warn"
                    onClick={() => respond(n.id, 'disputed')}
                  >
                    {t('iDisagree')}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {overview && <PaymentPrompt compact />}

        {!overview ? (
          <Skeleton height={200} />
        ) : (
          <Card>
            <div className="between">
              <span className="t-label">
                {t('today')} · {dayLabel(overview.today, lang)}
              </span>
              {open ? <Pill tone="good">{t('onShift')}</Pill> : <Pill>{t('offShift')}</Pill>}
            </div>
            {open ? (
              <>
                <div className="stack-sm">
                  <span className="t-number">{hoursLabel(elapsed)}</span>
                  <span className="t-caption muted">
                    {t('checkedInAt', open.checkInTime, wp.shiftEnd)}
                  </span>
                </div>
                <div className="progress" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.min(100, (elapsed / Math.max(1, minutesSince(wp.shiftStart, wp.shiftEnd) / 60)) * 100)}%`,
                    }}
                  />
                </div>
                <Link className="btn btn-secondary" to={`${base}/check`}>
                  {t('checkOut')}
                </Link>
              </>
            ) : (
              <>
                <span className="t-caption muted">
                  {t('shiftHours', wp.shiftStart, wp.shiftEnd)}
                </span>
                <Link className="btn btn-primary" to={`${base}/check`}>
                  <Icon name="qr" />
                  {t('checkIn')}
                </Link>
              </>
            )}
          </Card>
        )}

        {overview && (
          <div className="grid-2">
            <Card>
              <span className="t-label">{t('thisWeek')}</span>
              <span className="t-title">{week.totalHours} h</span>
              <span className="t-caption muted">{t('ofLimit', weeklyLimit)}</span>
            </Card>
            <Card>
              <span className="t-label">{t('overtime')}</span>
              <span className="t-title">{week.otHours} h</span>
              <span className="t-caption c-good">{t('paidAt2x')}</span>
            </Card>
          </div>
        )}

        <SectionHead title={t('shiftReceipts')} />
        {overview && overview.shifts.length === 0 && (
          <Card tone="subtle">
            <p className="muted">{t('noShifts')}</p>
          </Card>
        )}
        {overview && overview.shifts.length > 0 && (
          <div className="card flush">
            {overview.shifts.slice(0, 7).map((s) => (
              <Link
                key={s.date}
                className="list-row"
                to={`${base}/shift/${s.date}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Tile
                  icon={s.edits.length ? 'pencil' : 'lock'}
                  tone={s.edits.length ? 'warn' : undefined}
                />
                <span className="grow stack-sm" style={{ gap: 0 }}>
                  <span className="t-strong">{dayLabel(s.date, lang)}</span>
                  <span className="t-caption muted">
                    {s.checkInTime} – {s.checkOutTime ?? '…'}
                    {s.edits.length ? ` · ${t('edited')}` : ''}
                  </span>
                </span>
                <Icon name="chev" size={18} className="faint" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <TabBar />
    </main>
  );
};
