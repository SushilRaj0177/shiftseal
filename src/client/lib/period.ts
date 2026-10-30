import type { Language } from '../../shared/types.js';
import type { PayPeriod } from '../../shared/time.js';
import { localeOf } from '../../shared/languages.js';

export function periodLabel(p: PayPeriod, lang: Language = 'en-IN'): string {
  const locale = localeOf(lang);
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt.format(new Date(`${p.start}T00:00:00Z`))} – ${fmt.format(new Date(`${p.end}T00:00:00Z`))}`;
}
