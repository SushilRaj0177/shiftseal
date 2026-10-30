import type { Language } from '../../shared/types.js';

const LOCALE: Record<Language, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' };

export function money(n: number, lang: Language = 'en'): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function dayLabel(date: string, lang: Language = 'en'): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function longDay(date: string, lang: Language = 'en'): string {
  return new Intl.DateTimeFormat(LOCALE[lang], {
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
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join('') || '?'
  );
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/** What to call someone in a greeting: the first name, or the full name if it starts with an initial. */
export function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first.replace(/\./g, '').length <= 2 ? name.trim() : first;
}
