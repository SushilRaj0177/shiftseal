import type { Language } from '../../shared/types.js';
import type { PayPeriod } from '../../shared/time.js';

export function periodLabel(p: PayPeriod, lang: Language = 'en'): string {
  const locale = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' }[lang];
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt.format(new Date(`${p.start}T00:00:00Z`))} – ${fmt.format(new Date(`${p.end}T00:00:00Z`))}`;
}
