import { createContext, useContext, useEffect } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import type { Dashboard, WorkplaceResponse } from '../lib/types.js';
import { Icon, type IconName } from '../components/Icon.js';
import { Brand, Notice, Pill, Skeleton } from '../ui/index.js';
import { rememberWorkplace } from '../App.js';
import { Overview } from './Overview.js';
import { People } from './People.js';
import { PersonRecord } from './PersonRecord.js';
import { Review } from './Review.js';
import { Invite, GateDisplay } from './Invite.js';
import { WorkplaceSettings } from './WorkplaceSettings.js';
import { Leave } from './Leave.js';
import { CommitteeInbox, Complaints } from '../complaints/Complaints.js';

interface EmployerContextValue {
  base: WorkplaceResponse;
  dash: Dashboard | null;
  error: string | null;
  reload(): Promise<void>;
}

const EmployerContext = createContext<EmployerContextValue | null>(null);

export function useEmployer(): EmployerContextValue {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error('useEmployer outside EmployerApp');
  return ctx;
}

const NAV: { to: string; label: string; icon: IconName; count?: (d: Dashboard) => number }[] = [
  { to: '', label: 'Overview', icon: 'home' },
  {
    to: 'people',
    label: 'People',
    icon: 'users',
    count: (d) => d.people.filter((p) => p.pendingDevice).length,
  },
  {
    to: 'review',
    label: 'Review',
    icon: 'flag',
    count: (d) => d.kpis.openClaims + d.kpis.openHazards + d.kpis.openFlags,
  },
  { to: 'invite', label: 'Invite & gate', icon: 'qr' },
  { to: 'settings', label: 'Settings', icon: 'settings' },
];

export default function EmployerApp() {
  const { wp = '' } = useParams();
  const base = useApi<WorkplaceResponse>(`/workplaces/${wp}`);
  const dash = useApi<Dashboard>(`/workplaces/${wp}/dashboard`, 20_000);

  useEffect(() => rememberWorkplace(wp), [wp]);

  if (base.error && !base.data)
    return (
      <main className="screen">
        <div className="screen-body">
          <Notice kind="error">{base.error}</Notice>
        </div>
      </main>
    );
  if (!base.data)
    return (
      <div className="dash-main">
        <Skeleton height={56} />
        <Skeleton height={120} />
      </div>
    );

  const value: EmployerContextValue = {
    base: base.data,
    dash: dash.data,
    error: dash.error,
    reload: dash.reload,
  };
  const link = (to: string) => `/e/${wp}${to ? `/${to}` : ''}`;

  return (
    <EmployerContext.Provider value={value}>
      <Routes>
        <Route path="gate" element={<GateDisplay />} />
        <Route path="complaints" element={<Complaints back={`/e/${wp}/settings`} />} />
        <Route path="committee" element={<CommitteeInbox back={`/e/${wp}`} />} />
        <Route
          path="*"
          element={
            <div className="dash">
              <aside className="dash-side" aria-label="Main">
                <Brand />
                <div
                  className="card tone-subtle"
                  style={{ padding: '10px 12px', gap: 0, marginBottom: 12 }}
                >
                  <span className="t-strong">{base.data.workplace.name}</span>
                  <span className="t-caption muted">
                    {dash.data
                      ? `${dash.data.kpis.workers} ${dash.data.kpis.workers === 1 ? 'worker' : 'workers'}`
                      : ' '}
                  </span>
                </div>
                {base.data.member.icMember && (
                  <NavLink to={link('committee')} className="nav-item" style={{ order: 99 }}>
                    <Icon name="lock" />
                    Committee inbox
                  </NavLink>
                )}
                {NAV.map((n) => {
                  const c = dash.data && n.count ? n.count(dash.data) : 0;
                  return (
                    <NavLink key={n.to} to={link(n.to)} end={n.to === ''} className="nav-item">
                      <Icon name={n.icon} />
                      {n.label}
                      {c > 0 && (
                        <span className="count">
                          <Pill>{c}</Pill>
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </aside>
              <main className="dash-main">
                <Routes>
                  <Route index element={<Overview />} />
                  <Route path="people" element={<People />} />
                  <Route path="people/:uid" element={<PersonRecord />} />
                  <Route path="review" element={<Review />} />
                  <Route path="leave" element={<Leave />} />
                  <Route path="invite" element={<Invite />} />
                  <Route path="settings" element={<WorkplaceSettings />} />
                </Routes>
              </main>
              <nav className="tabbar dash-mobile-nav" aria-label="Main">
                <div className="tabbar-inner">
                  {NAV.slice(0, 4).map((n) => (
                    <NavLink key={n.to} to={link(n.to)} end={n.to === ''}>
                      <Icon name={n.icon} size={22} />
                      {n.label.split(' ')[0]}
                    </NavLink>
                  ))}
                </div>
              </nav>
            </div>
          }
        />
      </Routes>
    </EmployerContext.Provider>
  );
}
