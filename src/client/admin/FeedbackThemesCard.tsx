import React from 'react';
import type { DashboardPayload } from './dashboardTypes.js';

interface FeedbackThemesCardProps {
  data: DashboardPayload;
}

export const FeedbackThemesCard: React.FC<FeedbackThemesCardProps> = ({ data }) => (
  <section className="card admin-span-full" aria-labelledby="card-feedback">
    <h3 id="card-feedback">6. Anonymous Worker Feedback Themes (k-Anonymity Gate: k ≥ 5)</h3>
    <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '12px' }}>
      Original voice and words are never stored. Themes unlock only when a team has 5 or more
      responses.
    </p>

    {data.feedbackGroups.map((grp) => (
      <div
        key={grp.team}
        style={{
          padding: '14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)',
          background: 'var(--surface-subtle)',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <strong>Team: {grp.team}</strong>
          <span className={grp.visible ? 'badge badge-good' : 'badge badge-warning'}>
            {grp.visible
              ? `✓ ${grp.count}/${grp.threshold} responses (Unlocked)`
              : `${grp.count}/${grp.threshold}, hidden to protect anonymity`}
          </span>
        </div>

        {!grp.visible ? (
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '8px' }}>
            {grp.statusMessage}. Individual responses remain hidden until {grp.threshold} workers
            respond.
          </p>
        ) : (
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              {grp.themes.map((tItem) => (
                <span key={tItem.theme} className="badge badge-accent">
                  {tItem.theme.replace(/_/g, ' ')} ({tItem.count})
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {grp.entries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--surface)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: '1px solid var(--line)',
                  }}
                >
                  "{entry.cleanTextEnglish}"
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: 'var(--ink-secondary)',
                      marginTop: '2px',
                    }}
                  >
                    Scrubbed PII: {entry.removed.join(', ') || 'none'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </section>
);
