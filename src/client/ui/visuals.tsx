import React, { useMemo } from 'react';

/**
 * Engraved "seal" line pattern, in the spirit of the guilloché on banknotes and
 * certificates. Pure SVG, generated once; used behind hero cards.
 */
export const Guilloche: React.FC<{ className?: string; opacity?: number }> = ({
  className,
  opacity = 0.16,
}) => {
  const paths = useMemo(() => {
    const out: string[] = [];
    const cx = 200;
    const cy = 200;
    for (let k = 0; k < 14; k++) {
      const R = 120 + k * 9;
      const r = 18 + (k % 4) * 4;
      const n = 9 + (k % 3);
      let d = '';
      for (let i = 0; i <= 720; i++) {
        const tt = (i / 720) * Math.PI * 2;
        const rad = R + r * Math.sin(n * tt + k * 0.35);
        const x = cx + rad * Math.cos(tt);
        const y = cy + rad * Math.sin(tt);
        d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      out.push(d + 'Z');
    }
    return out;
  }, []);
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="0.6" opacity={opacity}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
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
