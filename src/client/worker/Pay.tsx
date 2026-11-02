import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PayslipLine } from '../../shared/types.js';
import { api, errorMessage } from '../lib/api.js';
import { currencySymbol, dayLabel } from '../lib/format.js';
import type { StringKey } from '../i18n/strings.js';
import { periodLabel } from '../lib/period.js';
import { useLang } from '../i18n/LangProvider.js';
import { HoldToTalk } from '../components/HoldToTalk.js';
import { ListenButton } from '../components/ListenButton.js';
import { Icon } from '../components/Icon.js';
import { Card, Field, Notice, Skeleton } from '../ui/index.js';
import { Composition } from '../ui/visuals.js';
import { TabBar, useWorker } from './WorkerApp.js';

interface Explanation {
  answer: string;
  verificationStatus: 'checked' | 'template_fallback';
}

/** Asks the worker what they were actually paid for last week, once payday has passed. */
export const PaymentPrompt: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { t, lang, money, currency } = useLang();
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
          : t('paymentShort', money(expected - received))
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
      <span className="t-caption muted">{t('confirmPayBody', money(expected))}</span>
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
          <span>{currencySymbol(lang, currency)}</span>
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

const LINE_KEY: Partial<Record<PayslipLine['kind'], StringKey>> = {
  salary: 'lineSalary',
  unpaid_leave: 'lineUnpaid',
  normal: 'lineRegular',
  overtime: 'lineOvertime',
  rest_day: 'lineRestDay',
  holiday: 'lineHoliday',
  seventh_day: 'lineSeventhDay',
  night: 'lineNight',
  sunday: 'lineSunday',
  weekly_rest: 'lineWeeklyRest',
  claim_overtime: 'lineClaim',
};

/** Overtime and premium lines carry their multiplier, so different rates stay apart. */
function lineLabel(line: PayslipLine, t: ReturnType<typeof useLang>['t']): string {
  if (line.kind === 'deduction') return line.labelKey;
  const key = LINE_KEY[line.kind];
  if (!key) return t('netPay');
  const multiplied = ['overtime', 'rest_day', 'holiday', 'seventh_day', 'claim_overtime'];
  return line.multiplier && multiplied.includes(line.kind)
    ? `${t(key)} ${t('timesRate', line.multiplier)}`
    : t(key);
}

const EXTRA = [
  'overtime',
  'rest_day',
  'holiday',
  'seventh_day',
  'night',
  'sunday',
  'weekly_rest',
  'claim_overtime',
];

/** Payments the country's law adds each year: aguinaldo, 13º salário, subsídio de Natal, ... */
const AnnualPayments: React.FC = () => {
  const { t, tx, money, lang } = useLang();
  const { overview } = useWorker();
  const list = overview?.annualPayments ?? [];
  if (list.length === 0) return null;
  return (
    <Card>
      <h2 className="t-headline">{t('annualTitle')}</h2>
      {list.map((a) => (
        <div key={a.code} className="between" style={{ alignItems: 'flex-start' }}>
          <div className="stack-sm grow">
            <span className="t-strong">{tx(`annual_${a.code}`)}</span>
            <span className="t-caption muted">
              {a.due ? t('annualDue', dayLabel(a.due, lang)) : t('annualBefore')}
            </span>
          </div>
          {a.estimate !== null && (
            <span className="t-caption muted">{t('annualEstimate', money(a.estimate))}</span>
          )}
        </div>
      ))}
    </Card>
  );
};

export const Pay: React.FC = () => {
  const { t, lang, money } = useLang();
  const { wp, overview } = useWorker();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slip = overview?.payslip ?? null;
  const sum = (kinds: string[]) =>
    slip?.lines.filter((l) => kinds.includes(l.kind)).reduce((n, l) => n + l.amount, 0) ?? 0;
  const parts = [
    {
      label: overview?.payType === 'monthly' ? t('lineSalary') : t('lineRegular'),
      value: sum(['salary', 'normal', 'unpaid_leave']),
      color: 'var(--accent)',
    },
    { label: t('lineOvertime'), value: sum(EXTRA), color: 'var(--accent-mid)' },
    { label: t('lineDeduction'), value: -sum(['deduction']), color: 'var(--line-strong)' },
  ];

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
        <header className="stack-sm" style={{ paddingTop: 8, gap: 2 }}>
          {overview && (
            <span className="home-date">
              {t(
                overview.payType === 'monthly' ? 'monthOf' : 'periodOf',
                periodLabel(overview.period, lang)
              )}
            </span>
          )}
          <h1 className="t-title">{t('pay')}</h1>
        </header>
        {!overview && <Skeleton height={160} />}
        {overview && !slip && <Notice kind="info">{t('rateNotSet')}</Notice>}
        {slip && (
          <>
            <section className="pay-amount">
              <span className="pay-net t-num">{money(slip.netPay)}</span>
              <span className="muted">{t('paidOn', dayLabel(overview!.period.payDate, lang))}</span>
              <Composition parts={parts} />
              <div className="legend">
                {parts
                  .filter((p) => p.value > 0)
                  .map((p) => (
                    <span key={p.label}>
                      <i style={{ background: p.color }} />
                      {p.label} {money(p.value)}
                    </span>
                  ))}
              </div>
            </section>
            <div className="group-label between">
              <span>{t('howItAddsUp')}</span>
              <ListenButton text={`${t('netPay')} ${money(slip.netPay)}`} />
            </div>
            <div className="group">
              {slip.lines
                .filter((l) => l.kind !== 'net')
                .map((l) => (
                  <div key={l.id} className="group-row">
                    <span className="grow stack-sm" style={{ gap: 2 }}>
                      <span className="t-strong">
                        {lineLabel(l, t)}
                        {l.ruleRef && (
                          <span className="rule-ref">
                            {l.ruleRef.kind === 'law' ? t('law') : t('policy')}
                          </span>
                        )}
                      </span>
                      {l.hours !== undefined && l.rate !== undefined && (
                        <span className="t-caption muted">
                          {l.hours} {t('hoursUnit')} × {money(l.rate)}
                        </span>
                      )}
                    </span>
                    <span className={`t-strong t-num${l.amount < 0 ? ' c-danger' : ''}`}>
                      {l.amount < 0 ? '−' : ''}
                      {money(Math.abs(l.amount))}
                    </span>
                  </div>
                ))}
              <div className="group-row group-total">
                <span className="grow">{t('netPay')}</span>
                <span className="t-num">{money(slip.netPay)}</span>
              </div>
            </div>

            <div className="group-label">{t('askTitle')}</div>
            <div className="stack">
              <span className="t-caption muted" style={{ marginTop: -6 }}>
                {t('askBody')}
              </span>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (question.trim()) void ask({ question: question.trim() });
                }}
              >
                <input
                  className="input ask-pill"
                  aria-label={t('askTitle')}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('askPlaceholder')}
                />
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
            </div>
          </>
        )}

        <div className="group">
          <Link to={`/w/${wp.id}/claim`} className="group-row">
            <span className="group-ic">
              <Icon name="clock" size={18} />
            </span>
            <span className="grow stack-sm" style={{ gap: 2 }}>
              <span className="t-strong">{t('claimMissed')}</span>
              <span className="t-caption muted">{t('claimMissedSub')}</span>
            </span>
            <Icon name="chev" size={18} className="faint" />
          </Link>
        </div>

        <AnnualPayments />

        <PaymentPrompt />
      </div>
      <TabBar />
    </main>
  );
};
