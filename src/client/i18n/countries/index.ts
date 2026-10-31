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
import { IN_MORE } from './more/in.js';
import { US_MORE } from './more/us.js';
import { GB_MORE } from './more/gb.js';
import { PT_MORE } from './more/pt.js';
import { BR_MORE } from './more/br.js';
import { MX_MORE } from './more/mx.js';
import { ES_MORE } from './more/es.js';
import { DE_MORE } from './more/de.js';
import { FR_MORE } from './more/fr.js';
import { CN_MORE } from './more/cn.js';
import { KR_MORE } from './more/kr.js';
import { JP_MORE } from './more/jp.js';

export const COUNTRY_TEXT: Record<CountryId, CountryStrings> = {
  IN: { ...IN_MORE, ...IN_TEXT },
  JP: { ...JP_MORE, ...JP_TEXT },
  KR: { ...KR_MORE, ...KR_TEXT },
  CN: { ...CN_MORE, ...CN_TEXT },
  FR: { ...FR_MORE, ...FR_TEXT },
  DE: { ...DE_MORE, ...DE_TEXT },
  ES: { ...ES_MORE, ...ES_TEXT },
  MX: { ...MX_MORE, ...MX_TEXT },
  BR: { ...BR_MORE, ...BR_TEXT },
  PT: { ...PT_MORE, ...PT_TEXT },
  GB: { ...GB_MORE, ...GB_TEXT },
  US: { ...US_MORE, ...US_TEXT },
};
