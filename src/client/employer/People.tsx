import React from 'react';
import { Link } from 'react-router-dom';
import { money } from '../lib/format.js';
import { Card, Empty, Pill, Skeleton } from '../ui/index.js';
import { useEmployer } from './EmployerApp.js';

const STATUS = {
  on_site: <Pill tone="good">On site</Pill>,
  checked_out: <Pill>Checked out</Pill>,
  absent: <Pill tone="neutral">Not in</Pill>,
  on_leave: <Pill tone="accent">On leave</Pill>,
  wfh: <Pill tone="accent">From home</Pill>,
};

export const People: React.FC = () => {
  const { dash } = useEmployer();
  if (!dash) return <Skeleton height={300} />;
  return (
    <>
      <header className="between">
        <h1 className="t-title">People</h1>
        <Link className="btn btn-primary btn-sm" to="../invite">
          Invite
        </Link>
      </header>
      {dash.people.length === 0 ? (
        <Card>
          <Empty icon="users">No one has joined yet. Share your invite code to add workers.</Empty>
        </Card>
      ) : (
        <Card flush>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hide-mobile">Team</th>
                <th>Today</th>
                <th className="hide-mobile">This week</th>
                <th className="hide-mobile">Phone</th>
              </tr>
            </thead>
            <tbody>
              {dash.people.map((p) => (
                <tr key={p.uid}>
                  <td>
                    <Link
                      to={p.uid}
                      className="stack-sm"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <span className="t-strong">{p.name}</span>
                      <span className="t-caption muted">
                        {p.title}
                        {p.role === 'supervisor' ? ' · supervisor' : ''}
                        {p.icMember ? ' · committee' : ''}
                      </span>
                    </Link>
                  </td>
                  <td className="hide-mobile">{p.team}</td>
                  <td>
                    {STATUS[p.status]}
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
                      <Pill tone="warn">Set wage</Pill>
                    )}
                  </td>
                  <td className="hide-mobile">
                    {p.pendingDevice ? (
                      <Pill tone="accent">Approve new phone</Pill>
                    ) : p.hasDevice ? (
                      <Pill tone="good">Registered</Pill>
                    ) : (
                      <Pill>None yet</Pill>
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
