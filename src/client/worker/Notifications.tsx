import React from 'react';
import { dayLabel, timeAgo } from '../lib/format.js';
import { useLang } from '../i18n/LangProvider.js';
import { AppBar, Empty, Tile } from '../ui/index.js';
import { useWorker } from './WorkerApp.js';

const ICON = {
  SHIFT_EDITED: 'pencil',
  DISPUTE_RESOLVED: 'scale',
  HAZARD_UPDATED: 'alert',
  DEVICE_APPROVED: 'phone',
  LEAVE_DECIDED: 'clock',
  LEAVE_REVOKED: 'pencil',
} as const;

export const Notifications: React.FC = () => {
  const { t, lang } = useLang();
  const { wp, overview } = useWorker();
  const items = overview?.notifications ?? [];
  return (
    <main className="screen">
      <AppBar back={`/w/${wp.id}`} title={t('notifications')} />
      <div className="screen-body">
        {items.length === 0 ? (
          <Empty icon="bell">{t('noNotifications')}</Empty>
        ) : (
          <div className="card flush">
            {items.map((n) => (
              <div
                key={n.id}
                className="list-row"
                style={{ cursor: 'default', alignItems: 'flex-start' }}
              >
                <Tile
                  icon={ICON[n.type]}
                  tone={
                    n.type === 'SHIFT_EDITED' || n.type === 'LEAVE_REVOKED' ? 'warn' : undefined
                  }
                  small
                />
                <div className="grow stack-sm">
                  <span className="t-strong">
                    {n.type === 'SHIFT_EDITED'
                      ? t('changedNotice', dayLabel(n.date, lang))
                      : n.reason}
                  </span>
                  {n.type === 'SHIFT_EDITED' && (
                    <span className="t-caption muted">
                      {t(
                        'changedDetail',
                        n.oldValue ?? '',
                        n.newValue ?? '',
                        n.supervisorName ?? '',
                        n.reason
                      )}
                    </span>
                  )}
                  <span className="t-caption faint">{timeAgo(n.createdAt, lang)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
