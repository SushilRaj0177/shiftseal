import React, { useState } from 'react';
import { Icon } from './Icon.js';
import type { Language } from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';

interface ListenButtonProps {
  text: string;
  lang: Language;
  label?: string;
}

const BCP47_MAP: Record<Language, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
};

export const ListenButton: React.FC<ListenButtonProps> = ({ text, lang, label }) => {
  const [notice, setNotice] = useState<string | null>(null);

  const handleListen = () => {
    setNotice(null);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setNotice(t(lang, 'listeningNotAvailable'));
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetTag = BCP47_MAP[lang];
      utterance.lang = targetTag;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const prefix = lang;
        const matched = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
        if (matched) {
          utterance.voice = matched;
        } else if (lang !== 'en') {
          setNotice(t(lang, 'listeningNotAvailable'));
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      setNotice(t(lang, 'listeningNotAvailable'));
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <button
        type="button"
        className="btn-subtle"
        onClick={handleListen}
        aria-label={`${label || t(lang, 'listen')}: ${text}`}
        style={{ minHeight: '40px', padding: '6px 12px', fontSize: '13px' }}
      >
        <span aria-hidden="true">
          <Icon name="speaker" />
        </span>
        <span>{label || t(lang, 'listen')}</span>
      </button>
      {notice && (
        <span
          role="status"
          aria-live="polite"
          style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}
        >
          {notice}
        </span>
      )}
    </div>
  );
};
