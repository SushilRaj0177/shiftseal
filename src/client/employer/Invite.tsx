import { isAndroidApp } from '../lib/native.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { Brand, Card, Field, Notice, Spinner } from '../ui/index.js';
import { Grain } from '../ui/visuals.js';
import { PageHead, useEmployer } from './EmployerApp.js';
import { Icon } from '../components/Icon.js';
import { useLang } from '../i18n/LangProvider.js';
import { countryPack } from '../../shared/countries/index.js';

interface Poster {
  token: string;
  svg: string;
  joinSvg: string;
  inviteCode: string;
}

/** The invite code, a printable poster (join QR + fixed check-in QR) and personal invites by phone. */
export const Invite: React.FC = () => {
  const { base } = useEmployer();
  const { t } = useLang();
  const wp = base.workplace;
  const prefix = countryPack(wp).phonePrefix;
  const [zone, setZone] = useState(wp.zones[0]?.code ?? '');
  const poster = useApi<Poster>(zone ? `/workplaces/${wp.id}/poster?zone=${zone}` : null);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'worker' | 'supervisor'>('worker');
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const invitePhone = async () => {
    try {
      const res = await api<{ invite: { code: string } }>(`/workplaces/${wp.id}/invites`, {
        body: { role, phone: `${prefix}${phone.replace(/\D/g, '').replace(/^0+/, '')}` },
      });
      setMsg({
        kind: 'info',
        text: t('ePersonalCode', res.invite.code, `${prefix} ${phone}`),
      });
      setPhone('');
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <>
      {/* The Android app's web view cannot print; the poster prints from the website. */}
      <PageHead
        className="no-print"
        title={t('eNavInvite')}
        action={
          isAndroidApp() ? null : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
            >
              <Icon name="printer" size={16} />
              {t('ePrintPoster')}
            </button>
          )
        }
      />

      <div className="cols">
        <Card>
          <div className="between">
            <Brand />
            <span className="t-caption muted">{wp.name}</span>
          </div>
          {!poster.data ? (
            <Spinner />
          ) : (
            <div className="grid-2" style={{ alignItems: 'start' }}>
              <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                <span className="t-headline">{t('ePosterJoin')}</span>
                <div
                  className="qr-box"
                  dangerouslySetInnerHTML={{ __html: poster.data.joinSvg }}
                  style={{ width: '100%', maxWidth: 220 }}
                />
                <span className="t-caption muted">{t('inviteCode')}</span>
                <span className="t-title">{poster.data.inviteCode}</span>
              </div>
              <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                <span className="t-headline">{t('ePosterCheck')}</span>
                <div
                  className="qr-box"
                  dangerouslySetInnerHTML={{ __html: poster.data.svg }}
                  style={{ width: '100%', maxWidth: 220 }}
                />
                <span className="t-caption muted">
                  {wp.zones.find((z) => z.code === zone)?.name}. {t('ePrintWeaker')}
                </span>
              </div>
            </div>
          )}
          <Field label={t('eZoneCode')}>
            <select
              className="select no-print"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              {wp.zones.map((z) => (
                <option key={z.code} value={z.code}>
                  {z.name}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <div className="stack no-print">
          <Card>
            <h2 className="t-headline">{t('eGateScreen')}</h2>
            <p className="t-caption muted">{t('eGateBody')}</p>
            <Link className="btn btn-primary btn-sm" to="../gate" target="_blank">
              {t('eOpenGate')}
            </Link>
          </Card>
          <Card>
            <h2 className="t-headline">{t('eInviteByPhone')}</h2>
            <p className="t-caption muted">{t('eInviteByPhoneBody')}</p>
            <div className="prefix-input">
              <span>{prefix}</span>
              <input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                aria-label={t('phoneLabel')}
              />
            </div>
            {base.member.role === 'owner' && (
              <div className="segmented" role="group">
                <button
                  type="button"
                  aria-pressed={role === 'worker'}
                  onClick={() => setRole('worker')}
                >
                  {t('eWorker')}
                </button>
                <button
                  type="button"
                  aria-pressed={role === 'supervisor'}
                  onClick={() => setRole('supervisor')}
                >
                  {t('eSupervisorRole')}
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={phone.replace(/\D/g, '').replace(/^0+/, '').length < 6}
              onClick={invitePhone}
            >
              {t('eCreateInvite')}
            </button>
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          </Card>
        </div>
      </div>
    </>
  );
};

/** Full-screen rotating check-in code for a device fixed at the gate. */
export const GateDisplay: React.FC = () => {
  const { base } = useEmployer();
  const { t } = useLang();
  const wp = base.workplace;
  const [zone, setZone] = useState(wp.zones[0]?.code ?? '');
  const [code, setCode] = useState<{ svg: string; expiresInS: number; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // The bar under the code shows how long until it changes.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let timer = 0;
    let alive = true;
    const load = async () => {
      try {
        const res = await api<{ svg: string; expiresInS: number }>(
          `/workplaces/${wp.id}/gate?zone=${zone}`
        );
        if (!alive) return;
        setCode({ ...res, at: Date.now() });
        setError(null);
        timer = window.setTimeout(load, Math.max(2, res.expiresInS) * 1000);
      } catch (err) {
        if (!alive) return;
        setError(errorMessage(err));
        timer = window.setTimeout(load, 5000);
      }
    };
    void load();
    let lock: { release(): Promise<void> } | null = null;
    (
      navigator as { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }
    ).wakeLock
      ?.request('screen')
      .then((l) => (lock = l))
      .catch(() => undefined);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      void lock?.release();
    };
  }, [wp.id, zone]);

  const total = Math.max(1, code?.expiresInS ?? 30);
  const left = code ? Math.max(0, total - (now - code.at) / 1000) : total;

  return (
    <main className="gate">
      <Grain />
      <header className="gate-head">
        <Brand />
        <select
          className="gate-zone no-print"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          aria-label={t('eZoneCode')}
        >
          {wp.zones.map((z) => (
            <option key={z.code} value={z.code}>
              {z.name}
            </option>
          ))}
        </select>
      </header>
      <div className="gate-body">
        <h1 className="t-display">{wp.name}</h1>
        <p>{t('eGateScan')}</p>
        <div className="gate-poster-card">
          {code ? (
            <div className="gate-qr" dangerouslySetInnerHTML={{ __html: code.svg }} />
          ) : (
            <div className="gate-qr gate-qr-wait">
              <Spinner />
            </div>
          )}
          <div className="gate-timer" aria-hidden="true">
            <span style={{ width: `${(left / total) * 100}%` }} />
          </div>
          <div className="gate-zone-name">
            <span className="t-label">{wp.zones.find((z) => z.code === zone)?.name}</span>
            <span className="t-label">{Math.ceil(left)}s</span>
          </div>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
      </div>
    </main>
  );
};
