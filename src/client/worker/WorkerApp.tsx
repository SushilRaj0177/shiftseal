import React, { createContext, useContext, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import type { WorkplaceRecord } from '../../shared/model.js';
import { useApi } from '../lib/useApi.js';
import { registerDevice } from '../lib/device.js';
import { flush } from '../lib/queue.js';
import type { WorkerOverview, WorkplaceResponse } from '../lib/types.js';
import { useLang } from '../i18n/LangProvider.js';
import { Icon } from '../components/Icon.js';
import { Notice, Skeleton } from '../ui/index.js';
import { rememberWorkplace } from '../App.js';
import { Home } from './Home.js';
import { Pay } from './Pay.js';
import { Report } from './Report.js';
import { SpeakUp } from './SpeakUp.js';
import { Claim } from './Claim.js';
import { Shift } from './Shift.js';
import { CheckFlow } from './CheckFlow.js';
import { Notifications } from './Notifications.js';
import { Settings } from './Settings.js';

interface WorkerContextValue {
  wp: WorkplaceRecord;
  me: WorkplaceResponse['member'];
  overview: WorkerOverview | null;
  offline: boolean;
  deviceStatus: 'bound' | 'pending' | 'unknown';
  reload(): Promise<void>;
}

const WorkerContext = createContext<WorkerContextValue | null>(null);

export function useWorker(): WorkerContextValue {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorker outside WorkerApp');
  return ctx;
}

const CACHE = (wp: string) => `shiftseal.overview.${wp}`;

function readCache(wp: string): WorkerOverview | null {
  try {
    const s = localStorage.getItem(CACHE(wp));
    return s ? (JSON.parse(s) as WorkerOverview) : null;
  } catch {
    return null;
  }
}

export const TabBar: React.FC = () => {
  const { t } = useLang();
  const { wp } = useParams();
  const tabs = [
    { to: `/w/${wp}`, label: t('navHome'), icon: 'home' as const, end: true },
    { to: `/w/${wp}/pay`, label: t('navPay'), icon: 'wallet' as const },
    { to: `/w/${wp}/report`, label: t('navReport'), icon: 'alert' as const },
    { to: `/w/${wp}/speak`, label: t('navSpeak'), icon: 'chat' as const },
  ];
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}>
            <Icon name={tab.icon} size={22} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default function WorkerApp() {
  const { wp = '' } = useParams();
  const base = useApi<WorkplaceResponse>(`/workplaces/${wp}`);
  const live = useApi<WorkerOverview>(`/workplaces/${wp}/me`, 15_000);
  const [deviceStatus, setDeviceStatus] = useState<'bound' | 'pending' | 'unknown'>('unknown');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    rememberWorkplace(wp);
    registerDevice(wp)
      .then(setDeviceStatus)
      .catch(() => setDeviceStatus('unknown'));
  }, [wp]);

  useEffect(() => {
    const up = () => {
      setOnline(true);
      void flush().then((n) => {
        if (n > 0) void live.reload();
      });
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    void flush().then((n) => {
      if (n > 0) void live.reload();
    });
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [live.reload]);

  useEffect(() => {
    if (!live.data) return;
    try {
      localStorage.setItem(CACHE(wp), JSON.stringify(live.data));
    } catch {
      // cache is a convenience only
    }
  }, [live.data, wp]);

  if (base.error && !base.data) {
    return (
      <main className="screen">
        <div className="screen-body">
          <Notice kind="error">{base.error}</Notice>
        </div>
      </main>
    );
  }
  if (!base.data) {
    return (
      <main className="screen">
        <div className="screen-body">
          <Skeleton height={56} />
          <Skeleton height={180} />
          <Skeleton height={120} />
        </div>
      </main>
    );
  }

  const value: WorkerContextValue = {
    wp: base.data.workplace,
    me: base.data.member,
    overview: live.data ?? readCache(wp),
    offline: !online || Boolean(live.error && !live.data),
    deviceStatus,
    reload: live.reload,
  };

  return (
    <WorkerContext.Provider value={value}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="pay" element={<Pay />} />
        <Route path="report" element={<Report />} />
        <Route path="speak" element={<SpeakUp />} />
        <Route path="claim" element={<Claim />} />
        <Route path="shift/:date" element={<Shift />} />
        <Route path="check" element={<CheckFlow />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </WorkerContext.Provider>
  );
}
