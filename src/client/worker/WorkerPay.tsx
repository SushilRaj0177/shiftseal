import React, { useState } from 'react';
import type {
  Language,
  WorkerProfile,
  PayslipCalculationResult,
  OvertimeClaim,
  ClaimMatchStatus,
  ClaimEvidence,
} from '../../shared/types.js';
import { t } from '../../shared/i18n/index.js';
import { ListenButton } from '../components/ListenButton.js';
import { HoldToTalk } from '../components/HoldToTalk.js';

interface WorkerPayProps {
  lang: Language;
  worker: WorkerProfile;
  payslip: PayslipCalculationResult;
  claims: OvertimeClaim[];
  onRefresh: () => void;
}

const TAMIL_OVERTIME_SAMPLE =
  'நேத்து சனிக்கிழமை ஸ்லாப் போடறதுக்கு ரெண்டு மணி நேரம் கூடுதலா இருந்தேன்';

export const WorkerPay: React.FC<WorkerPayProps> = ({
  lang,
  worker,
  payslip,
  claims,
  onRefresh,
}) => {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showAskWhy, setShowAskWhy] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askResult, setAskResult] = useState<{
    answer: string;
    verificationStatus: 'checked' | 'template_fallback';
    isDemoFallback: boolean;
  } | null>(null);

  const [showClaimSheet, setShowClaimSheet] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [draftClaim, setDraftClaim] = useState<{
    date: string;
    extraHours: number;
    reason: string;
    detectedLanguage: Language;
    isDemoFallback: boolean;
    matchStatus: ClaimMatchStatus;
    supportedHours: number;
    evidence: ClaimEvidence;
  } | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<OvertimeClaim | null>(null);

  const payslipSpeech =
    lang === 'ta'
      ? `இந்த வார நிகர சம்பளம் ரூபாய் ${payslip.netPay}. சாதாரண பணி ${payslip.normalHours} மணிக்கு ரூபாய் ${payslip.normalHours * payslip.hourlyRate}. ஓவர்டைம் ${payslip.otHours} மணிக்கு இருமடங்கு விகிதத்தில் ரூபாய் ${payslip.otHours * payslip.hourlyRate * 2}. பிடித்தம் ரூபாய் ${payslip.totalDeductions}.`
      : lang === 'hi'
        ? `इस सप्ताह का शुद्ध वेतन ${payslip.netPay} रुपये है। सामान्य कार्य ${payslip.normalHours} घंटे, ओवरटाइम ${payslip.otHours} घंटे दोगुनी दर पर, और कुल कटौती ${payslip.totalDeductions} रुपये है।`
        : `Your weekly net pay is ${payslip.netPay} rupees. Normal hours: ${payslip.normalHours}. Overtime hours at double rate: ${payslip.otHours}. Deductions: ${payslip.totalDeductions} rupees.`;

  const runAskWhy = async (payload: { question?: string; audioBase64?: string; audioMimeType?: string }) => {
    setAskLoading(true);
    try {
      const res = await fetch('/api/ai/explain-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          lang,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAskResult(data);
      }
    } finally {
      setAskLoading(false);
    }
  };

  const runStructureClaim = async (payload: {
    text?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setClaimLoading(true);
    setSubmittedClaim(null);
    try {
      const res = await fetch('/api/ai/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          lang,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftClaim({
          date: data.structuredClaim.date,
          extraHours: data.structuredClaim.extraHours,
          reason: data.structuredClaim.reason,
          detectedLanguage: data.structuredClaim.detectedLanguage,
          isDemoFallback: Boolean(data.structuredClaim.isDemoFallback),
          matchStatus: data.matchResult.status,
          supportedHours: data.matchResult.supportedHours,
          evidence: data.matchResult.evidence,
        });
      }
    } finally {
      setClaimLoading(false);
    }
  };

  const handleConfirmClaim = async () => {
    if (!draftClaim) return;
    setClaimLoading(true);
    try {
      const res = await fetch('/api/worker/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          date: draftClaim.date,
          extraHours: Number(draftClaim.extraHours),
          reason: draftClaim.reason,
          detectedLanguage: draftClaim.detectedLanguage,
          isDemoFallback: draftClaim.isDemoFallback,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmittedClaim(data.claim);
        setDraftClaim(null);
        onRefresh();
      }
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Payslip Card */}
      <section className="card" aria-labelledby="payslip-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div>
            <span className="badge badge-accent">{payslip.weekLabel}</span>
            <h3 id="payslip-heading" style={{ marginTop: '6px' }}>
              {t(lang, 'navPay')} · ₹{payslip.netPay}
            </h3>
          </div>
          <ListenButton lang={lang} text={payslipSpeech} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payslip.lines.map((line) => {
            const isNet = line.kind === 'net';
            const isExpanded = expandedRuleId === line.id;
            const kindBadgeLabel =
              line.ruleRef.kind === 'law' ? t(lang, 'lawBadge') : t(lang, 'policyBadge');

            return (
              <div
                key={line.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: isNet ? 'var(--accent-soft)' : 'var(--surface-subtle)',
                  border: line.flagged ? '1px solid var(--danger)' : '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: isNet ? '17px' : '15px' }}>{line.labelKey}</strong>
                    {line.hours !== undefined && line.rate !== undefined && (
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-secondary)' }}>
                        {line.hours}h × ₹{line.rate}/hr
                      </span>
                    )}
                  </div>
                  <strong
                    style={{
                      fontSize: isNet ? '19px' : '16px',
                      color: line.amount < 0 ? 'var(--danger)' : isNet ? 'var(--accent)' : 'var(--ink)',
                    }}
                  >
                    {line.amount < 0 ? `-₹${Math.abs(line.amount)}` : `₹${line.amount}`}
                  </strong>
                </div>

                {line.flagged && line.flagReason && (
                  <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', fontWeight: 600 }}>
                    ⚠️ {line.flagReason}
                  </p>
                )}

                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedRuleId(isExpanded ? null : line.id)}
                    style={{
                      minHeight: '30px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: '999px',
                    }}
                  >
                    <span>⚖️ {kindBadgeLabel}: {line.ruleRef.id}</span>
                    <span aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '10px',
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <strong>Source:</strong> {line.ruleRef.source}
                    </div>
                    {line.ruleRef.note && (
                      <div style={{ marginTop: '4px', color: 'var(--ink-secondary)' }}>
                        {line.ruleRef.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-subtle"
            onClick={() => setShowAskWhy((v) => !v)}
            style={{ flex: 1 }}
          >
            <span aria-hidden="true">❓</span>
            <span>{t(lang, 'askWhy')}</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowClaimSheet((v) => !v)}
            style={{ flex: 1 }}
          >
            <span aria-hidden="true">⏱️</span>
            <span>{t(lang, 'claimMissedOvertime')}</span>
          </button>
        </div>
      </section>

      {/* Ask Why Sheet */}
      {showAskWhy && (
        <section className="card" aria-labelledby="ask-why-heading">
          <h3 id="ask-why-heading">❓ {t(lang, 'askWhy')}</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginTop: '4px', marginBottom: '12px' }}>
            Every number in the AI explanation is verified against your shift ledger before display.
          </p>

          <HoldToTalk
            lang={lang}
            disabled={askLoading}
            onRecorded={(audioBase64, audioMimeType) =>
              runAskWhy({ audioBase64, audioMimeType })
            }
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <label htmlFor="ask-pay-input" className="skip-link">
              Ask a question about your pay
            </label>
            <input
              id="ask-pay-input"
              type="text"
              placeholder={t(lang, 'orTypeHere')}
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              style={{
                flex: 1,
                minHeight: '46px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
              }}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={askLoading}
              onClick={() =>
                runAskWhy({
                  question: askQuestion.trim() || 'Why is my pay this amount this week?',
                })
              }
            >
              Ask
            </button>
          </div>

          {askLoading && (
            <div className="skeleton" style={{ height: '72px', marginTop: '12px' }} />
          )}

          {askResult && (
            <div
              aria-live="polite"
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span className="badge badge-good">
                  {askResult.verificationStatus === 'checked'
                    ? t(lang, 'checkedAgainstRecord')
                    : t(lang, 'templateAnswerBadge')}
                </span>
                {askResult.isDemoFallback && (
                  <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
                )}
              </div>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>{askResult.answer}</p>
              <ListenButton lang={lang} text={askResult.answer} />
            </div>
          )}
        </section>
      )}

      {/* Claim Missed Overtime Sheet */}
      {showClaimSheet && (
        <section className="card" aria-labelledby="claim-ot-heading">
          <h3 id="claim-ot-heading">⏱️ {t(lang, 'claimMissedOvertime')}</h3>
          <div style={{ marginTop: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', display: 'block', marginBottom: '6px' }}>
              {t(lang, 'samplePromptLabel')}
            </span>
            <button
              type="button"
              className="btn-subtle"
              disabled={claimLoading}
              onClick={() => {
                setClaimText(TAMIL_OVERTIME_SAMPLE);
                runStructureClaim({ text: TAMIL_OVERTIME_SAMPLE });
              }}
              style={{ textAlign: 'left', fontSize: '13px', width: '100%', justifyContent: 'flex-start' }}
            >
              <span>🇮🇳 தமிழ் sample:</span>
              <span style={{ fontWeight: 400 }}>"{TAMIL_OVERTIME_SAMPLE}"</span>
            </button>
          </div>

          <HoldToTalk
            lang={lang}
            disabled={claimLoading}
            onRecorded={(audioBase64, audioMimeType) =>
              runStructureClaim({ audioBase64, audioMimeType })
            }
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <label htmlFor="claim-text-input" className="skip-link">
              Describe missed overtime
            </label>
            <input
              id="claim-text-input"
              type="text"
              placeholder={t(lang, 'orTypeHere')}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              style={{
                flex: 1,
                minHeight: '46px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                background: 'var(--bg)',
              }}
            />
            <button
              type="button"
              className="btn-subtle"
              disabled={claimLoading || !claimText.trim()}
              onClick={() => runStructureClaim({ text: claimText.trim() })}
            >
              Check
            </button>
          </div>

          {claimLoading && (
            <div className="skeleton" style={{ height: '110px', marginTop: '12px' }} />
          )}

          {/* Trust UI: What was understood -> What was checked -> Evidence -> Result */}
          {draftClaim && (
            <div
              aria-live="polite"
              style={{
                marginTop: '14px',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--accent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span
                  className={
                    draftClaim.matchStatus === 'supported'
                      ? 'badge badge-good'
                      : draftClaim.matchStatus === 'partly_supported'
                        ? 'badge badge-warning'
                        : 'badge badge-danger'
                  }
                >
                  {draftClaim.matchStatus === 'supported'
                    ? `✓ ${t(lang, 'supportedBadge')}`
                    : draftClaim.matchStatus === 'partly_supported'
                      ? `⚠️ ${t(lang, 'partlySupportedBadge')} (${draftClaim.supportedHours}h)`
                      : `⏳ ${t(lang, 'unsupportedBadge')}`}
                </span>
                {draftClaim.isDemoFallback && (
                  <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label htmlFor="edit-claim-date" style={{ fontSize: '12px', display: 'block' }}>
                    Shift Date
                  </label>
                  <input
                    id="edit-claim-date"
                    type="text"
                    value={draftClaim.date}
                    onChange={(e) => setDraftClaim({ ...draftClaim, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="edit-claim-hours" style={{ fontSize: '12px', display: 'block' }}>
                    Extra Hours
                  </label>
                  <input
                    id="edit-claim-hours"
                    type="number"
                    step="0.5"
                    value={draftClaim.extraHours}
                    onChange={(e) =>
                      setDraftClaim({ ...draftClaim, extraHours: Number(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-claim-reason" style={{ fontSize: '12px', display: 'block' }}>
                  Reason understood
                </label>
                <input
                  id="edit-claim-reason"
                  type="text"
                  value={draftClaim.reason}
                  onChange={(e) => setDraftClaim({ ...draftClaim, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                  }}
                />
              </div>

              <div style={{ fontSize: '12px', padding: '8px', background: 'var(--surface)', borderRadius: '6px' }}>
                <strong>Ledger Evidence Check:</strong> {draftClaim.evidence.explanation}
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={claimLoading}
                onClick={handleConfirmClaim}
              >
                ✓ {t(lang, 'confirmAndSubmit')}
              </button>
            </div>
          )}

          {submittedClaim && (
            <div
              role="status"
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--good-soft)',
                color: 'var(--good)',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              ✓ Overtime claim recorded ({submittedClaim.date} · {submittedClaim.extraHours}h ·{' '}
              {submittedClaim.matchStatus.replace('_', ' ')}).
            </div>
          )}
        </section>
      )}

      {/* Existing Claims History */}
      {claims.length > 0 && (
        <section className="card" aria-labelledby="claims-history-heading">
          <h3 id="claims-history-heading">Overtime Claims & Disputes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {claims.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <strong>
                    {c.date} · +{c.extraHours}h
                  </strong>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {c.isDemoFallback && (
                      <span className="badge badge-warning">{t(lang, 'demoResponseBadge')}</span>
                    )}
                    <span
                      className={
                        c.resolutionStatus === 'approved'
                          ? 'badge badge-good'
                          : c.resolutionStatus === 'rejected'
                            ? 'badge badge-danger'
                            : 'badge badge-warning'
                      }
                    >
                      {c.matchStatus} · {c.resolutionStatus}
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--ink-secondary)', marginTop: '4px' }}>{c.reason}</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>{c.evidence.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
