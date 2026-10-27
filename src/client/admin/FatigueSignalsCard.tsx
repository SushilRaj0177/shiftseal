import React from 'react';
import type { DashboardPayload } from './dashboardTypes.js';

interface FatigueSignalsCardProps {
  data: DashboardPayload;
}

export const FatigueSignalsCard: React.FC<FatigueSignalsCardProps> = ({ data }) => (
  <section className="card" aria-labelledby="card-fatigue">
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      <div>
        <h3 id="card-fatigue">4. Fatigue & Attrition Signals</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)' }}>
          Calculated strictly from shift records (consecutive days, 60h/7d ceiling, &lt;10h rest
          gaps, overtime trend, missed shifts, disputed claims).{' '}
          <strong>Anonymous feedback is never used for individual worker signals.</strong>
        </p>
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '12px',
      }}
    >
      {data.fatigueSignals
        .filter((s) => s.fatigueLevel !== 'low' || s.attritionLevel !== 'low')
        .map((s) => (
          <div
            key={s.workerId}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              background: 'var(--surface-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <strong>{s.workerName}</strong>
              <span style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>{s.role}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span
                className={
                  s.fatigueLevel === 'high'
                    ? 'badge badge-danger'
                    : s.fatigueLevel === 'medium'
                      ? 'badge badge-warning'
                      : 'badge badge-good'
                }
              >
                Fatigue: {s.fatigueLevel.toUpperCase()}
              </span>
              <span
                className={
                  s.attritionLevel === 'high'
                    ? 'badge badge-danger'
                    : s.attritionLevel === 'medium'
                      ? 'badge badge-warning'
                      : 'badge badge-good'
                }
              >
                Attrition risk: {s.attritionLevel.toUpperCase()}
              </span>
            </div>

            {s.fatigueReasons.length > 0 && (
              <p style={{ fontSize: '13px', marginTop: '8px' }}>
                <strong>Fatigue reasons:</strong> {s.fatigueReasons.join(' · ')}
              </p>
            )}
            {s.attritionReasons.length > 0 && (
              <p
                style={{
                  fontSize: '13px',
                  marginTop: '4px',
                  color: 'var(--ink-secondary)',
                }}
              >
                <strong>Attrition drivers:</strong> {s.attritionReasons.join(' · ')}
              </p>
            )}
          </div>
        ))}
    </div>
  </section>
);
