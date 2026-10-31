import { toast } from '../ui/toast.js';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { countryPack } from '../../shared/countries/index.js';
import { localeOf } from '../../shared/languages.js';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { useAuth } from '../auth/AuthProvider.js';
import { useLang } from '../i18n/LangProvider.js';
import { Card, Field, Kv, LanguagePicker, Notice } from '../ui/index.js';
import { DeleteAccount } from '../components/DeleteAccount.js';
import { PageHead, useEmployer } from './EmployerApp.js';
import { countryName, CYCLE_KEY, weekdayNames } from './CreateWorkplace.js';

export const WorkplaceSettings: React.FC = () => {
  const { base } = useEmployer();
  const { signOut } = useAuth();
  const { t, tx, lang, setLang } = useLang();
  const navigate = useNavigate();
  const wp = base.workplace;
  const pack = countryPack(wp);
  const locale = localeOf(lang);
  const isOwner = base.member.role === 'owner';
  const [shiftStart, setShiftStart] = useState(wp.shiftStart);
  const [shiftEnd, setShiftEnd] = useState(wp.shiftEnd);
  const [radius, setRadius] = useState(wp.geofence.radiusM);
  const [center, setCenter] = useState(wp.geofence.center);
  const [payCycle, setPayCycle] = useState(wp.payCycle ?? pack.pay.defaultCycle[wp.sector]);
  const [payDay, setPayDay] = useState(wp.payDay);
  const [payDayOfMonth, setPayDayOfMonth] = useState(wp.payDayOfMonth ?? 1);
  const [weeklyOff, setWeeklyOff] = useState(wp.weeklyOff ?? pack.weeklyOff);
  const legalOt = pack.overtime.bands[0].multiplier;
  const [otRate, setOtRate] = useState(String(wp.overtimeMultiplier ?? legalOt));
  const [holidays, setHolidays] = useState((wp.holidays ?? []).join('\n'));
  const annual = pack.leave.types.find((x) => x.type === 'earned');
  const [policy, setPolicy] = useState(
    wp.leavePolicy ?? {
      casual: Number(pack.leave.types.find((x) => x.type === 'casual')?.entitlement) || 0,
      sick: Number(pack.leave.types.find((x) => x.type === 'sick')?.entitlement) || 0,
      earned: typeof annual?.entitlement === 'number' ? annual.entitlement : 0,
    }
  );
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const save = async () => {
    try {
      const rate = Number(otRate);
      await api(`/workplaces/${wp.id}`, {
        method: 'PATCH',
        body: {
          shiftStart,
          shiftEnd,
          geofence: { center, radiusM: radius },
          payCycle,
          payDay,
          payDayOfMonth: payCycle === 'monthly' ? payDayOfMonth : undefined,
          weeklyOff,
          overtimeMultiplier: rate > legalOt ? rate : undefined,
          holidays: holidays
            .split(/\s+/)
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
            .slice(0, 40),
          leavePolicy: policy,
        },
      });
      setMsg(null);
      toast(t('eSaved'));
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  const recentre = async () => {
    const r = await getFix(20_000);
    if (r.ok) setCenter({ lat: r.fix.lat, lng: r.fix.lng });
    else setMsg({ kind: 'error', text: t('eNoLocation') });
  };

  const sectorKey =
    wp.sector === 'construction'
      ? 'eSectorConstruction'
      : wp.sector === 'office'
        ? 'eSectorOffice'
        : 'eSectorCampus';
  const region = pack.regions?.find((r) => r.id === wp.region);

  return (
    <>
      <PageHead title={t('eNavSettings')} />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="cols">
        <div className="stack">
          <Card>
            <h2 className="t-headline">{t('workplace')}</h2>
            <Kv k={t('eColName')} v={wp.name} />
            <Kv k={t('eTypeOfWork')} v={t(sectorKey)} />
            <Kv
              k={t('eCountry')}
              v={`${countryName(locale, wp.country ?? 'IN')}${region ? ` · ${region.name}` : ''}`}
            />
            <Kv k={t('eState')} v={wp.state} />
            <Kv k={t('eTimezone')} v={wp.timezone.replace(/_/g, ' ')} />
            <Kv k={t('inviteCode')} v={wp.inviteCode} />
            <div className="grid-2">
              <Field label={t('eShiftStarts')}>
                <input
                  type="time"
                  className="input"
                  value={shiftStart}
                  disabled={!isOwner}
                  onChange={(e) => setShiftStart(e.target.value)}
                />
              </Field>
              <Field label={t('eShiftEnds')}>
                <input
                  type="time"
                  className="input"
                  value={shiftEnd}
                  disabled={!isOwner}
                  onChange={(e) => setShiftEnd(e.target.value)}
                />
              </Field>
            </div>
            <Field label={t('eRadius', radius)}>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={radius}
                disabled={!isOwner}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </Field>
            <span className="t-caption muted">
              {t('eCentre', `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`)}
            </span>
            {isOwner && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={recentre}>
                {t('eRecentre')}
              </button>
            )}
          </Card>

          <Card>
            <h2 className="t-headline">{t('ePayAndHours')}</h2>
            <p className="t-caption muted">{t('overtimeRule')}</p>
            <Field label={t('ePayCycle')}>
              <div className="segmented" role="group">
                {pack.pay.cycles.map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!isOwner}
                    aria-pressed={payCycle === c}
                    onClick={() => setPayCycle(c)}
                  >
                    {t(CYCLE_KEY[c])}
                  </button>
                ))}
              </div>
            </Field>
            {payCycle === 'monthly' ? (
              <Field label={t('ePayDayOfMonth')}>
                <input
                  className="input"
                  inputMode="numeric"
                  disabled={!isOwner}
                  value={payDayOfMonth}
                  onChange={(e) =>
                    setPayDayOfMonth(
                      Math.min(28, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1))
                    )
                  }
                />
              </Field>
            ) : payCycle === 'semimonthly' ? null : (
              <Field label={t('ePayDay')}>
                <select
                  className="select"
                  disabled={!isOwner}
                  value={payDay}
                  onChange={(e) => setPayDay(Number(e.target.value))}
                >
                  {weekdayNames(locale).map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={t('eWeeklyOff')}>
              <div className="segmented" role="group">
                {weekdayNames(locale, 'short').map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    disabled={!isOwner}
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
            <Field label={t('eAgreedOt')} hint={t('eAgreedOtHint', legalOt)}>
              <input
                className="input"
                inputMode="decimal"
                disabled={!isOwner}
                value={otRate}
                onChange={(e) => setOtRate(e.target.value.replace(/[^\d.]/g, ''))}
              />
            </Field>
            {pack.overtime.holiday && (
              <Field label={t('eHolidays')} hint={t('eHolidaysHint')}>
                <textarea
                  className="textarea"
                  disabled={!isOwner}
                  value={holidays}
                  placeholder="2026-12-25"
                  onChange={(e) => setHolidays(e.target.value)}
                />
              </Field>
            )}
          </Card>

          <Card>
            <h2 className="t-headline">{t('leaveTitle')}</h2>
            <p className="t-caption muted">{t('leaveLawNote')}</p>
            <div className="grid-2">
              {(['earned', 'casual', 'sick'] as const)
                .filter((k) => pack.leave.types.some((x) => x.type === k))
                .map((k) => (
                  <Field
                    key={k}
                    label={t(
                      k === 'earned'
                        ? 'balanceEarned'
                        : k === 'casual'
                          ? 'balanceCasual'
                          : 'balanceSick'
                    )}
                    hint={
                      k === 'earned' && annual?.entitlement === 'service'
                        ? t('eByService')
                        : undefined
                    }
                  >
                    <input
                      className="input"
                      inputMode="numeric"
                      disabled={!isOwner}
                      value={policy[k]}
                      onChange={(e) =>
                        setPolicy({
                          ...policy,
                          [k]: Number(e.target.value.replace(/\D/g, '')) || 0,
                        })
                      }
                    />
                  </Field>
                ))}
            </div>
          </Card>
          {isOwner && (
            <button type="button" className="btn btn-primary" onClick={save}>
              {t('eSave')}
            </button>
          )}
        </div>

        <div className="stack">
          <Card>
            <h2 className="t-headline">{t('eAccount')}</h2>
            <Kv k={t('eSignedInAs')} v={base.member.name} />
            <Kv
              k={t('eRole')}
              v={
                base.member.role === 'owner'
                  ? t('eOwner')
                  : base.member.role === 'supervisor'
                    ? t('eSupervisorRole')
                    : t('eWorker')
              }
            />
            {isOwner && (
              <label className="row-flex">
                <input
                  type="checkbox"
                  checked={Boolean(base.member.icMember)}
                  onChange={async (e) => {
                    try {
                      await api(`/workplaces/${wp.id}/members/${base.member.uid}`, {
                        method: 'PATCH',
                        body: { icMember: e.target.checked },
                      });
                      window.location.reload();
                    } catch (err) {
                      setMsg({ kind: 'error', text: errorMessage(err) });
                    }
                  }}
                />
                {t('handlerSelf')}
              </label>
            )}
            <Link className="btn btn-secondary btn-sm" to="../complaints">
              {t('complaintEntry')}
            </Link>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                await signOut();
                navigate('/welcome', { replace: true });
              }}
            >
              {t('signOut')}
            </button>
            <DeleteAccount small />
          </Card>
          <Card>
            <span className="t-label">{t('language')}</span>
            <LanguagePicker
              value={lang}
              label={t('language')}
              onChange={(l) => {
                setLang(l);
                void api('/me', { method: 'PATCH', body: { language: l } }).catch(() => undefined);
              }}
            />
          </Card>
          <Card tone="subtle">
            <span className="t-label">{t('limitsTitle')}</span>
            {pack.limits.map((m) => (
              <span key={m.id} className="t-caption">
                {tx(`limit_${m.id}`)}
              </span>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
};
