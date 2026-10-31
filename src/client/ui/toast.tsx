import React, { useEffect, useState } from 'react';
import { Icon } from '../components/Icon.js';

type Tone = 'good' | 'error' | 'info';
interface Toast {
  id: number;
  text: string;
  tone: Tone;
}

let next = 1;
const listeners = new Set<(t: Toast) => void>();

/** A short confirmation at the bottom of the screen: "Saved", "Sent", "Approved". */
export function toast(text: string, tone: Tone = 'good'): void {
  const t = { id: next++, text, tone };
  listeners.forEach((l) => l(t));
}

/** A short vibration on phones that have one (the Android app, most Android browsers). */
export function buzz(pattern: number | number[] = 18): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // not supported
  }
}

/** Mounted once; shows the latest toasts for a few seconds each. */
export const Toaster: React.FC = () => {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const add = (t: Toast) => {
      setItems((cur) => [...cur.slice(-2), t]);
      window.setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 2800);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <Icon name={t.tone === 'error' ? 'alert' : 'check'} size={18} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
