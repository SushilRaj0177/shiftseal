import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../lib/api.js';
import { useApi } from '../lib/useApi.js';
import { Brand, Card, Field, Notice, Spinner } from '../ui/index.js';
import { useEmployer } from './EmployerApp.js';

interface Poster {
  token: string;
  svg: string;
  joinSvg: string;
  inviteCode: string;
}

/** The invite code, a printable poster (join QR + fixed check-in QR) and personal invites by phone. */
export const Invite: React.FC = () => {
  const { base } = useEmployer();
  const wp = base.workplace;
  const [zone, setZone] = useState(wp.zones[0]?.code ?? '');
  const poster = useApi<Poster>(zone ? `/workplaces/${wp.id}/poster?zone=${zone}` : null);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'worker' | 'supervisor'>('worker');
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const invitePhone = async () => {
    try {
      const res = await api<{ invite: { code: string } }>(`/workplaces/${wp.id}/invites`, {
        body: { role, phone: `+91${phone.replace(/\D/g, '')}` },
      });
      setMsg({
        kind: 'info',
        text: `Personal code ${res.invite.code}. Only +91 ${phone} can use it, once.`,
      });
      setPhone('');
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  return (
    <>
      <header className="between no-print">
        <h1 className="t-title">Invite & gate</h1>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
          Print poster
        </button>
      </header>

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
                <span className="t-headline">1. Join</span>
                <div
                  className="qr-box"
                  dangerouslySetInnerHTML={{ __html: poster.data.joinSvg }}
                  style={{ width: '100%', maxWidth: 220 }}
                />
                <span className="t-caption muted">Invite code</span>
                <span className="t-title">{poster.data.inviteCode}</span>
              </div>
              <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
                <span className="t-headline">2. Check in</span>
                <div
                  className="qr-box"
                  dangerouslySetInnerHTML={{ __html: poster.data.svg }}
                  style={{ width: '100%', maxWidth: 220 }}
                />
                <span className="t-caption muted">
                  {wp.zones.find((z) => z.code === zone)?.name}. A gate screen with a changing code
                  is stronger than print.
                </span>
              </div>
            </div>
          )}
          <Field label="Check-in code for zone">
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
            <h2 className="t-headline">Gate screen</h2>
            <p className="t-caption muted">
              Open this on a phone or tablet fixed at the gate. Its code changes every 30 seconds,
              so a photo of it is useless minutes later.
            </p>
            <Link className="btn btn-primary btn-sm" to="../gate" target="_blank">
              Open gate screen
            </Link>
          </Card>
          <Card>
            <h2 className="t-headline">Invite by phone</h2>
            <p className="t-caption muted">
              A personal code that only works for this number, once.
            </p>
            <div className="prefix-input">
              <span>+91</span>
              <input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                aria-label="Phone number"
              />
            </div>
            {base.member.role === 'owner' && (
              <div className="segmented" role="group">
                <button
                  type="button"
                  aria-pressed={role === 'worker'}
                  onClick={() => setRole('worker')}
                >
                  Worker
                </button>
                <button
                  type="button"
                  aria-pressed={role === 'supervisor'}
                  onClick={() => setRole('supervisor')}
                >
                  Supervisor
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={phone.replace(/\D/g, '').length !== 10}
              onClick={invitePhone}
            >
              Create invite
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
  const wp = base.workplace;
  const [zone, setZone] = useState(wp.zones[0]?.code ?? '');
  const [code, setCode] = useState<{ svg: string; expiresInS: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    let alive = true;
    const load = async () => {
      try {
        const res = await api<{ svg: string; expiresInS: number }>(
          `/workplaces/${wp.id}/gate?zone=${zone}`
        );
        if (!alive) return;
        setCode(res);
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

  return (
    <main className="gate">
      <div className="stack" style={{ alignItems: 'center', textAlign: 'center', gap: 20 }}>
        <span style={{ fontSize: 28, fontWeight: 600 }}>{wp.name}</span>
        <span style={{ fontSize: 18, color: '#5a5963' }}>
          Scan with Shiftseal to check in or out
        </span>
        {code ? (
          <div className="gate-qr" dangerouslySetInnerHTML={{ __html: code.svg }} />
        ) : (
          <Spinner />
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <select
          className="select no-print"
          style={{ maxWidth: 280 }}
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          {wp.zones.map((z) => (
            <option key={z.code} value={z.code}>
              {z.name}
            </option>
          ))}
        </select>
      </div>
    </main>
  );
};
