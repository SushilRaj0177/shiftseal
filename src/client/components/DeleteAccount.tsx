import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';
import { useLang } from '../i18n/LangProvider.js';
import { errorMessage } from '../lib/api.js';
import { Notice, Sheet } from '../ui/index.js';
import { toast } from '../ui/toast.js';

/** Delete my account: one quiet link, then a sheet that says exactly what happens. */
export const DeleteAccount: React.FC<{ small?: boolean }> = ({ small }) => {
  const { t } = useLang();
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
      toast(t('accountDeleted'));
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost danger-text${small ? ' btn-sm' : ''}`}
        onClick={() => setOpen(true)}
      >
        {t('deleteAccount')}
      </button>
      <a className="t-caption privacy-link" href="/privacy.html" target="_blank" rel="noopener">
        {t('privacyPolicy')}
      </a>
      {open && (
        <Sheet title={t('deleteAccount')} onClose={() => !busy && setOpen(false)}>
          <p className="muted">{t('deleteAccountBody')}</p>
          {error && <Notice kind="error">{error}</Notice>}
          <button type="button" className="btn btn-danger" disabled={busy} onClick={confirm}>
            {t('deleteAccountConfirm')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            {t('cancel')}
          </button>
        </Sheet>
      )}
    </>
  );
};
