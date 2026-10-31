import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocationFix } from '../../shared/model.js';
import {
  COUNTRIES,
  COUNTRY_IDS,
  countryPack,
  type CountryId,
  type PayCycle,
} from '../../shared/countries/index.js';
import { localeOf } from '../../shared/languages.js';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { Icon } from '../components/Icon.js';
import { AppBar, Card, Field, Notice, Spinner } from '../ui/index.js';
import { rememberWorkplace } from '../App.js';

type Sector = 'construction' | 'campus' | 'office' | 'retail';

const PRESETS: Record<Sector, { code: string; key: StringKey; kind: string }[]> = {
  construction: [
    { code: 'GATE', key: 'eZoneGate', kind: 'gate' },
    { code: 'SCAF-A', key: 'eZoneScaffold', kind: 'scaffold' },
    { code: 'BASEMENT', key: 'eZoneBasement', kind: 'basement' },
    { code: 'CRANE', key: 'eZoneCrane', kind: 'crane' },
  ],
  office: [
    { code: 'RECEPTION', key: 'eZoneReception', kind: 'gate' },
    { code: 'FLOOR-1', key: 'eZoneFloor', kind: 'building' },
    { code: 'PANTRY', key: 'eZonePantry', kind: 'cafeteria' },
    { code: 'PARKING', key: 'eZoneParking', kind: 'pin' },
  ],
  retail: [
    { code: 'COUNTER', key: 'eZoneCounter', kind: 'gate' },
    { code: 'KITCHEN', key: 'eZoneKitchen', kind: 'cafeteria' },
    { code: 'STOCK', key: 'eZoneStockroom', kind: 'basement' },
    { code: 'FLOOR', key: 'eZoneShopFloor', kind: 'building' },
  ],
  campus: [
    { code: 'GATE', key: 'eZoneGate', kind: 'gate' },
    { code: 'HOSTEL', key: 'eZoneHostel', kind: 'hostel' },
    { code: 'ACADEMIC', key: 'eZoneAcademic', kind: 'academic' },
    { code: 'CANTEEN', key: 'eZoneCafeteria', kind: 'cafeteria' },
  ],
};

export const CYCLE_KEY: Record<PayCycle, StringKey> = {
  weekly: 'eCycleWeekly',
  biweekly: 'eCycleBiweekly',
  semimonthly: 'eCycleSemimonthly',
  monthly: 'eCycleMonthly',
};

/** Weekday names in the reader's language, Sunday first. */
export function weekdayNames(locale: string, style: 'long' | 'short' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2026, 0, 4 + i))));
}

/** The country's name in the reader's language. */
export function countryName(locale: string, c: CountryId): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(c) ?? c;
  } catch {
    return c;
  }
}

/** Owner setup: country, type of work, site boundary from the owner's own location, zones, hours and pay. */
export default function CreateWorkplace() {
  const navigate = useNavigate();
  const { t, lang, country: home } = useLang();
  const locale = localeOf(lang);
  const days = useMemo(() => weekdayNames(locale), [locale]);
  const [country, setCountry] = useState<CountryId>(home);
  const [region, setRegion] = useState('');
  const pack = countryPack({ country, region: region || undefined });
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [sector, setSector] = useState<Sector>('construction');
  const [payCycle, setPayCycle] = useState<PayCycle>(pack.pay.defaultCycle.construction);
  const [payDayOfMonth, setPayDayOfMonth] = useState(home === 'IN' ? 7 : 25);
  const [weeklyOff, setWeeklyOff] = useState<number[]>(pack.weeklyOff);
  const [state, setState] = useState('');
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [timezone, setTimezone] = useState(pack.timezone);
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [payDay, setPayDay] = useState(5);
  const [radius, setRadius] = useState(150);
  const [centre, setCentre] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [zones, setZones] = useState(
    PRESETS.construction.map((z) => ({ code: z.code, name: t(z.key), kind: z.kind }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zonesFor = (s: Sector) =>
    PRESETS[s].map((z) => ({ code: z.code, name: t(z.key), kind: z.kind }));

  const chooseCountry = (c: CountryId) => {
    const p = COUNTRIES[c];
    setCountry(c);
    setRegion('');
    setPayCycle(p.pay.defaultCycle[sector]);
    setWeeklyOff(sector === 'office' ? [0, 6] : p.weeklyOff);
    const zonesHere = [p.timezone, ...(p.timezones ?? [])];
    setTimezone(zonesHere.includes(browserTz) ? browserTz : p.timezone);
    setPayDayOfMonth(c === 'IN' ? 7 : c === 'BR' ? 5 : 25);
  };

  const locate = async () => {
    setLocating(true);
    setError(null);
    const r = await getFix(20_000);
    setLocating(false);
    if (r.ok) setCentre(r.fix);
    else setError(t('eNoLocation'));
  };

  const create = async () => {
    if (!centre) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ workplace: { id: string } }>('/workplaces', {
        body: {
          name: name.trim(),
          ownerName: ownerName.trim(),
          sector,
          country,
          region: region || undefined,
          state: state.trim() || countryName('en', country),
          timezone,
          shiftStart,
          shiftEnd,
          payDay,
          payCycle,
          payDayOfMonth: payCycle === 'monthly' ? payDayOfMonth : undefined,
          weeklyOff,
          geofence: { center: { lat: centre.lat, lng: centre.lng }, radiusM: radius },
          zones: zones.filter((z) => z.name.trim()).map((z) => ({ ...z, name: z.name.trim() })),
        },
      });
      rememberWorkplace(res.workplace.id);
      navigate(`/e/${res.workplace.id}/invite`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const ready = name.trim() && ownerName.trim() && centre && zones.some((z) => z.name.trim());
  const deadline = pack.pay.deadline;
  const deadlineHint =
    deadline.kind === 'businessDaysAfterEnd'
      ? t('eDeadlineBusinessDays', deadline.days)
      : deadline.kind === 'daysAfterEnd'
        ? deadline.days > 0
          ? t('eDeadlineDays', deadline.days)
          : t('eDeadlineEnd')
        : t('eDeadlineFixed');
  const tzChoices = [...new Set([pack.timezone, ...(pack.timezones ?? []), timezone])];

  return (
    <main className="screen">
      <AppBar back="/join" title={t('eSetupTitle')} />
      <div className="screen-body">
        <Field label={t('yourName')}>
          <input
            className="input"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label={t('eWorkplaceName')}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('eCountry')} hint={t('eCountryHint')}>
          <select
            className="select"
            value={country}
            onChange={(e) => chooseCountry(e.target.value as CountryId)}
          >
            {COUNTRY_IDS.map((c) => (
              <option key={c} value={c}>
                {countryName(locale, c)}
              </option>
            ))}
          </select>
        </Field>
        {COUNTRIES[country].regions && (
          <Field label={t('eStateRules')}>
            <select
              className="select"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                const r = COUNTRIES[country].regions!.find((x) => x.id === e.target.value);
                if (r?.timezone) setTimezone(r.timezone);
              }}
            >
              <option value="">{t('eOtherStates')}</option>
              {COUNTRIES[country].regions!.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t('eState')}>
          <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
        </Field>
        {tzChoices.length > 1 && (
          <Field label={t('eTimezone')}>
            <select
              className="select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {tzChoices.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </Field>
        )}
        <span className="t-label">{t('eTypeOfWork')}</span>
        <div className="stack" role="radiogroup">
          {(
            [
              ['construction', 'eSectorConstruction', 'eSectorConstructionSub', 'scaffold'],
              ['campus', 'eSectorCampus', 'eSectorCampusSub', 'building'],
              ['office', 'eSectorOffice', 'eSectorOfficeSub', 'doc'],
              ['retail', 'eSectorRetail', 'eSectorRetailSub', 'cup'],
            ] as const
          ).map(([key, title, sub, icon]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={sector === key}
              className="choice"
              onClick={() => {
                setSector(key);
                setZones(zonesFor(key));
                setPayCycle(pack.pay.defaultCycle[key]);
                setWeeklyOff(key === 'office' ? [0, 6] : pack.weeklyOff);
                if (key === 'office') {
                  setShiftStart('09:00');
                  setShiftEnd('18:00');
                }
              }}
            >
              <Icon name={icon} size={22} />
              <span className="stack-sm grow">
                <span className="t-strong">{t(title)}</span>
                <span className="t-caption muted">{t(sub)}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="grid-2">
          <Field label={t('eShiftStarts')}>
            <input
              type="time"
              className="input"
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
            />
          </Field>
          <Field label={t('eShiftEnds')}>
            <input
              type="time"
              className="input"
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
            />
          </Field>
        </div>
        <p className="t-caption muted">{t('overtimeRule')}</p>
        <Field label={t('ePayCycle')}>
          <div className="segmented" role="group">
            {pack.pay.cycles.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={payCycle === c}
                onClick={() => setPayCycle(c)}
              >
                {t(CYCLE_KEY[c])}
              </button>
            ))}
          </div>
        </Field>
        {payCycle === 'weekly' || payCycle === 'biweekly' ? (
          <Field label={t('ePayDay')} hint={deadlineHint}>
            <select
              className="select"
              value={payDay}
              onChange={(e) => setPayDay(Number(e.target.value))}
            >
              {days.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        ) : payCycle === 'monthly' ? (
          <Field label={t('ePayDayOfMonth')} hint={deadlineHint}>
            <input
              className="input"
              inputMode="numeric"
              value={payDayOfMonth}
              onChange={(e) =>
                setPayDayOfMonth(
                  Math.min(28, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))
                )
              }
            />
          </Field>
        ) : (
          <p className="t-caption muted">{t('eSemimonthlyNote')}</p>
        )}
        <Field label={t('eWeeklyOff')}>
          <div className="segmented" role="group">
            {weekdayNames(locale, 'short').map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={weeklyOff.includes(i)}
                onClick={() =>
                  setWeeklyOff(
                    weeklyOff.includes(i) ? weeklyOff.filter((x) => x !== i) : [...weeklyOff, i]
                  )
                }
              >
                {d}
              </button>
            ))}
          </div>
        </Field>

        <Card>
          <span className="t-strong">{t('eSiteBoundary')}</span>
          <span className="t-caption muted">{t('eSiteBoundaryBody')}</span>
          {centre ? (
            <span className="row-flex t-caption c-good">
              <Icon name="pin" size={18} />
              {centre.lat.toFixed(5)}, {centre.lng.toFixed(5)} · ±{Math.round(centre.accuracyM)} m
            </span>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={locate} disabled={locating}>
            {locating ? (
              <Spinner label={t('locating')} />
            ) : centre ? (
              t('eLocateAgain')
            ) : (
              t('eLocate')
            )}
          </button>
          <Field label={t('eRadius', radius)}>
            <input
              type="range"
              min={50}
              max={1000}
              step={25}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </Field>
        </Card>

        <Card>
          <span className="t-strong">{t('eZones')}</span>
          <span className="t-caption muted">{t('eZonesBody')}</span>
          {zones.map((z, i) => (
            <input
              key={z.code}
              className="input"
              value={z.name}
              aria-label={t('eZoneN', i + 1)}
              onChange={(e) =>
                setZones(zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
            />
          ))}
          <button
            type="button"
            className="link-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() =>
              setZones([...zones, { code: `Z${zones.length + 1}`, name: '', kind: 'pin' }])
            }
          >
            {t('eAddZone')}
          </button>
        </Card>

        {error && <Notice kind="error">{error}</Notice>}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!ready || busy}
          onClick={create}
        >
          {busy ? t('eCreating') : t('eCreate')}
        </button>
      </div>
    </main>
  );
}
