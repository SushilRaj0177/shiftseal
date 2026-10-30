import type { Language } from '../../shared/types.js';

import { localeOf } from '../../shared/languages.js';

/** An amount in the workplace's currency, written the way the reader's locale writes money. */
export function money(n: number, lang: Language = 'en-IN', currency = 'INR'): string {
  const digits = currency === 'JPY' || currency === 'KRW' ? 0 : Number.isInteger(n) ? 0 : 2;
  return new Intl.NumberFormat(localeOf(lang), {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function dayLabel(date: string, lang: Language = 'en-IN'): string {
  return new Intl.DateTimeFormat(localeOf(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function longDay(date: string, lang: Language = 'en-IN'): string {
  return new Intl.DateTimeFormat(localeOf(lang), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function hoursLabel(h: number): string {
  const whole = Math.floor(h);
  const m = Math.round((h - whole) * 60);
  return m ? `${whole}h ${String(m).padStart(2, '0')}m` : `${whole}h`;
}

export function minutesSince(hhmm: string, nowHHMM: string): number {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let d = m(nowHHMM) - m(hhmm);
  if (d < 0) d += 24 * 60;
  return d;
}

export function nowHHMM(timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}

export function initials(name: string): string {
  const trimmed = name.trim();
  // Chinese, Japanese and Korean names: one character, as name stamps and avatars there do.
  if (/^[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(trimmed)) return trimmed[0];
  return (
    trimmed
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}

export function timeAgo(iso: string, lang: Language = 'en-IN'): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  const rtf = new Intl.RelativeTimeFormat(localeOf(lang), { numeric: 'auto', style: 'short' });
  if (s < 60) return rtf.format(0, 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  return rtf.format(-Math.round(s / 86400), 'day');
}

/**
 * What to call someone in a greeting, as people there would: the first name
 * in most places, the full name if it starts with an initial (Indian names),
 * and the name with さん or 님 in Japanese and Korean.
 */
export function firstName(name: string, lang: Language = 'en-IN'): string {
  const full = name.trim();
  if (lang === 'ja') return `${full}さん`;
  if (lang === 'ko') return `${full}님`;
  if (lang === 'zh') return full;
  const first = full.split(/\s+/)[0] ?? '';
  return first.replace(/\./g, '').length <= 2 ? full : first;
}

/** The currency's symbol as the reader's locale writes it (₹, ¥, €, R$, ...). */
export function currencySymbol(lang: Language, currency: string): string {
  return (
    new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency })
      .formatToParts(0)
      .find((p) => p.type === 'currency')?.value ?? currency
  );
}
