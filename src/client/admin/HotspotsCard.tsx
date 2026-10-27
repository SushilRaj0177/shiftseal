import React from 'react';
import { Icon, zoneIcon } from '../components/Icon.js';
import type { DashboardPayload } from './dashboardTypes.js';

interface HotspotsCardProps {
  data: DashboardPayload;
}

export const HotspotsCard: React.FC<HotspotsCardProps> = ({ data }) => {
  const maxHotspotCount = Math.max(5, ...data.hotspots.map((h) => h.reportCount14d));
  return (
    <section className="card" aria-labelledby="card-hotspots">
      <h3 id="card-hotspots">3. Near-Miss Hotspots by Zone (Last 14 Days)</h3>
      <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '14px' }}>
        Workplace policy threshold: 3 or more reports in 14 days triggers a zone hotspot inspection
        alert.
      </p>

      <svg
        role="img"
        aria-label={`Bar chart of safety reports by zone for ${data.workplace.name}`}
        viewBox={`0 0 600 ${data.hotspots.length * 44 + 20}`}
        style={{ width: '100%', maxWidth: '680px', height: 'auto', display: 'block' }}
      >
        {data.hotspots.map((z, idx) => {
          const y = idx * 44 + 12;
          const barMaxW = 320;
          const barW = Math.round((z.reportCount14d / maxHotspotCount) * barMaxW);
          const fill = z.isHotspot ? '#b3261e' : '#2b4c8c';

          return (
            <g key={z.zoneId} transform={`translate(0, ${y})`}>
              <text
                x={4}
                y={20}
                fill="currentColor"
                fontSize="13"
                fontWeight={z.isHotspot ? '700' : '500'}
              >
                <Icon name={zoneIcon(z.zoneName)} /> {z.zoneName}
              </text>
              <rect
                x={175}
                y={4}
                width={barMaxW}
                height={22}
                rx={5}
                fill="rgba(128,128,128,0.14)"
              />
              <rect x={175} y={4} width={Math.max(6, barW)} height={22} rx={5} fill={fill} />
              <text x={508} y={20} fill="currentColor" fontSize="13" fontWeight="700">
                {z.reportCount14d} {z.isHotspot ? 'HOTSPOT' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
};
