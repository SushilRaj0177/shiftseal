import type { CountryId } from '../../../shared/countries/types.js';
import type { CountryStrings } from '../country.js';
import { IN_TEXT } from './in.js';
import { JP_TEXT } from './jp.js';
import { KR_TEXT } from './kr.js';
import { CN_TEXT } from './cn.js';
import { FR_TEXT } from './fr.js';
import { DE_TEXT } from './de.js';
import { ES_TEXT } from './es.js';
import { MX_TEXT } from './mx.js';
import { BR_TEXT } from './br.js';
import { PT_TEXT } from './pt.js';
import { GB_TEXT } from './gb.js';
import { US_TEXT } from './us.js';

export const COUNTRY_TEXT: Record<CountryId, CountryStrings> = {
  IN: IN_TEXT,
  JP: JP_TEXT,
  KR: KR_TEXT,
  CN: CN_TEXT,
  FR: FR_TEXT,
  DE: DE_TEXT,
  ES: ES_TEXT,
  MX: MX_TEXT,
  BR: BR_TEXT,
  PT: PT_TEXT,
  GB: GB_TEXT,
  US: US_TEXT,
};
