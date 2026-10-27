import React from 'react';
import type { DashboardPayload } from './dashboardTypes.js';

interface AttendanceCardProps {
  data: DashboardPayload;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ data }) => (
  <section className="card" aria-labelledby="card-attendance">
    <h3 id="card-attendance">7. Attendance Today ({data.todayDate})</h3>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginTop: '12px',
      }}
    >
      <div
        style={{
          padding: '14px',
          background: 'var(--good-soft)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'var(--good)',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Checked In
        </span>
        <strong style={{ fontSize: '24px', color: 'var(--good)' }}>
          {data.attendanceToday.checkedIn} / {data.attendanceToday.total}
        </strong>
      </div>
      <div
        style={{
          padding: '14px',
          background: 'var(--warning-soft)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'var(--warning)',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Late Arrival
        </span>
        <strong style={{ fontSize: '24px', color: 'var(--warning)' }}>
          {data.attendanceToday.late}
        </strong>
      </div>
      <div
        style={{
          padding: '14px',
          background: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'var(--ink-secondary)',
            fontWeight: 600,
            display: 'block',
          }}
        >
          Not Checked In Yet
        </span>
        <strong style={{ fontSize: '24px' }}>{data.attendanceToday.absent}</strong>
      </div>
    </div>
  </section>
);
