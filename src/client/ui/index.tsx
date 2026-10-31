import React, { useEffect, useState } from 'react';
import { apiImage } from '../lib/api.js';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon.js';
import { LANGUAGES, type Language } from '../../shared/languages.js';
import { InkStamp } from './visuals.js';

export type Tone = 'good' | 'warn' | 'danger' | 'accent' | 'neutral';

export const Pill: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({
  tone = 'neutral',
  children,
}) => <span className={`pill pill-${tone}`}>{children}</span>;

export const Tile: React.FC<{
  icon: IconName;
  tone?: 'good' | 'warn' | 'danger' | 'neutral' | 'seal';
  small?: boolean;
}> = ({ icon, tone, small }) => (
  <span className={`tile${small ? ' sm' : ''}${tone ? ` ${tone}` : ''}`} aria-hidden="true">
    <Icon name={icon} size={small ? 16 : 20} />
  </span>
);

export const Card: React.FC<{
  tone?: 'good' | 'warn' | 'danger' | 'subtle';
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ tone, flush, className, children }) => (
  <section
    className={`card${tone ? ` tone-${tone}` : ''}${flush ? ' flush' : ''}${className ? ` ${className}` : ''}`}
  >
    {children}
  </section>
);

export const Kv: React.FC<{ k: React.ReactNode; v: React.ReactNode; vClass?: string }> = ({
  k,
  v,
  vClass,
}) => (
  <div className="kv">
    <span>{k}</span>
    <span className={vClass}>{v}</span>
  </div>
);

export const Notice: React.FC<{ kind?: 'error' | 'info' | 'warn'; children: React.ReactNode }> = ({
  kind = 'info',
  children,
}) => (
  <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {children}
  </div>
);

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="row-flex" role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span className="muted">{label}</span>
  </div>
);

export const Skeleton: React.FC<{ height: number }> = ({ height }) => (
  <div className="skeleton" style={{ height }} aria-hidden="true" />
);

/**
 * Nothing here yet: a blank record slip with the subject stamped on it, so an
 * empty list still looks like part of a record book rather than a missing page.
 */
export const Empty: React.FC<{ icon?: IconName; children: React.ReactNode }> = ({
  icon = 'doc',
  children,
}) => (
  <div className="empty">
    <span className="empty-art" aria-hidden="true">
      <span className="empty-slip empty-slip-back" />
      <span className="empty-slip">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={`empty-stamp${icon === 'check' ? ' clear' : ''}`}>
        <Icon name={icon} size={22} />
      </span>
    </span>
    <p>{children}</p>
  </div>
);

export const AppBar: React.FC<{
  back?: boolean | string;
  title?: string;
  right?: React.ReactNode;
}> = ({ back, title, right }) => {
  const navigate = useNavigate();
  return (
    <header className="appbar">
      {back ? (
        <button
          type="button"
          className="icon-btn"
          aria-label="Back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
        >
          <Icon name="back" size={24} />
        </button>
      ) : null}
      {title ? <h1 className="t-headline grow">{title}</h1> : <span className="grow" />}
      {right}
    </header>
  );
};

export const Brand: React.FC = () => (
  <span className="brand">
    <img className="brand-mark" src="/brand/mark.png" alt="" aria-hidden="true" />
    <span style={{ letterSpacing: '-0.2px' }}>Shiftseal</span>
  </span>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({
  label,
  children,
  hint,
}) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint ? <small className="t-caption faint">{hint}</small> : null}
  </label>
);

export const Sheet: React.FC<{ title: string; onClose(): void; children: React.ReactNode }> = ({
  title,
  onClose,
  children,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="between">
          <h2 className="t-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const SectionHead: React.FC<{ title: string; action?: React.ReactNode }> = ({
  title,
  action,
}) => (
  <div className="between">
    <h2 className="t-headline">{title}</h2>
    {action}
  </div>
);

/** An image served by the API, which needs the sign-in token. */
export const AuthImage: React.FC<{ path: string; alt: string }> = ({ path, alt }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    apiImage(path)
      .then((u) => setSrc((url = u)))
      .catch(() => setSrc(null));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);
  return src ? (
    <img src={src} alt={alt} style={{ width: '100%', borderRadius: 12 }} />
  ) : (
    <Skeleton height={180} />
  );
};

/** Grid of every supported language, each shown in its own script. */
export const LanguagePicker: React.FC<{
  value: Language;
  onChange(l: Language): void;
  label: string;
}> = ({ value, onChange, label }) => (
  <div className="lang-grid" role="radiogroup" aria-label={label}>
    {LANGUAGES.map((l) => (
      <button
        key={l.code}
        type="button"
        role="radio"
        aria-checked={value === l.code}
        className="choice"
        onClick={() => onChange(l.code)}
      >
        <span className="t-strong" lang={l.code}>
          {l.native}
        </span>
        <span className="t-caption faint">
          {LANGUAGES.filter((x) => x.base === l.base).length > 1 ? l.region : l.english}
        </span>
      </button>
    ))}
  </div>
);

/** The top of a form screen: a marked glyph, the title, and one line of why. */
export const FormHead: React.FC<{
  icon: IconName;
  tone?: 'hazard' | 'voice' | 'pay';
  title: string;
  children?: React.ReactNode;
}> = ({ icon, tone = 'voice', title, children }) => (
  <header className="form-head">
    <span className={`form-glyph ${tone}`} aria-hidden="true">
      <Icon name={icon} size={26} />
    </span>
    <h1 className="t-title">{title}</h1>
    {children ? <p className="muted">{children}</p> : null}
  </header>
);

/** A numbered step heading inside a form. */
export const Step: React.FC<{ n: number; title: string; aside?: React.ReactNode }> = ({
  n,
  title,
  aside,
}) => (
  <h2 className="step">
    <span className="step-n" aria-hidden="true">
      {n}
    </span>
    <span className="grow">{title}</span>
    {aside}
  </h2>
);

/** The moment something is filed: a record slip with the seal pressed on it. */
export const Sealed: React.FC<{
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, children, action }) => (
  <section className="sealed" role="status">
    <div className="sealed-slip">
      <InkStamp className="sealed-stamp" />
      <span className="sealed-lines" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p className="t-headline">{title}</p>
      {children ? <div className="t-caption muted">{children}</div> : null}
    </div>
    {action}
  </section>
);
