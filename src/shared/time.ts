/** Time helpers that work in the workplace's own time zone, not the server's. */

export interface LocalParts {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  weekday: number; // 0 = Sunday
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function localParts(at: Date, timeZone: string): LocalParts {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export interface PayPeriod {
  start: string; // inclusive
  end: string; // inclusive, the day before pay day
  payDate: string;
}

/**
 * The pay period that contains `today`. A weekly period runs from pay day up
 * to the day before the next pay day; wages for it are paid on that next pay day.
 */
export function payPeriodFor(today: string, payDay: number): PayPeriod {
  const back = (weekdayOf(today) - payDay + 7) % 7;
  const start = addDays(today, -back);
  return { start, end: addDays(start, 6), payDate: addDays(start, 7) };
}

export function isWithin(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

/** Minutes between two HH:mm times on a shift, allowing for midnight. */
export function minutesBetween(from: string, to: string): number {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let diff = m(to) - m(from);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function daysInMonth(date: string): number {
  const [y, m] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The calendar month containing `today`; salary for it is paid on `payDayOfMonth` of the next month. */
export function monthlyPeriodFor(today: string, payDayOfMonth: number): PayPeriod {
  const start = `${today.slice(0, 7)}-01`;
  const end = `${today.slice(0, 7)}-${String(daysInMonth(today)).padStart(2, '0')}`;
  const next = addDays(end, 1);
  return { start, end, payDate: `${next.slice(0, 7)}-${String(payDayOfMonth).padStart(2, '0')}` };
}

export interface PayCycleSettings {
  payCycle?: 'weekly' | 'monthly';
  payDay: number;
  payDayOfMonth?: number;
}

/** The pay period containing `date`, for a workplace's pay cycle. */
export function periodFor(wp: PayCycleSettings, date: string): PayPeriod {
  return wp.payCycle === 'monthly'
    ? monthlyPeriodFor(date, wp.payDayOfMonth ?? 1)
    : payPeriodFor(date, wp.payDay);
}

/** Every date from `from` to `to`, inclusive. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
