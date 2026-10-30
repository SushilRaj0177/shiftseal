import React, { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../i18n/LangProvider.js';
import { api, errorMessage } from '../lib/api.js';
import { QrScanner, inviteFromScan } from '../lib/QrScanner.js';
import { AppBar, Card, Field, Notice, Sheet, Tile } from '../ui/index.js';
import { Icon } from '../components/Icon.js';
import { useAuth } from './AuthProvider.js';
import { rememberWorkplace } from '../App.js';

interface Preview {
  workplace: { id: string; name: string; sector: string };
  role: 'worker' | 'supervisor';
  invitedBy: string | null;
}

export const Join: React.FC = () => {
  const { t, lang } = useLang();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get('code') ?? '').toUpperCase());
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const find = async (c = code) => {
    setBusy(true);
    setError(null);
    try {
      setPreview(await api<Preview>('/invites/preview', { body: { code: c.trim() } }));
    } catch (err) {
      setPreview(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ workplace: { id: string } }>('/invites/accept', {
        body: { code: code.trim(), name: name.trim(), language: lang },
      });
      rememberWorkplace(res.workplace.id);
      navigate(
        preview?.role === 'supervisor' ? `/e/${res.workplace.id}` : `/w/${res.workplace.id}`,
        { replace: true }
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onScan = useCallback((scanned: string) => {
    setScanning(false);
    setCode(scanned);
    void find(scanned);
  }, []);
  const onScanError = useCallback((m: string) => {
    setScanning(false);
    setError(m);
  }, []);

  return (
    <main className="screen">
      <AppBar
        right={
          <button type="button" className="link-btn" onClick={() => signOut()}>
            {t('signOut')}
          </button>
        }
      />
      <div className="screen-body">
        <h1 className="t-title">{t('joinTitle')}</h1>
        <p className="muted">{t('joinBody')}</p>
        {!preview && (
          <>
            <button
              type="button"
              className="card"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                flexDirection: 'row',
                alignItems: 'center',
                cursor: 'pointer',
                border: 0,
              }}
              onClick={() => setScanning(true)}
            >
              <Icon name="qr" size={24} />
              <span className="grow stack-sm" style={{ textAlign: 'left' }}>
                <span className="t-strong">{t('scanSite')}</span>
                <span className="t-caption" style={{ opacity: 0.8 }}>
                  {t('opensCamera')}
                </span>
              </span>
              <Icon name="chev" />
            </button>
            <div className="row-flex">
              <hr className="divider grow" />
              <span className="t-caption faint">{t('or')}</span>
              <hr className="divider grow" />
            </div>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                void find();
              }}
            >
              <Field label={t('inviteCode')}>
                <input
                  className="input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="TWR-4K9PM"
                />
              </Field>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={code.trim().length < 5 || busy}
              >
                {t('findWorkplace')}
              </button>
            </form>
          </>
        )}
        {preview && (
          <Card>
            <div className="row-flex">
              <Tile icon="building" />
              <div className="grow stack-sm">
                <span className="t-strong">{preview.workplace.name}</span>
                {preview.invitedBy && (
                  <span className="t-caption muted">{t('invitedBy', preview.invitedBy)}</span>
                )}
              </div>
            </div>
            <p className="t-caption muted">{t('ownershipNote', preview.workplace.name)}</p>
            <Field label={t('yourName')}>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
              />
            </Field>
          </Card>
        )}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="spacer" />
        {!preview && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              sessionStorage.setItem('shiftseal.intent', 'employer');
              navigate('/new-workplace');
            }}
          >
            {t('iManage')}
          </button>
        )}
        {preview && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!name.trim() || busy}
            onClick={join}
          >
            {t('joinNamed', preview.workplace.name)}
          </button>
        )}
      </div>
      {scanning && (
        <Sheet title={t('scanSite')} onClose={() => setScanning(false)}>
          <QrScanner
            parse={inviteFromScan}
            onResult={onScan}
            onError={onScanError}
            hint={t('joinBody')}
          />
        </Sheet>
      )}
    </main>
  );
};
