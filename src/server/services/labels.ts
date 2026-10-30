import { LANGUAGES, type BaseLanguage } from '../../shared/languages.js';
import type { CountryId } from '../../shared/countries/types.js';

type Labels = {
  owner: string;
  supervisor: string;
  worker: string;
  management: string;
  general: string;
};

const LABELS: Record<BaseLanguage, Labels> = {
  en: {
    owner: 'Owner',
    supervisor: 'Supervisor',
    worker: 'Worker',
    management: 'Management',
    general: 'General',
  },
  ta: {
    owner: 'உரிமையாளர்',
    supervisor: 'மேற்பார்வையாளர்',
    worker: 'தொழிலாளர்',
    management: 'நிர்வாகம்',
    general: 'பொது',
  },
  hi: {
    owner: 'मालिक',
    supervisor: 'सुपरवाइज़र',
    worker: 'कर्मचारी',
    management: 'प्रबंधन',
    general: 'सामान्य',
  },
  es: {
    owner: 'Propietario',
    supervisor: 'Supervisor',
    worker: 'Trabajador',
    management: 'Dirección',
    general: 'General',
  },
  fr: {
    owner: 'Propriétaire',
    supervisor: 'Responsable',
    worker: 'Salarié',
    management: 'Direction',
    general: 'Général',
  },
  de: {
    owner: 'Inhaber',
    supervisor: 'Vorgesetzte',
    worker: 'Beschäftigte',
    management: 'Leitung',
    general: 'Allgemein',
  },
  pt: {
    owner: 'Proprietário',
    supervisor: 'Supervisor',
    worker: 'Trabalhador',
    management: 'Direção',
    general: 'Geral',
  },
  ja: {
    owner: 'オーナー',
    supervisor: '監督者',
    worker: '従業員',
    management: '経営',
    general: '全体',
  },
  zh: { owner: '老板', supervisor: '主管', worker: '员工', management: '管理层', general: '全体' },
  ko: {
    owner: '대표',
    supervisor: '관리자',
    worker: '근로자',
    management: '경영',
    general: '전체',
  },
};

/** Default job titles and team names, in the workplace country's main language. */
export function defaultLabels(country: CountryId = 'IN'): Labels {
  const main = LANGUAGES.find((l) => l.country === country)?.base ?? 'en';
  return LABELS[main];
}
