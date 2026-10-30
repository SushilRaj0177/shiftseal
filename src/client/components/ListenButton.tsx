import React from 'react';
import { Icon } from './Icon.js';
import { useLang } from '../i18n/LangProvider.js';
import { localeOf } from '../../shared/languages.js';

/** Reads text aloud in the worker's language, when the phone has a voice for it. */
export const ListenButton: React.FC<{ text: string }> = ({ text }) => {
  const { lang } = useLang();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const speak = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = localeOf(lang);
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };
  return (
    <button type="button" className="icon-btn" onClick={speak} aria-label="Read aloud">
      <Icon name="speaker" />
    </button>
  );
};
