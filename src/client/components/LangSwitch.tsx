import React, { useEffect } from 'react';
import type { Language } from '../../shared/types.js';

interface LangSwitchProps {
  lang: Language;
  onChange: (lang: Language) => void;
}

const FONT_URLS: Partial<Record<Language, string>> = {
  ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap',
  hi: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap',
};

export const LangSwitch: React.FC<LangSwitchProps> = ({ lang, onChange }) => {
  useEffect(() => {
    document.documentElement.lang = lang;
    const fontUrl = FONT_URLS[lang];
    if (fontUrl && !document.querySelector(`link[href="${fontUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  }, [lang]);

  const options: { id: Language; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'ta', label: 'தமிழ்' },
    { id: 'hi', label: 'हिंदी' },
  ];

  return (
    <div
      role="group"
      aria-label="Select interface language"
      style={{ display: 'inline-flex', gap: '4px' }}
    >
      {options.map((opt) => {
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            style={{
              minHeight: '38px',
              padding: '6px 10px',
              fontSize: '13px',
              background: active ? 'var(--accent)' : 'var(--surface-subtle)',
              color: active ? '#ffffff' : 'var(--ink)',
              borderColor: active ? 'var(--accent)' : 'var(--line)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
