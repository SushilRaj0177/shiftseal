import { buzz } from '../ui/toast.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LocationFix } from '../../shared/model.js';
import { api, ApiError, errorMessage } from '../lib/api.js';
import { getDevice, nonce, sign } from '../lib/device.js';
import { getFix } from '../lib/location.js';
import { integrityToken } from '../lib/native.js';
import { enqueue } from '../lib/queue.js';
import { QrScanner, tokenFromScan } from '../lib/QrScanner.js';
import type { CheckResponse } from '../lib/types.js';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { Icon } from '../components/Icon.js';
import { AppBar, Card, Notice, Spinner } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

type Loc = { state: 'finding' } | { state: 'ok'; fix: LocationFix } | { state: 'off' };
type Phase = 'collect' | 'sending' | 'done' | 'queued' | 'error';

/**
 * Check in or out: scan the gate code, take one location reading, sign the
 * request on this phone, send it. Nothing is ever silently refused; doubtful
 * checks are recorded and marked for review.
 */
export const CheckFlow: React.FC = () => {
  const { t } = useLang();
  const { wp, overview, reload } = useWorker();
  const action = overview?.openShift ? 'CHECK_OUT' : 'CHECK_IN';
  const [loc, setLoc] = useState<Loc>({ state: 'finding' });
  const [token, setToken] = useState<string | null>(() => {
    const pending = sessionStorage.getItem('shiftseal.pendingScan');
    sessionStorage.removeItem('shiftseal.pendingScan');
    return pending && tokenFromScan(pending);
  });
  const [skipQr, setSkipQr] = useState(overview?.leave.today?.type === 'wfh');
  const [phase, setPhase] = useState<Phase>('collect');
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    void getFix().then((r) => setLoc(r.ok ? { state: 'ok', fix: r.fix } : { state: 'off' }));
  }, []);

  const send = useCallback(async () => {
    if (sent.current) return;
    sent.current = true;
    setPhase('sending');
    const device = await getDevice();
    const payload = {
      workplaceId: wp.id,
      action,
      qrToken: token ?? undefined,
      location: loc.state === 'ok' ? loc.fix : undefined,
      clientTime: new Date().toISOString(),
      deviceId: device.deviceId,
      nonce: nonce(),
    };
    const body = {
      payload,
      signature: await sign(payload),
      // In the Android app, Google Play vouches that this is the real app on a real phone.
      integrityToken: await integrityToken(payload.nonce),
    };
    try {
      const res = await api<CheckResponse>(`/workplaces/${wp.id}/checks`, { body });
      setResult(res);
      setPhase('done');
      // The seal lands: a short double tap on phones that can vibrate.
      buzz([22, 60, 34]);
      void reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        enqueue(wp.id, body);
        setPhase('queued');
        buzz(18);
      } else {
        setError(errorMessage(err));
        setPhase('error');
        sent.current = false;
      }
    }
  }, [wp.id, action, token, loc, reload]);

  // Send once we know whether this is a check-in or check-out, have the gate code (or the
  // worker chose to skip it), and have a location answer.
  useEffect(() => {
    if (phase === 'collect' && overview && (token || skipQr) && loc.state !== 'finding')
      void send();
  }, [phase, overview, token, skipQr, loc, send]);

  const onToken = useCallback((v: string) => setToken(v), []);
  const onScanError = useCallback((m: string) => setError(m), []);
  const title = action === 'CHECK_IN' ? t('checkTitleIn') : t('checkTitleOut');

  if (phase === 'done' && result) {
    const time = (result.event.payload as { timestamp: string }).timestamp;
    const wasIn = result.event.type === 'CHECK_IN';
    return (
      <main className="screen">
        <div className="screen-body">
          <div className="spacer" />
          <div className="stack center" style={{ alignItems: 'center' }}>
            <span className="seal-stamp" aria-hidden="true">
              <Icon name="check" size={40} />
            </span>
            <h1 className="t-title">{wasIn ? t('checkedIn', time) : t('checkedOut', time)}</h1>
          </div>
          {result.flags.length > 0 && (
            <Card tone="warn">
              <span className="t-strong">{t('recordedNotes')}</span>
              <ul className="stack-sm" style={{ margin: 0, paddingLeft: 18 }}>
                {result.flags.map((f) => (
                  <li key={f.id} className="t-caption">
                    {t(`flag_${f.code}` as StringKey) || f.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="spacer" />
          <Link className="btn btn-primary" to={`/w/${wp.id}`}>
            {t('done')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <AppBar back={`/w/${wp.id}`} title={title} />
      <div className="screen-body">
        {phase === 'queued' ? (
          <>
            <Notice kind="info">{t('savedOffline')}</Notice>
            <div className="spacer" />
            <Link className="btn btn-primary" to={`/w/${wp.id}`}>
              {t('done')}
            </Link>
          </>
        ) : phase === 'sending' ? (
          <div className="stack" style={{ alignItems: 'center', paddingTop: 48 }}>
            <Spinner label={t('sending')} />
          </div>
        ) : (
          <>
            <p className="muted">{t('locationWhy')}</p>
            <Card>
              <div className="row-flex">
                <Icon name="pin" />
                <span className="grow">
                  {loc.state === 'finding' && t('locating')}
                  {loc.state === 'ok' && `±${Math.round(loc.fix.accuracyM)} m`}
                  {loc.state === 'off' && t('locationDenied')}
                </span>
                {loc.state === 'finding' && <span className="spinner" aria-hidden="true" />}
                {loc.state === 'ok' && (
                  <span className="c-good">
                    <Icon name="check" />
                  </span>
                )}
              </div>
            </Card>
            {!token && !skipQr && (
              <>
                <span className="t-label">{t('scanGate')}</span>
                <QrScanner
                  parse={tokenFromScan}
                  onResult={onToken}
                  onError={onScanError}
                  hint={t('scanGate')}
                />
                <button type="button" className="btn btn-ghost" onClick={() => setSkipQr(true)}>
                  {t('noCodeAtGate')}
                </button>
              </>
            )}
            {(token || skipQr) && loc.state === 'finding' && <Spinner label={t('locating')} />}
            {error && (
              <>
                <Notice kind="error">{error}</Notice>
                {phase === 'error' && (
                  <button type="button" className="btn btn-primary" onClick={() => void send()}>
                    {t('retry')}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
};
