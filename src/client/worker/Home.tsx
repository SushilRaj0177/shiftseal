import React from 'react';
import { Link } from 'react-router-dom';
import { calculateWeekHours, dailyHoursOf } from '../../shared/rules/hours.js';
import { addDays, isWithin } from '../../shared/time.js';
import { computeShiftDurationHours } from '../../shared/rules/hours.js';
import { dayLabel, hoursLabel, minutesSince, nowHHMM } from '../lib/format.js';
import { localeOf } from '../../shared/languages.js';
import { queuedCount } from '../lib/queue.js';
import { useLang } from '../i18n/LangProvider.js';
import { Icon } from '../components/Icon.js';
import { Card, Empty, Notice, SectionHead, Skeleton, Tile } from '../ui/index.js';
import { periodLabel } from '../lib/period.js';
import { DayBars } from '../ui/visuals.js';
import { TabBar, useWorker } from './WorkerApp.js';
import type { LimitReading } from '../../shared/rules/limits.js';
import { TYPE_KEY } from './Leave.js';

export const Home: React.FC = () => {
  const { t, lang, money } = useLang();
  const { wp, overview, offline, deviceStatus } = useWorker();
  const base = `/w/${wp.id}`;

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
  const todo =
    !!overview?.lastPayslip &&
    !overview.lastPayment &&
    overview.today >= overview.lastPeriod.payDate &&
    overview.lastPayslip.netPay > 0;
  const wfh = away?.type === 'wfh';

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="home-head">
          <div className="stack-sm" style={{ gap: 2 }}>
            {overview && <span className="home-date">{longDate(overview.today, lang)}</span>}
            <h1 className="t-greeting">{greeting}</h1>
          </div>
          <div className="row-flex" style={{ gap: 8 }}>
            <Link
              to={`${base}/notifications`}
              className="round-btn"
              aria-label={t('notifications')}
            >
              <Icon name="bell" size={20} />
              {unread.length > 0 && (
                <span className="round-dot" aria-label={String(unread.length)} />
              )}
            </Link>
            <Link to={`${base}/settings`} className="round-btn" aria-label={t('settings')}>
              <Icon name="settings" size={20} />
            </Link>
          </div>
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
        {away && (
          <Notice kind="info">
            {wfh ? t('wfhToday') : t('onLeaveToday', t(TYPE_KEY[away.type]).toLowerCase())}
          </Notice>
        )}

        {!overview ? (
          <Skeleton height={200} />
        ) : (
          <section className="hero2" aria-label={t('today')}>
            <div className="hero2-status">
              <span className={`hero2-dot${open ? ' on' : ''}`} aria-hidden="true" />
              {open ? t('onShift') : t('offShift')} · {wp.name}
            </div>
            {open ? (
              <>
                <div className="hero2-time t-num">{bigUnits(hoursLabel(elapsed))}</div>
                <div
                  className="hero2-track"
                  role="img"
                  aria-label={`${Math.round(progress * 100)}% ${t('ofShift')}`}
                >
                  <i style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
                <span className="hero2-sub">{t('checkedInAt', open.checkInTime, wp.shiftEnd)}</span>
                <Link className="btn hero2-btn" to={`${base}/check`}>
                  {t('checkOut')}
                </Link>
              </>
            ) : (
              <>
                <div className="hero2-time t-num">
                  {wp.shiftStart}
                  <small> – {wp.shiftEnd}</small>
                </div>
                <span className="hero2-sub">
                  <Icon name="lock" size={13} /> {t('sealed')} · {overview.chain.length}
                </span>
                <Link className="btn hero2-btn" to={`${base}/check`}>
                  <Icon name={wfh ? 'home' : 'qr'} />
                  {wfh ? t('startWfh') : t('checkIn')}
                </Link>
              </>
            )}
          </section>
        )}

        {overview && (todo || edits.length > 0) && (
          <>
            <span className="group-label">{t('toDo')}</span>
            <div className="group">
              {todo && (
                <Link className="group-row" to={`${base}/pay`}>
                  <span className="group-ic">
                    <Icon name="wallet" size={18} />
                  </span>
                  <span className="grow stack-sm" style={{ gap: 2 }}>
                    <span className="t-strong">
                      {t('confirmPayTitle', periodLabel(overview.lastPeriod, lang))}
                    </span>
                    <span className="t-caption muted">{money(overview.lastPayslip!.netPay)}</span>
                  </span>
                  <Icon name="chev" size={18} className="faint" />
                </Link>
              )}
              {edits.map((n) => (
                <Link key={n.id} className="group-row" to={`${base}/shift/${n.date}`}>
                  <span className="group-ic">
                    <Icon name="pencil" size={17} />
                  </span>
                  <span className="grow stack-sm" style={{ gap: 2 }}>
                    <span className="t-strong">{t('changedNotice', dayLabel(n.date, lang))}</span>
                    <span className="t-caption muted">
                      {n.oldValue} → {n.newValue} · {n.supervisorName}
                    </span>
                  </span>
                  <Icon name="chev" size={18} className="faint" />
                </Link>
              ))}
            </div>
          </>
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

/** "Monday, 2 November" in the reader's language. */
function longDate(date: string, lang: string): string {
  return new Intl.DateTimeFormat(localeOf(lang as never), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "3h 47m" with the numbers large and the units small. */
function bigUnits(label: string): React.ReactNode {
  return label
    .split(/(\d+)/)
    .map((part, i) =>
      /^\d+$/.test(part) ? <span key={i}>{part}</span> : <small key={i}>{part.trim()}</small>
    );
}
