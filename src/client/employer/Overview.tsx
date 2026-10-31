import React from 'react';
import { Link } from 'react-router-dom';
import type { FlagRecord } from '../../shared/model.js';
import { dayLabel, firstName, timeAgo } from '../lib/format.js';
import { baseOf } from '../../shared/languages.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { TYPE_KEY } from '../worker/Leave.js';
import { periodLabel } from '../lib/period.js';
import { Icon, type IconName } from '../components/Icon.js';
import { Card, Empty, Notice, Pill, SectionHead, Skeleton, Tile, type Tone } from '../ui/index.js';
import { useEmployer } from './EmployerApp.js';
import { Grain, Ring } from '../ui/visuals.js';

/** A flag's title in the reader's language. The no-handler title names the country's own body. */
export function flagTitle(code: string, tx: (k: string) => string): string {
  if (code === 'COMPLAINTS_NO_HANDLER') return tx('flagNoHandler');
  return tx(`ft_${code}`) || code;
}

/** Fatigue, attrition and burnout reasons, said in the reader's language. */
export function whyText(
  why: { code: string; args: number[] }[] | undefined,
  tx: (k: string, ...a: (string | number)[]) => string
): string {
  return (why ?? []).map((w) => tx(`why_${w.code}`, ...w.args)).join(' · ');
}

export const SEV_KEY: Record<string, StringKey> = {
  low: 'sevLow',
  medium: 'sevMedium',
  high: 'sevHigh',
  critical: 'sevCritical',
};

export function flagTone(f: FlagRecord): Tone {
  return f.severity === 'serious' ? 'danger' : f.severity === 'review' ? 'warn' : 'neutral';
}

interface ActionItem {
  key: string;
  icon: IconName;
  tone: 'danger' | 'warn' | 'neutral' | undefined;
  title: string;
  sub: string;
  pill: React.ReactNode;
  to: string;
}

export const Overview: React.FC = () => {
  const { base, dash, error } = useEmployer();
  const { t, tx, lang, money } = useLang();
  const wp = base.workplace;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  if (!dash) return error ? <Notice kind="error">{error}</Notice> : <Skeleton height={300} />;

  const nameOf = (uid?: string) => dash.people.find((p) => p.uid === uid)?.name ?? t('eSomeone');
  const items: ActionItem[] = [
    ...dash.hazards
      .filter((h) => h.status !== 'resolved')
      .map((h) => ({
        key: h.id,
        icon: 'alert' as const,
        tone: (h.finalSeverity === 'low'
          ? 'neutral'
          : h.finalSeverity === 'medium'
            ? 'warn'
            : 'danger') as ActionItem['tone'],
        title: `${h.englishSummary.slice(0, 60)} · ${h.zoneName}`,
        sub: `${t('eReports', h.reporterUids?.length ?? 1)} · ${timeAgo(h.createdAt, lang)}${h.fixDisputed ? ` · ${t('eFixDisputed')}` : ''}`,
        pill: (
          <Pill
            tone={
              h.finalSeverity === 'low'
                ? 'neutral'
                : h.finalSeverity === 'medium'
                  ? 'warn'
                  : 'danger'
            }
          >
            {t(SEV_KEY[h.finalSeverity])}
          </Pill>
        ),
        to: 'review?tab=hazards',
      })),
    ...dash.claims
      .filter((c) => c.resolutionStatus === 'pending')
      .map((c) => ({
        key: c.id,
        icon: c.kind === 'edit_disagree' ? ('pencil' as const) : ('clock' as const),
        tone: 'warn' as const,
        title: `${c.kind === 'edit_disagree' ? t('eDisputedChange') : t('eOvertimeClaim')} · ${c.workerName}`,
        sub:
          c.kind === 'edit_disagree'
            ? `${c.date}: ${c.evidence.originalCheckOut} → ${c.evidence.recordedCheckOut}`
            : t('eHoursOn', c.extraHours, dayLabel(c.date, lang)),
        pill: (
          <Pill
            tone={
              c.matchStatus === 'supported'
                ? 'good'
                : c.matchStatus === 'partly_supported'
                  ? 'warn'
                  : 'neutral'
            }
          >
            {c.matchStatus === 'supported'
              ? t('eSupported')
              : c.matchStatus === 'partly_supported'
                ? t('ePartly')
                : t('eNotOnRecord')}
          </Pill>
        ),
        to: 'review?tab=claims',
      })),
    ...dash.flags
      .filter((f) => f.status === 'open' && f.severity === 'serious')
      .map((f) => ({
        key: f.id,
        icon: 'flag' as const,
        tone: 'danger' as const,
        title: `${flagTitle(f.code, tx)}${f.subject.kind === 'workplace' && !f.subject.workerUid ? '' : ` · ${f.subject.kind === 'supervisor' ? nameOf(f.subject.id) : nameOf(f.subject.workerUid)}`}`,
        sub: baseOf(lang) === 'en' ? f.message : timeAgo(f.createdAt, lang),
        pill: (
          <Pill tone={f.concerns === 'employer' ? 'accent' : 'neutral'}>
            {f.concerns === 'employer' ? t('eAboutUs') : t('eAboutWorker')}
          </Pill>
        ),
        to: 'review?tab=flags',
      })),
    ...dash.leave.pending.map((r) => ({
      key: r.id,
      icon: 'clock' as const,
      tone: undefined,
      title: `${t('eLeaveRequest')} · ${r.workerName}`,
      sub: `${t(TYPE_KEY[r.type])} · ${dayLabel(r.from, lang)}${r.to !== r.from ? ` – ${dayLabel(r.to, lang)}` : ''} · ${t('daysCount', r.days)}`,
      pill: <Pill tone="warn">{t('eDecide')}</Pill>,
      to: 'leave',
    })),
    ...dash.people
      .filter((p) => p.pendingDevice)
      .map((p) => ({
        key: `dev-${p.uid}`,
        icon: 'phone' as const,
        tone: undefined,
        title: `${t('eNewPhone')} · ${p.name}`,
        sub: t('eNewPhoneSub'),
        pill: <Pill tone="accent">{t('eApprove')}</Pill>,
        to: `people/${p.uid}`,
      })),
    ...dash.people
      .filter((p) => !p.rateSet && p.role === 'worker')
      .map((p) => ({
        key: `rate-${p.uid}`,
        icon: 'wallet' as const,
        tone: 'neutral' as const,
        title: `${t('eSetWage')} · ${p.name}`,
        sub: t('eSetWageSub'),
        pill: <Pill>{t('eWage')}</Pill>,
        to: `people/${p.uid}`,
      })),
  ];

  return (
    <>
      <header className="dash-greeting">
        <div className="stack-sm">
          <span className="t-eyebrow">{wp.name}</span>
          <h1 className="t-display page-title">
            {t('eGreeting', greeting, firstName(base.member.name, lang))}
          </h1>
          <span className="muted">
            {t('ePayPeriod', periodLabel(dash.period, lang), dayLabel(dash.period.payDate, lang))}
          </span>
        </div>
        <div className="row-flex">
          <Link className="btn btn-secondary btn-sm" to="invite">
            <Icon name="plus" size={16} />
            {t('eInvite')}
          </Link>
          <Link className="btn btn-primary btn-sm" to="gate" target="_blank">
            <Icon name="qr" size={16} />
            {t('eGateScreen')}
          </Link>
        </div>
      </header>

      <div className="kpis">
        <section className="hero onsite">
          <Grain />
          <div className="onsite-main">
            <span className="t-label">{t('eOnSite')}</span>
            <span className="onsite-count">
              <span className="t-number">{dash.kpis.onSite}</span>
              <span className="onsite-of">/ {dash.kpis.workers}</span>
            </span>
            {dash.leave.today.length > 0 && (
              <span className="t-caption">{t('eAway', dash.leave.today.length)}</span>
            )}
          </div>
          <Ring
            value={dash.kpis.workers ? dash.kpis.onSite / dash.kpis.workers : 0}
            size={84}
            stroke={8}
            color="var(--seal)"
            label={t('eOnSite')}
          >
            <span className={`onsite-pulse${dash.kpis.onSite ? ' live' : ''}`} />
          </Ring>
        </section>
        {(
          [
            [
              'clock',
              t('eOpenClaims'),
              dash.kpis.openClaims,
              t('eDecideBeforePayday'),
              dash.kpis.openClaims ? 'warn' : 'calm',
            ],
            [
              'alert',
              t('eOpenHazards'),
              dash.kpis.openHazards,
              t('eEachDeadline'),
              dash.kpis.openHazards ? 'danger' : 'calm',
            ],
            [
              'wallet',
              t('eOvertimeOwed'),
              money(dash.kpis.overtimeOwed),
              t('eThisPeriod'),
              dash.kpis.overtimeOwed ? 'brass' : 'calm',
            ],
          ] as [IconName, string, string | number, string, string][]
        ).map(([icon, label, value, sub, tone]) => (
          <section key={label} className={`stat-card ${tone}`}>
            <div className="stat-card-top">
              <Icon name={icon} size={18} />
              <span className="stat-card-label">{label}</span>
            </div>
            <span className="stat-card-value">{value}</span>
            <span className="t-caption faint">{sub}</span>
          </section>
        ))}
      </div>

      <div className="cols">
        <Card flush>
          <div className="between" style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">{t('eNeedsAction')}</h2>
            <span className="t-caption faint">{t('eItems', items.length)}</span>
          </div>
          {items.length === 0 ? (
            <Empty icon="check">{t('eNothingWaiting')}</Empty>
          ) : (
            items.map((it) => (
              <Link
                key={it.key}
                to={it.to}
                className="list-row"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Tile icon={it.icon} tone={it.tone} />
                <span className="grow stack-sm" style={{ gap: 0 }}>
                  <span className="t-strong">{it.title}</span>
                  <span className="t-caption muted">{it.sub}</span>
                </span>
                {it.pill}
                <Icon name="chev" size={16} className="faint" />
              </Link>
            ))
          )}
        </Card>

        <div className="stack">
          <Card>
            <SectionHead
              title={t('eHotspots')}
              action={<span className="t-caption faint">{t('eLast30')}</span>}
            />
            {dash.hotspots.every((h) => h.count === 0) ? (
              <div className="zone-chips">
                {dash.hotspots.map((h) => (
                  <span key={h.code} className="zone-chip">
                    <Icon name="check" size={13} />
                    {h.name}
                  </span>
                ))}
              </div>
            ) : (
              dash.hotspots.map((h) => {
                const max = Math.max(1, ...dash.hotspots.map((x) => x.count));
                return (
                  <div key={h.code} className="stack-sm">
                    <div className="between">
                      <span>{h.name}</span>
                      <span className="t-strong">{h.count}</span>
                    </div>
                    <div className="progress">
                      <span
                        style={{
                          width: `${(h.count / max) * 100}%`,
                          background: h.isHotspot
                            ? 'var(--danger)'
                            : h.count
                              ? 'var(--warn)'
                              : 'transparent',
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </Card>
          <Card>
            <SectionHead title={t('eFatigue')} />
            {dash.fatigue.length === 0 && (
              <span className="t-caption muted">{t('eNoFatigue')}</span>
            )}
            {dash.fatigue.map((f) => (
              <div key={f.workerId} className="between">
                <span className="stack-sm">
                  <span className="t-strong">{f.workerName}</span>
                  <span className="t-caption muted">{whyText(f.why?.slice(0, 2), tx)}</span>
                </span>
                <Pill
                  tone={
                    f.fatigueLevel === 'high' || f.attritionLevel === 'high' ? 'danger' : 'warn'
                  }
                >
                  {f.fatigueLevel === 'high' || f.attritionLevel === 'high'
                    ? t('sevHigh')
                    : t('sevMedium')}
                </Pill>
              </div>
            ))}
          </Card>
          {dash.burnout.length > 0 && (
            <Card>
              <SectionHead title={t('eBurnout')} />
              {dash.burnout.map((b) => (
                <div key={b.workerId} className="between">
                  <span className="stack-sm">
                    <span className="t-strong">{b.workerName}</span>
                    <span className="t-caption muted">{whyText(b.why, tx)}</span>
                  </span>
                  <Pill tone={b.level === 'high' ? 'danger' : 'warn'}>
                    {b.level === 'high' ? t('sevHigh') : t('sevMedium')}
                  </Pill>
                </div>
              ))}
            </Card>
          )}
          <Card>
            <SectionHead title={t('committeeLabel')} />
            {dash.complaints.committeeSize === 0 ? (
              <span className="t-caption c-warn">{t('eNoHandlers')}</span>
            ) : (
              <span className="t-caption muted">
                {t('eComplaintCounts', dash.complaints.open, dash.complaints.overdue)}{' '}
                {t('eHandlersOnly', dash.complaints.committeeSize)}
              </span>
            )}
          </Card>
          <Card tone="subtle">
            <div className="row-flex">
              <Icon name="lock" size={18} />
              <h2 className="t-headline">{t('eTeamFeedback')}</h2>
            </div>
            {dash.feedbackGroups.map((g) => (
              <div key={g.team} className="stack-sm">
                <span className="t-strong">{g.team}</span>
                {g.visible && g.themes?.length ? (
                  <span className="t-caption">
                    {g.themes
                      .map((th) => `${th.theme.replace(/_/g, ' ')} (${th.count})`)
                      .join(', ')}
                  </span>
                ) : (
                  <span className="t-caption muted">{t('eVoices', g.count, g.threshold)}</span>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
};
