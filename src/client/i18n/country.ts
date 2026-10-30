import type { BaseLanguage } from '../../shared/languages.js';
import type { CountryId } from '../../shared/countries/types.js';
import { COUNTRIES } from '../../shared/countries/index.js';

/**
 * Text that depends on the workplace's country, not just the reader's
 * language: names of leave types, who receives harassment complaints, which
 * office to show a broken record to. Every country pack defines all of these
 * in English and in the country's own languages.
 */
export const COUNTRY_KEYS = [
  'recordBroken',
  'leaveBody',
  'balanceCasual',
  'balanceSick',
  'balanceEarned',
  'balanceCompOff',
  'typeCasual',
  'typeSick',
  'typeEarned',
  'typeCompOff',
  'typeUnpaid',
  'typeWfh',
  'compOffNote',
  'leaveLawNote',
  'complaintEntry',
  'complaintEntrySub',
  'complaintTitle',
  'complaintBody',
  'committeeLabel',
  'presiding',
  'noCommittee',
  'excludeLabel',
  'lawNote',
  'committeeInbox',
  'handlerSelf',
  'handlerMember',
  'handlerSectionBody',
  'flagNoHandler',
  'serviceFromLabel',
  'overtimeRule',
] as const;

export type CountryKey = (typeof COUNTRY_KEYS)[number];

/** One language's country text: the fixed keys plus the pack's own (annual_*, ded_*, ext_*, limit_*). */
export type CountryText = Record<CountryKey, string> & Record<string, string>;

export type CountryStrings = { en: CountryText } & Partial<Record<BaseLanguage, CountryText>>;

/** Keys a country's text must define beyond COUNTRY_KEYS, from what its pack uses. */
export function packKeys(country: CountryId): string[] {
  const pack = COUNTRIES[country];
  const limits = [...pack.limits, ...(pack.regions ?? []).flatMap((r) => r.limits ?? [])];
  const external = [
    ...pack.complaints.external,
    ...(pack.regions ?? []).flatMap((r) => r.complaints?.external ?? []),
  ];
  return [
    ...pack.pay.annual.map((a) => `annual_${a.code}`),
    ...pack.pay.deductions.map((d) => `ded_${d}`),
    ...external.map((e) => `ext_${e.key}`),
    ...limits.map((l) => `limit_${l.id}`),
  ];
}
