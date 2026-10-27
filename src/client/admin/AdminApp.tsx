import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Language } from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';

interface AdminAppProps {
  lang: Language;
}

export const AdminApp: React.FC<AdminAppProps> = ({ lang }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const workplaceId = searchParams.get('workplaceId') || 'wp-tower-b';

  return (
    <div className="container-wide">
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <span className="badge badge-accent">SDG 8 · FairShift Admin</span>
          <h2 style={{ marginTop: '6px' }}>
            {workplaceId === 'wp-campus' ? t(lang, 'adminCampusTitle') : t(lang, 'adminTowerTitle')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={workplaceId === 'wp-tower-b' ? 'btn-primary' : 'btn-subtle'}
            onClick={() => setSearchParams({ workplaceId: 'wp-tower-b' })}
          >
            Tower B Construction Site
          </button>
          <button
            type="button"
            className={workplaceId === 'wp-campus' ? 'btn-primary' : 'btn-subtle'}
            onClick={() => setSearchParams({ workplaceId: 'wp-campus' })}
          >
            Campus Facilities
          </button>
          <Link to="/" className="btn-subtle" style={{ textDecoration: 'none' }}>
            {t(lang, 'switchRole')}
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>Workforce Compliance & Safety Overview</h3>
        <p style={{ marginTop: '8px', color: 'var(--ink-secondary)' }}>
          {t(lang, 'principleBanner')}
        </p>
      </div>
    </div>
  );
};

export default AdminApp;
