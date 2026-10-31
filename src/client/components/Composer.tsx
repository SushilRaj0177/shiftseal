import React from 'react';
import { HoldToTalk } from './HoldToTalk.js';
import { Icon } from './Icon.js';

interface Props {
  value: string;
  onChange(value: string): void;
  onSubmit(text: string): void;
  onVoice(audioBase64: string, mimeType: string): void;
  label: string;
  placeholder?: string;
  submitLabel: string;
  busy?: boolean;
}

/**
 * One writing surface for anything a worker tells us: type, or hold the mic
 * and speak, then send. Both paths end in the same place.
 */
export const Composer: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  onVoice,
  label,
  placeholder,
  submitLabel,
  busy,
}) => (
  <form
    className={`composer${busy ? ' busy' : ''}`}
    aria-busy={busy}
    onSubmit={(e) => {
      e.preventDefault();
      if (value.trim() && !busy) onSubmit(value.trim());
    }}
  >
    <textarea
      className="composer-text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      rows={4}
      disabled={busy}
    />
    <div className="composer-bar">
      <HoldToTalk compact disabled={busy} onRecorded={onVoice} />
      <button
        type="submit"
        className="btn btn-primary btn-sm composer-send"
        disabled={!value.trim() || busy}
      >
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        {submitLabel}
        {busy ? null : <Icon name="arrowRight" size={18} />}
      </button>
    </div>
  </form>
);
