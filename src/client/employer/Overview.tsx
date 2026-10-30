import React from 'react';
import { Link } from 'react-router-dom';
import type { FlagRecord } from '../../shared/model.js';
import { money, timeAgo } from '../lib/format.js';
import { periodLabel } from '../lib/period.js';
import { Icon, type IconName } from '../components/Icon.js';
import { Card, Empty, Notice, Pill, SectionHead, Skeleton, Tile, type Tone } from '../ui/index.js';
import { useEmployer } from './EmployerApp.js';

export const FLAG_TITLES: Record<string, string> = {
  OUTSIDE_SITE: 'Checked in away from site',
  LOW_ACCURACY: 'Location too imprecise',
  NO_LOCATION: 'No location shared',
  MOCK_LOCATION: 'Fake location on phone',
  QR_INVALID: 'Old or wrong gate code',
  NO_QR: 'Gate code not scanned',
  DEVICE_NOT_APPROVED: 'Unapproved phone',
  SIGNATURE_INVALID: 'Unverifiable check refused',
  INTEGRITY_FAILED: 'Phone failed device check',
  CLOCK_SKEW: 'Phone clock wrong',
  SENT_LATE: 'Sent late (offline)',
  EDIT_CONTRADICTS_EVIDENCE: 'Edit contradicts on-site record',
  EDIT_NEAR_PAYDAY: 'Hours cut just before payday',
  EDITOR_PATTERN: 'Repeated hour cuts by one person',
  PAYMENT_MISMATCH: 'Worker reports underpayment',
  HAZARD_FIX_NO_PHOTO: 'Hazard closed without photo',
  HAZARD_FIX_DISPUTED: 'Reporter says hazard not fixed',
  CLAIM_NO_SHIFT: 'Claim on a day with no check-in',
  CLAIM_EXCEEDS_DAY: 'Claim longer than possible',
  CLAIM_DUPLICATE: 'Duplicate claim',
  CLAIM_NOT_CORROBORATED: 'No one else on site that late',
  HAZARD_NO_PHOTO: 'Hazard reported without photo',
  HAZARD_OUTSIDE_ZONE: 'Reporter not near the zone',
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
  const wp = base.workplace;
  if (!dash) return error ? <Notice kind="error">{error}</Notice> : <Skeleton height={300} />;

  const nameOf = (uid?: string) => dash.people.find((p) => p.uid === uid)?.name ?? 'Someone';
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
        sub: `${h.reporterUids?.length ?? 1} report(s) · ${timeAgo(h.createdAt)}${h.fixDisputed ? ' · fix disputed' : ''}`,
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
            {h.finalSeverity}
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
        title: `${c.kind === 'edit_disagree' ? 'Disputed change' : 'Overtime claim'} · ${c.workerName}`,
        sub:
          c.kind === 'edit_disagree'
            ? `${c.date}: ${c.evidence.originalCheckOut} → ${c.evidence.recordedCheckOut}`
            : `${c.extraHours} h on ${c.date}`,
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
              ? 'Supported'
              : c.matchStatus === 'partly_supported'
                ? 'Partly'
                : 'Not on record'}
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
        title: `${FLAG_TITLES[f.code] ?? f.code} · ${f.subject.kind === 'supervisor' ? nameOf(f.subject.id) : nameOf(f.subject.workerUid)}`,
        sub: f.message,
        pill: (
          <Pill tone={f.concerns === 'employer' ? 'accent' : 'neutral'}>
            {f.concerns === 'employer' ? 'About us' : 'About worker'}
          </Pill>
        ),
        to: 'review?tab=flags',
      })),
    ...dash.people
      .filter((p) => p.pendingDevice)
      .map((p) => ({
        key: `dev-${p.uid}`,
        icon: 'phone' as const,
        tone: undefined,
        title: `New phone to approve · ${p.name}`,
        sub: 'Checks from it are marked for review until approved',
        pill: <Pill tone="accent">Approve</Pill>,
        to: `people/${p.uid}`,
      })),
    ...dash.people
      .filter((p) => !p.rateSet && p.role === 'worker')
      .map((p) => ({
        key: `rate-${p.uid}`,
        icon: 'wallet' as const,
        tone: 'neutral' as const,
        title: `Set a wage · ${p.name}`,
        sub: 'Their payslip stays empty until you do',
        pill: <Pill>Wage</Pill>,
        to: `people/${p.uid}`,
      })),
  ];

  return (
    <>
      <header className="between" style={{ flexWrap: 'wrap' }}>
        <div className="stack-sm">
          <h1 className="t-title">{wp.name}</h1>
          <span className="muted">
            Week {periodLabel(dash.period)} · payday{' '}
            {new Date(`${dash.period.payDate}T00:00:00Z`).toUTCString().slice(0, 11)}
          </span>
        </div>
        <div className="row-flex">
          <Link className="btn btn-secondary btn-sm" to="invite">
            Invite workers
          </Link>
          <Link className="btn btn-primary btn-sm" to="gate" target="_blank">
            Open gate screen
          </Link>
        </div>
      </header>

      <div className="kpis">
        {(
          [
            [
              'On site now',
              `${dash.kpis.onSite} / ${dash.kpis.workers}`,
              `${dash.kpis.workers - dash.kpis.onSite} not checked in`,
              'muted',
            ],
            [
              'Open claims',
              dash.kpis.openClaims,
              'Decide before payday',
              dash.kpis.openClaims ? 'c-warn' : 'muted',
            ],
            [
              'Open hazards',
              dash.kpis.openHazards,
              'Each has a deadline',
              dash.kpis.openHazards ? 'c-danger' : 'muted',
            ],
            ['Overtime owed', money(dash.kpis.overtimeOwed), 'This pay week', 'muted'],
          ] as const
        ).map(([label, value, sub, cls]) => (
          <Card key={label}>
            <span className="t-caption muted">{label}</span>
            <span className="t-title">{value}</span>
            <span className={`t-caption ${cls}`}>{sub}</span>
          </Card>
        ))}
      </div>

      <div className="cols">
        <Card flush>
          <div className="between" style={{ padding: '16px 16px 8px' }}>
            <h2 className="t-headline">Needs your action</h2>
            <span className="t-caption faint">{items.length} items</span>
          </div>
          {items.length === 0 ? (
            <Empty icon="check">
              Nothing waiting. Records are being sealed as people check in.
            </Empty>
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
              title="Near-miss hotspots"
              action={<span className="t-caption faint">30 days</span>}
            />
            {dash.hotspots.map((h) => {
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
            })}
          </Card>
          <Card>
            <SectionHead title="Fatigue watch" />
            {dash.fatigue.length === 0 && (
              <span className="t-caption muted">No one is over the limits.</span>
            )}
            {dash.fatigue.map((f) => (
              <div key={f.workerId} className="between">
                <span className="stack-sm">
                  <span className="t-strong">{f.workerName}</span>
                  <span className="t-caption muted">
                    {[...f.fatigueReasons, ...f.attritionReasons].slice(0, 2).join(' · ')}
                  </span>
                </span>
                <Pill
                  tone={
                    f.fatigueLevel === 'high' || f.attritionLevel === 'high' ? 'danger' : 'warn'
                  }
                >
                  {f.fatigueLevel === 'high' || f.attritionLevel === 'high' ? 'High' : 'Medium'}
                </Pill>
              </div>
            ))}
          </Card>
          <Card tone="subtle">
            <div className="row-flex">
              <Icon name="lock" size={18} />
              <h2 className="t-headline">Team feedback</h2>
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
                  <span className="t-caption muted">
                    {g.count} of {g.threshold} voices. Themes appear once {g.threshold} people have
                    spoken, so no one can be identified.
                  </span>
                )}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
};
