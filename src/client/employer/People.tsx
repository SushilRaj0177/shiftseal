import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangProvider.js';
import type { StringKey } from '../i18n/strings.js';
import { Card, Empty, Pill, Skeleton, type Tone } from '../ui/index.js';
import { PageHead, useEmployer } from './EmployerApp.js';
import { Icon } from '../components/Icon.js';
import { initials } from '../lib/format.js';

const STATUS: Record<string, [Tone | undefined, StringKey]> = {
  on_site: ['good', 'eOnSiteShort'],
  checked_out: [undefined, 'eCheckedOut'],
  absent: ['neutral', 'eNotIn'],
  on_leave: ['accent', 'eOnLeave'],
  wfh: ['accent', 'eFromHome'],
};

export const People: React.FC = () => {
  const { dash } = useEmployer();
  const { t, money } = useLang();
  if (!dash) return <Skeleton height={300} />;
  return (
    <>
      <PageHead
        title={t('eNavPeople')}
        sub={t('ePeopleCount', dash.people.length)}
        action={
          <Link className="btn btn-primary btn-sm" to="../invite">
            <Icon name="plus" size={16} />
            {t('eInvite')}
          </Link>
        }
      />
      {dash.people.length === 0 ? (
        <Card>
          <Empty icon="users">{t('eNoPeople')}</Empty>
        </Card>
      ) : (
        <Card flush>
          <table className="table">
            <thead>
              <tr>
                <th>{t('eColName')}</th>
                <th className="hide-mobile">{t('eColTeam')}</th>
                <th>{t('today')}</th>
                <th className="hide-mobile">{t('eColPay')}</th>
                <th className="hide-mobile">{t('eColPhone')}</th>
              </tr>
            </thead>
            <tbody>
              {dash.people.map((p) => (
                <tr key={p.uid}>
                  <td>
                    <Link
                      to={p.uid}
                      className="person-cell"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <span className={`avatar sm status-${p.status}`} aria-hidden="true">
                        {initials(p.name)}
                      </span>
                      <span className="stack-sm">
                        <span className="row-flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                          <span className="t-strong">{p.name}</span>
                          {p.student && (
                            <Pill tone="neutral">
                              {t(p.student === 'international' ? 'eBadgeVisa' : 'eBadgeStudent')}
                            </Pill>
                          )}
                          {p.minor && <Pill tone="warn">{t('eBadgeMinor')}</Pill>}
                        </span>
                        <span className="t-caption muted">
                          {p.title}
                          {p.role === 'supervisor' ? ` · ${t('eSupervisor')}` : ''}
                          {p.icMember ? ` · ${t('handlerMember')}` : ''}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hide-mobile">{p.team}</td>
                  <td>
                    <Pill tone={STATUS[p.status][0]}>{t(STATUS[p.status][1])}</Pill>
                    {p.checkIn && (
                      <div className="t-caption muted">
                        {p.checkIn}
                        {p.checkOut ? ` – ${p.checkOut}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="hide-mobile">
                    {p.rateSet ? (
                      p.netPay !== null ? (
                        money(p.netPay)
                      ) : (
                        '–'
                      )
                    ) : (
                      <Pill tone="warn">{t('eSetWage')}</Pill>
                    )}
                  </td>
                  <td className="hide-mobile">
                    {p.pendingDevice ? (
                      <Pill tone="accent">{t('eApprovePhone')}</Pill>
                    ) : p.hasDevice ? (
                      <Pill tone="good">{t('eRegistered')}</Pill>
                    ) : (
                      <Pill>{t('eNoneYet')}</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
};
