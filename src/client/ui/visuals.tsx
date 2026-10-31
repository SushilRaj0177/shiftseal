import React, { useMemo } from 'react';

/** Fine paper grain over dark hero surfaces: depth without a pattern. */
export const Grain: React.FC = () => <span className="grain" aria-hidden="true" />;

/**
 * The welcome screen's picture of what Shiftseal does: a paper time card for
 * the week, one checkout visibly corrected, sealed with an ink stamp. Days are
 * written in the reader's own language; everything else is numbers.
 */
export const TimeCard: React.FC<{ locale: string }> = ({ locale }) => {
  const days = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2026-10-26 is a Monday.
    return [0, 1, 2, 3, 4, 5].map((i) => fmt.format(new Date(Date.UTC(2026, 9, 26 + i, 12))));
  }, [locale]);
  const rows: { in: string; out: string; was?: string; h: string; ot?: boolean }[] = [
    { in: '07:58', out: '17:04', h: '9.1' },
    { in: '08:02', out: '17:31', was: '16:30', h: '9.5' },
    { in: '07:55', out: '18:40', h: '10.7', ot: true },
    { in: '08:00', out: '17:02', h: '9.0' },
    { in: '07:57', out: '17:10', h: '9.2' },
    { in: '08:05', out: '13:00', h: '4.9' },
  ];
  return (
    <div className="timecard-stack" aria-hidden="true">
      <div className="timecard timecard-back" />
      <div className="timecard">
        <div className="timecard-head">
          <span className="timecard-mark">
            <span />
          </span>
          <span className="timecard-no">No. 0044</span>
        </div>
        <div className="timecard-rows">
          {rows.map((r, i) => (
            <div key={i} className={`timecard-row${r.was ? ' edited' : ''}${r.ot ? ' ot' : ''}`}>
              <span className="d">{days[i]}</span>
              <span className="t">{r.in}</span>
              <span className="t out">
                {r.was && <s>{r.was}</s>}
                {r.out}
              </span>
              <span className="h">{r.h}</span>
            </div>
          ))}
        </div>
        <div className="timecard-foot">
          <span>Σ</span>
          <span className="h">52.4</span>
        </div>
        <InkStamp className="timecard-stamp" />
      </div>
    </div>
  );
};

/** A rubber-stamp impression in seal vermilion, with a rough inked edge. */
export const InkStamp: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <defs>
      <filter id="ink-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
      <filter id="ink-wear">
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="n" />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.62"
          result="holes"
        />
        <feComposite in="SourceGraphic" in2="holes" operator="in" />
      </filter>
      <path id="stamp-arc" d="M60 60 m-41 0 a41 41 0 1 1 82 0 a41 41 0 1 1 -82 0" />
    </defs>
    <g fill="none" stroke="currentColor" filter="url(#ink-rough)">
      <g filter="url(#ink-wear)">
        <circle cx="60" cy="60" r="55" strokeWidth="4" />
        <circle cx="60" cy="60" r="48" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="31" strokeWidth="1.5" />
        <text
          fill="currentColor"
          stroke="none"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="3.1"
          fontFamily="var(--font)"
        >
          <textPath href="#stamp-arc">SHIFTSEAL · SEALED RECORD ·</textPath>
        </text>
        <path
          d="M47 61 l9 9 l18 -20"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  </svg>
);

/** A gate QR poster in a camera viewfinder, with the scan line moving across it. */
export const GateScene: React.FC = () => {
  // A fixed, decorative QR-like grid (not a real code).
  const cells = useMemo(() => {
    const out: [number, number][] = [];
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let y = 0; y < 17; y++)
      for (let x = 0; x < 17; x++) {
        const finder = (x < 5 && y < 5) || (x > 11 && y < 5) || (x < 5 && y > 11);
        if (!finder && rnd() > 0.52) out.push([x, y]);
      }
    return out;
  }, []);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect
        x={x}
        y={y}
        width="5"
        height="5"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x={x + 1.5} y={y + 1.5} width="2" height="2" rx="0.4" fill="currentColor" />
    </g>
  );
  return (
    <div className="gate-scene" aria-hidden="true">
      <div className="gate-poster">
        <svg viewBox="-0.5 -0.5 18 18">
          {cells.map(([x, y]) => (
            <rect
              key={`${x}.${y}`}
              x={x + 0.1}
              y={y + 0.1}
              width="0.8"
              height="0.8"
              rx="0.15"
              fill="currentColor"
            />
          ))}
          {finder(0, 0)}
          {finder(12, 0)}
          {finder(0, 12)}
        </svg>
        <span className="gate-scanline" />
      </div>
      <span className="vf vf-tl" />
      <span className="vf vf-tr" />
      <span className="vf vf-bl" />
      <span className="vf vf-br" />
    </div>
  );
};

/** A circular progress ring. `value` is 0 to 1. */
export const Ring: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
  children?: React.ReactNode;
  label?: string;
}> = ({
  value,
  size = 120,
  stroke = 10,
  track = 'var(--ring-track)',
  color = 'currentColor',
  children,
  label,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={v > 0 ? color : 'transparent'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-value"
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
};

/** Small daily bar chart. Bars above `limit` are drawn in the overtime colour. */
export const DayBars: React.FC<{
  days: { label: string; hours: number; today?: boolean }[];
  limit: number;
  max?: number;
}> = ({ days, limit, max }) => {
  const top = Math.max(max ?? 0, limit + 2, ...days.map((d) => d.hours));
  return (
    <div
      className="daybars"
      role="img"
      aria-label={days.map((d) => `${d.label} ${d.hours} hours`).join(', ')}
    >
      <div
        className="daybars-limit"
        style={{ bottom: `${(limit / top) * 100}%` }}
        aria-hidden="true"
      />
      {days.map((d, i) => (
        <div key={i} className={`daybar${d.today ? ' today' : ''}`} aria-hidden="true">
          <div className="daybar-track">
            <span style={{ height: `${(Math.min(d.hours, limit) / top) * 100}%` }} />
            {d.hours > limit && (
              <span className="ot" style={{ height: `${((d.hours - limit) / top) * 100}%` }} />
            )}
          </div>
          <small>{d.label}</small>
        </div>
      ))}
    </div>
  );
};

/** A single stacked bar showing how an amount is made up. */
export const Composition: React.FC<{
  parts: { value: number; color: string; label: string }[];
}> = ({ parts }) => {
  const total = parts.reduce((n, p) => n + Math.max(0, p.value), 0) || 1;
  return (
    <div
      className="composition"
      role="img"
      aria-label={parts.map((p) => `${p.label} ${Math.round(p.value)}`).join(', ')}
    >
      {parts
        .filter((p) => p.value > 0)
        .map((p) => (
          <span key={p.label} style={{ flexGrow: p.value / total, background: p.color }} />
        ))}
    </div>
  );
};
