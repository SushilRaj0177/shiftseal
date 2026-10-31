import { COUNTRIES, COUNTRY_IDS, type CountryId } from '../../shared/countries/index.js';
import React, { useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../i18n/LangProvider.js';
import { authErrorMessage, useAuth } from './AuthProvider.js';
import { AppBar, Field, Notice } from '../ui/index.js';

/** Phone number and SMS code. Employers can also use Google. */
export const SignIn: React.FC = () => {
  const { t } = useLang();
  const auth = useAuth();
  const [params] = useSearchParams();
  const employer = params.get('as') === 'employer';
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devUid, setDevUid] = useState('');
  const { country } = useLang();
  const [dial, setDial] = useState<CountryId>(country);
  const recaptcha = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  if (auth.ready && auth.user) return <Navigate to="/" replace />;
  const prefix = COUNTRIES[dial].phonePrefix;
  // Drop the trunk 0 people write at home (UK 07…, Japan 090…) before the country code.
  const national = digits.replace(/\D/g, '').replace(/^0+/, '');
  const phone = `${prefix}${national}`;
  const validPhone =
    dial === 'IN'
      ? /^\+91[6-9]\d{9}$/.test(phone)
      : /^\+\d{8,15}$/.test(phone) && national.length >= 6;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    run(async () => {
      await auth.sendCode(phone, recaptcha.current!);
      setStep('code');
      setTimeout(() => boxes.current[0]?.focus(), 50);
    });

  const verify = (digitsArr = code) => run(() => auth.confirmCode(digitsArr.join('')));

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    const next = [...code];
    if (clean.length > 1) {
      clean
        .slice(0, 6)
        .split('')
        .forEach((d, j) => (next[j] = d));
      setCode(next);
      if (next.every(Boolean)) void verify(next);
      return;
    }
    next[i] = clean;
    setCode(next);
    if (clean && i < 5) boxes.current[i + 1]?.focus();
    if (next.every(Boolean)) void verify(next);
  };

  if (auth.config?.authMode === 'dev') {
    return (
      <main className="screen">
        <AppBar back="/welcome" />
        <div className="screen-body">
          <h1 className="t-title">Developer sign-in</h1>
          <Notice kind="warn">
            This server runs in development mode. Production uses SMS codes.
          </Notice>
          <Field label="User id">
            <input
              className="input"
              value={devUid}
              onChange={(e) => setDevUid(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              className="input"
              value={digits}
              onChange={(e) => setDigits(e.target.value)}
              inputMode="tel"
            />
          </Field>
          <div className="spacer" />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!/^[A-Za-z0-9_-]{1,64}$/.test(devUid)}
            onClick={() => auth.devSignIn(devUid, validPhone ? phone : undefined)}
          >
            {t('continue')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <AppBar back={step === 'code' ? undefined : '/welcome'} />
      {step === 'phone' ? (
        <form
          className="screen-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (validPhone) void send();
          }}
        >
          <h1 className="t-title">{t('phoneTitle')}</h1>
          <p className="muted">{t('phoneBody')}</p>
          <Field label={t('phoneLabel')}>
            <div className="prefix-input">
              <select
                className="dial"
                value={dial}
                onChange={(e) => setDial(e.target.value as CountryId)}
                aria-label="Country code"
              >
                {COUNTRY_IDS.map((c) => (
                  <option key={c} value={c}>
                    {COUNTRIES[c].phonePrefix} {c}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={16}
                value={digits}
                onChange={(e) => setDigits(e.target.value.replace(/[^\d ]/g, ''))}
                aria-label={t('phoneLabel')}
                autoFocus
              />
            </div>
          </Field>
          {error && <Notice kind="error">{error}</Notice>}
          <div className="spacer" />
          <p className="t-caption faint center">{t('terms')}</p>
          <button type="submit" className="btn btn-primary" disabled={!validPhone || busy}>
            {busy ? t('loading') : t('sendCode')}
          </button>
          {employer && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => run(auth.signInWithGoogle)}
            >
              Continue with Google
            </button>
          )}
        </form>
      ) : (
        <form
          className="screen-body"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <h1 className="t-title">{t('codeTitle')}</h1>
          <p className="muted">{t('codeSentTo', `${prefix} ${digits}`)}</p>
          <div className="otp">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={i === 0 ? 6 : 1}
                value={d}
                placeholder=" "
                aria-label={`Digit ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Backspace' && !d && i > 0 && boxes.current[i - 1]?.focus()
                }
              />
            ))}
          </div>
          {error && <Notice kind="error">{error}</Notice>}
          <div className="row-flex">
            <button type="button" className="link-btn" disabled={busy} onClick={send}>
              {t('resend')}
            </button>
            <span className="faint">·</span>
            <button type="button" className="link-btn" onClick={() => setStep('phone')}>
              {t('changeNumber')}
            </button>
          </div>
          <div className="spacer" />
          <button type="submit" className="btn btn-primary" disabled={busy || code.some((c) => !c)}>
            {busy ? t('loading') : t('verify')}
          </button>
        </form>
      )}
      <div ref={recaptcha} />
    </main>
  );
};
