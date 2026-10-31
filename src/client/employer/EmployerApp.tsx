import { createContext, useContext, useEffect } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useLang } from '../i18n/LangProvider.js';
import type { Dashboard, WorkplaceResponse } from '../lib/types.js';
import type { StringKey } from '../i18n/strings.js';
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

/** The top of every employer page: the workplace, the page, and its main action. */
export const PageHead: React.FC<{
  title: string;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, sub, action, className }) => {
  const { base } = useEmployer();
  return (
    <header className={`page-head${className ? ` ${className}` : ''}`}>
      <div className="stack-sm">
        <span className="t-eyebrow">{base.workplace.name}</span>
        <h1 className="t-display page-title">{title}</h1>
        {sub ? <span className="muted">{sub}</span> : null}
      </div>
      {action ? <div className="row-flex">{action}</div> : null}
    </header>
  );
};

export function useEmployer(): EmployerContextValue {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error('useEmployer outside EmployerApp');
  return ctx;
}

const NAV: { to: string; label: StringKey; icon: IconName; count?: (d: Dashboard) => number }[] = [
  { to: '', label: 'eNavOverview', icon: 'home' },
  {
    to: 'people',
    label: 'eNavPeople',
    icon: 'users',
    count: (d) => d.people.filter((p) => p.pendingDevice).length,
  },
  {
    to: 'review',
    label: 'eNavReview',
    icon: 'flag',
    count: (d) => d.kpis.openClaims + d.kpis.openHazards + d.kpis.openFlags,
  },
  { to: 'leave', label: 'eNavLeave', icon: 'clock', count: (d) => d.kpis.pendingLeave },
  { to: 'invite', label: 'eNavInvite', icon: 'qr' },
  { to: 'settings', label: 'eNavSettings', icon: 'settings' },
];

export default function EmployerApp() {
  const { wp = '' } = useParams();
  const base = useApi<WorkplaceResponse>(`/workplaces/${wp}`);
  const dash = useApi<Dashboard>(`/workplaces/${wp}/dashboard`, 20_000);
  const { setWorkplaceCountry, t } = useLang();
  const country = base.data?.workplace.country ?? (base.data ? 'IN' : null);
  useEffect(() => {
    setWorkplaceCountry(country);
    return () => setWorkplaceCountry(null);
  }, [country, setWorkplaceCountry]);

  useEffect(() => rememberWorkplace(wp), [wp]);
  const wpName = base.data?.workplace.name;
  useEffect(() => {
    if (wpName) document.title = `${wpName} · Shiftseal`;
  }, [wpName]);

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
              <aside className="dash-side" aria-label={t('eNavMain')}>
                <Brand />
                <div className="workplace-chip">
                  <span className="t-strong" style={{ display: 'block' }}>
                    {base.data.workplace.name}
                  </span>
                  <span className="t-caption" style={{ color: 'var(--on-navy-2)' }}>
                    {dash.data ? t('ePeopleCount', dash.data.kpis.workers) : ' '}
                  </span>
                </div>
                {base.data.member.icMember && (
                  <NavLink to={link('committee')} className="nav-item" style={{ order: 99 }}>
                    <Icon name="lock" />
                    {t('committeeInbox')}
                  </NavLink>
                )}
                {NAV.map((n) => {
                  const c = dash.data && n.count ? n.count(dash.data) : 0;
                  return (
                    <NavLink key={n.to} to={link(n.to)} end={n.to === ''} className="nav-item">
                      <Icon name={n.icon} />
                      {t(n.label)}
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
              <nav className="tabbar dash-mobile-nav" aria-label={t('eNavMain')}>
                <div className="tabbar-inner">
                  {NAV.slice(0, 4).map((n) => (
                    <NavLink key={n.to} to={link(n.to)} end={n.to === ''}>
                      <Icon name={n.icon} size={22} />
                      {t(`${n.label}Short` as StringKey) || t(n.label)}
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
