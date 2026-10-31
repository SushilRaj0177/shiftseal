import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calculateWeekHours, dailyHoursOf } from '../../shared/rules/hours.js';
import { addDays, isWithin } from '../../shared/time.js';
import { computeShiftDurationHours } from '../../shared/rules/hours.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel, hoursLabel, initials, minutesSince, nowHHMM } from '../lib/format.js';
import { firstName } from '../lib/format.js';
import { localeOf } from '../../shared/languages.js';
import { queuedCount } from '../lib/queue.js';
import { useLang } from '../i18n/LangProvider.js';
import { Icon } from '../components/Icon.js';
import { Card, Empty, Notice, Pill, SectionHead, Skeleton, Tile } from '../ui/index.js';
import { DayBars, Grain, Ring } from '../ui/visuals.js';
import { TabBar, useWorker } from './WorkerApp.js';
import type { LimitReading } from '../../shared/rules/limits.js';
import { PaymentPrompt } from './Pay.js';
import { TYPE_KEY } from './Leave.js';

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
  const week = calculateWeekHours(inPeriod, wp);
  const pending = queuedCount(wp.id);
  const elapsed = open ? minutesSince(open.checkInTime, nowHHMM(wp.timezone)) / 60 : 0;
  const shiftLen = Math.max(1, minutesSince(wp.shiftStart, wp.shiftEnd) / 60);
  const progress = Math.min(1, elapsed / shiftLen);
  const dailyLimit = dailyHoursOf(wp);
  const hour = Number(nowHHMM(wp.timezone).slice(0, 2));
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const last7 = overview
    ? Array.from({ length: 7 }, (_, i) => {
        const date = addDays(overview.today, i - 6);
        const s = overview.shifts.find((x) => x.date === date);
        const hours = s?.checkOutTime
          ? computeShiftDurationHours(s.checkInTime, s.checkOutTime).hours
          : 0;
        return {
          label: new Intl.DateTimeFormat(localeOf(lang), {
            weekday: 'narrow',
            timeZone: 'UTC',
          }).format(new Date(`${date}T00:00:00Z`)),
          hours,
          today: i === 6,
        };
      })
    : [];
  const away = overview?.leave.today ?? null;
  const wfh = away?.type === 'wfh';

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="row-flex" style={{ paddingTop: 8 }}>
          <span className="avatar" aria-hidden="true">
            {initials(me.name)}
          </span>
          <div className="grow stack-sm" style={{ gap: 0 }}>
            <span className="t-caption muted">{greeting}</span>
            <h1 className="t-greeting">{firstName(me.name, lang)}</h1>
          </div>
          <Link
            to={`${base}/notifications`}
            className="icon-btn"
            aria-label={t('notifications')}
            style={{ position: 'relative' }}
          >
            <Icon name="bell" size={22} />
            {unread.length > 0 && (
              <span
                aria-label={String(unread.length)}
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--danger)',
                  boxShadow: '0 0 0 2px var(--bg)',
                }}
              />
            )}
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
        {away && (
          <Notice kind="info">
            {wfh ? t('wfhToday') : t('onLeaveToday', t(TYPE_KEY[away.type]).toLowerCase())}
          </Notice>
        )}

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
          <section className="hero stack" aria-label={t('today')}>
            <Grain />
            <div className="between">
              <span className="t-label">
                {t('today')} · {dayLabel(overview.today, lang)}
              </span>
              {open ? <Pill tone="good">{t('onShift')}</Pill> : <Pill>{t('offShift')}</Pill>}
            </div>
            {open ? (
              <>
                <div className="row-flex" style={{ gap: 20 }}>
                  <Ring
                    value={progress}
                    size={112}
                    stroke={9}
                    color="var(--seal)"
                    label={`${Math.round(progress * 100)}% ${t('ofShift')}`}
                  >
                    <span
                      style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.5px' }}
                      className="t-num"
                    >
                      {Math.round(progress * 100)}%
                    </span>
                    <span className="t-caption">{t('ofShift')}</span>
                  </Ring>
                  <div className="stack-sm grow">
                    <span className="t-number" style={{ color: 'var(--on-navy)' }}>
                      {hoursLabel(elapsed)}
                    </span>
                    <span className="t-caption">
                      {t('checkedInAt', open.checkInTime, wp.shiftEnd)}
                    </span>
                  </div>
                </div>
                <Link className="btn btn-light" to={`${base}/check`}>
                  {t('checkOut')}
                </Link>
              </>
            ) : (
              <>
                <div className="stack-sm">
                  <span className="t-number" style={{ color: 'var(--on-navy)' }}>
                    {wp.shiftStart}
                    <span style={{ opacity: 0.45 }}> – {wp.shiftEnd}</span>
                  </span>
                  <span className="seal-line">
                    <Icon name="lock" size={14} />
                    {t('sealed')} · {overview.chain.length}
                  </span>
                </div>
                <Link className="btn btn-light" to={`${base}/check`}>
                  <Icon name={wfh ? 'home' : 'qr'} />
                  {wfh ? t('startWfh') : t('checkIn')}
                </Link>
              </>
            )}
          </section>
        )}

        {overview && (
          <Card>
            <div className="between">
              <span className="t-label">{t('last7')}</span>
            </div>
            <div className="row-flex" style={{ gap: 28 }}>
              <div className="stat">
                <span className="t-caption muted">{t('thisWeek')}</span>
                <b>
                  {week.totalHours}
                  <small className="muted"> {t('hoursUnit')}</small>
                </b>
              </div>
              <div className="stat">
                <span className="t-caption muted">{t('overtime')}</span>
                <b style={{ color: week.otHours ? 'var(--brass)' : undefined }}>
                  {week.otHours}
                  <small className="muted"> {t('hoursUnit')}</small>
                </b>
              </div>
            </div>
            <DayBars days={last7} limit={dailyLimit} />
            {overview.limits.length > 0 && (
              <div className="stack-sm limits" style={{ marginTop: 6 }}>
                {overview.limits.map((r) => (
                  <LimitMeter key={r.id} reading={r} />
                ))}
              </div>
            )}
            <p className="t-note muted">{t('overtimeRule')}</p>
          </Card>
        )}

        <SectionHead title={t('shiftReceipts')} />
        {overview && overview.shifts.length === 0 && (
          <Card>
            <Empty icon="lock">{t('noShifts')}</Empty>
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
                  tone={s.edits.length ? 'warn' : 'seal'}
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

/** One legal limit: what it is, where the worker stands, and when it is crossed. */
const LimitMeter: React.FC<{ reading: LimitReading }> = ({ reading: r }) => {
  const { tx, t } = useLang();
  const share = r.cap > 0 ? r.value / r.cap : 0;
  const over = r.value > r.cap;
  return (
    <div className={`limit${over ? ' over' : share >= 0.8 ? ' near' : ''}`}>
      <div className="between">
        <span className="t-caption">{tx(`limit_${r.id}`)}</span>
        <span className="t-caption t-num">
          <b>{r.value}</b> / {r.cap} {r.id === 'studentDays' ? t('unitDays') : t('hoursUnit')}
        </span>
      </div>
      <div className="limit-track" role="img" aria-label={`${r.value} / ${r.cap}`}>
        <span style={{ width: `${Math.min(100, share * 100)}%` }} />
      </div>
    </div>
  );
};
