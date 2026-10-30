import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PayslipLine } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { dayLabel, money } from '../lib/format.js';
import { periodLabel } from '../lib/period.js';
import { useLang } from '../i18n/LangProvider.js';
import { HoldToTalk } from '../components/HoldToTalk.js';
import { ListenButton } from '../components/ListenButton.js';
import { Icon } from '../components/Icon.js';
import { Card, Field, Kv, Notice, Pill, Skeleton, Tile } from '../ui/index.js';
import { TabBar, useWorker } from './WorkerApp.js';

interface Explanation {
  answer: string;
  verificationStatus: 'checked' | 'template_fallback';
}

/** Asks the worker what they were actually paid for last week, once payday has passed. */
export const PaymentPrompt: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { t, lang } = useLang();
  const { wp, overview, reload } = useWorker();
  const [amount, setAmount] = useState('');
  const [receivedOn, setReceivedOn] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (
    !overview?.lastPayslip ||
    overview.lastPayment ||
    overview.today < overview.lastPeriod.payDate
  ) {
    return msg ? <Notice kind="info">{msg}</Notice> : null;
  }
  const expected = overview.lastPayslip.netPay;
  if (expected <= 0) return null;

  const confirm = async () => {
    setBusy(true);
    try {
      const received = Number(amount);
      await api(`/workplaces/${wp.id}/payments/confirm`, {
        body: {
          periodStart: overview.lastPeriod.start,
          receivedAmount: received,
          receivedOn: receivedOn || undefined,
        },
      });
      setMsg(
        received + 1 >= expected
          ? t('paymentMatches')
          : t('paymentShort', money(expected - received, lang))
      );
      await reload();
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card tone={compact ? undefined : 'subtle'}>
      <span className="t-strong">
        {t('confirmPayTitle', periodLabel(overview.lastPeriod, lang))}
      </span>
      <span className="t-caption muted">{t('confirmPayBody', money(expected, lang))}</span>
      {overview.payType === 'monthly' && (
        <Field label={t('receivedOn')}>
          <input
            type="date"
            className="input"
            value={receivedOn}
            max={overview.today}
            onChange={(e) => setReceivedOn(e.target.value)}
          />
        </Field>
      )}
      <div className="row-flex">
        <div className="prefix-input grow">
          <span>₹</span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            aria-label={t('amountReceived')}
            placeholder={String(Math.round(expected))}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!amount || busy}
          onClick={confirm}
        >
          {t('confirmPay')}
        </button>
      </div>
    </Card>
  );
};

function lineLabel(line: PayslipLine, t: ReturnType<typeof useLang>['t']): string {
  if (line.kind === 'salary') return t('lineSalary');
  if (line.kind === 'unpaid_leave') return t('lineUnpaid');
  if (line.kind === 'normal') return t('lineRegular');
  if (line.kind === 'overtime') return t('lineOvertime');
  if (line.kind === 'claim_overtime') return t('lineClaim');
  if (line.kind === 'deduction') return line.labelKey;
  return t('netPay');
}

export const Pay: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview } = useWorker();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slip = overview?.payslip ?? null;

  const ask = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    try {
      setAnswer(
        await api<Explanation>(`/workplaces/${wp.id}/ai/explain-pay`, { body: { lang, ...body } })
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="screen has-tabs">
      <div className="screen-body">
        <header className="stack-sm" style={{ paddingTop: 8 }}>
          <h1 className="t-title">{t('pay')}</h1>
          {overview && (
            <span className="muted">{t('periodOf', periodLabel(overview.period, lang))}</span>
          )}
        </header>
        {!overview && <Skeleton height={160} />}
        {overview && !slip && <Notice kind="info">{t('rateNotSet')}</Notice>}
        {slip && (
          <>
            <Card>
              <span className="t-label">{t('netPay')}</span>
              <span className="t-number">{money(slip.netPay, lang)}</span>
              <span className="t-caption muted">
                {t('paidOn', dayLabel(overview!.period.payDate, lang))}
              </span>
            </Card>
            <Card>
              <div className="between">
                <h2 className="t-headline">{t('howItAddsUp')}</h2>
                <ListenButton text={`${t('netPay')} ${money(slip.netPay, lang)}`} />
              </div>
              {slip.lines
                .filter((l) => l.kind !== 'net')
                .map((l) => (
                  <div key={l.id} className="between" style={{ alignItems: 'flex-start' }}>
                    <div className="stack-sm grow">
                      <div className="row-flex" style={{ gap: 8 }}>
                        <span className="t-strong">{lineLabel(l, t)}</span>
                        {l.ruleRef && (
                          <Pill tone={l.ruleRef.kind === 'law' ? 'accent' : 'neutral'}>
                            {l.ruleRef.kind === 'law' ? t('law') : t('policy')}
                          </Pill>
                        )}
                      </div>
                      {l.hours !== undefined && l.rate !== undefined && (
                        <span className="t-caption muted">
                          {l.hours} h × {money(l.rate, lang)}
                        </span>
                      )}
                    </div>
                    <span className={`t-strong${l.amount < 0 ? ' c-danger' : ''}`}>
                      {l.amount < 0 ? '−' : ''}
                      {money(Math.abs(l.amount), lang)}
                    </span>
                  </div>
                ))}
              <hr className="divider" />
              <Kv k={t('netPay')} v={money(slip.netPay, lang)} vClass="t-headline" />
            </Card>

            <Card>
              <div className="row-flex" style={{ alignItems: 'flex-start' }}>
                <Tile icon="chat" />
                <div className="grow stack-sm">
                  <span className="t-strong">{t('askTitle')}</span>
                  <span className="t-caption muted">{t('askBody')}</span>
                </div>
              </div>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (question.trim()) void ask({ question: question.trim() });
                }}
              >
                <Field label={t('askTitle')}>
                  <input
                    className="input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t('askPlaceholder')}
                  />
                </Field>
                <HoldToTalk
                  disabled={busy}
                  onRecorded={(b64, mime) => ask({ audioBase64: b64, audioMimeType: mime })}
                />
              </form>
              {busy && <span className="spinner" aria-label={t('loading')} />}
              {error && <Notice kind="error">{error}</Notice>}
              {answer && (
                <Card tone="subtle">
                  <p>{answer.answer}</p>
                  <div className="between">
                    <span className="t-caption c-good row-flex" style={{ gap: 6 }}>
                      <Icon name="check" size={16} />
                      {answer.verificationStatus === 'checked'
                        ? t('checkedAgainst')
                        : t('templateAnswer')}
                    </span>
                    <ListenButton text={answer.answer} />
                  </div>
                </Card>
              )}
            </Card>
          </>
        )}

        <Link
          to={`/w/${wp.id}/claim`}
          className="card flush"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <span className="list-row">
            <Tile icon="clock" />
            <span className="grow stack-sm" style={{ gap: 0 }}>
              <span className="t-strong">{t('claimMissed')}</span>
              <span className="t-caption muted">{t('claimMissedSub')}</span>
            </span>
            <Icon name="chev" size={18} />
          </span>
        </Link>

        <PaymentPrompt />
      </div>
      <TabBar />
    </main>
  );
};
