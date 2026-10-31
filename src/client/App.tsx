import { Toaster } from './ui/toast.js';
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider.js';
import { LangProvider } from './i18n/LangProvider.js';
import { useApi } from './lib/useApi.js';
import type { MeResponse } from './lib/types.js';
import { Notice, Spinner } from './ui/index.js';
import { Welcome } from './auth/Welcome.js';
import { SignIn } from './auth/SignIn.js';
import { Join } from './auth/Join.js';

const WorkerApp = lazy(() => import('./worker/WorkerApp.js'));
const EmployerApp = lazy(() => import('./employer/EmployerApp.js'));
const CreateWorkplace = lazy(() => import('./employer/CreateWorkplace.js'));

const LAST_WP = 'shiftseal.workplace';

function Splash() {
  return (
    <div className="screen" style={{ display: 'grid', placeItems: 'center' }}>
      <Spinner />
    </div>
  );
}

/** Sends a signed-in person to the right place: join, create, or their workplace. */
function Home() {
  const { data, error } = useApi<MeResponse>('/me');
  const navigate = useNavigate();
  useEffect(() => {
    if (!data) return;
    const intent = sessionStorage.getItem('shiftseal.intent');
    if (data.workplaces.length === 0) {
      navigate(intent === 'employer' ? '/new-workplace' : '/join', { replace: true });
      return;
    }
    let last: string | null = null;
    try {
      last = localStorage.getItem(LAST_WP);
    } catch {
      // storage unavailable
    }
    const wp = data.workplaces.find((w) => w.id === last) ?? data.workplaces[0];
    navigate(wp.role === 'worker' ? `/w/${wp.id}` : `/e/${wp.id}`, { replace: true });
  }, [data, navigate]);
  if (error)
    return (
      <div className="screen">
        <div className="screen-body">
          <Notice kind="error">{error}</Notice>
        </div>
      </div>
    );
  return <Splash />;
}

/** A gate QR opened with the phone's camera app lands here. */
function CheckLink() {
  const location = useLocation();
  const token = location.hash.slice(1);
  const wp = token.split('.')[2];
  if (!wp) return <Navigate to="/" replace />;
  sessionStorage.setItem('shiftseal.pendingScan', token);
  return <Navigate to={`/w/${wp}/check`} replace />;
}

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, user, configError } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (configError)
    return (
      <div className="screen">
        <div className="screen-body">
          <Notice kind="error">{configError}</Notice>
        </div>
      </div>
    );
  if (!user)
    return <Navigate to="/welcome" replace state={{ from: location.pathname + location.hash }} />;
  return <>{children}</>;
}

export function rememberWorkplace(id: string): void {
  try {
    localStorage.setItem(LAST_WP, id);
  } catch {
    // storage unavailable
  }
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Splash />}>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route
                path="/c"
                element={
                  <Gate>
                    <CheckLink />
                  </Gate>
                }
              />
              <Route
                path="/join"
                element={
                  <Gate>
                    <Join />
                  </Gate>
                }
              />
              <Route
                path="/new-workplace"
                element={
                  <Gate>
                    <CreateWorkplace />
                  </Gate>
                }
              />
              <Route
                path="/w/:wp/*"
                element={
                  <Gate>
                    <WorkerApp />
                  </Gate>
                }
              />
              <Route
                path="/e/:wp/*"
                element={
                  <Gate>
                    <EmployerApp />
                  </Gate>
                }
              />
              <Route
                path="*"
                element={
                  <Gate>
                    <Home />
                  </Gate>
                }
              />
            </Routes>
          </Suspense>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
