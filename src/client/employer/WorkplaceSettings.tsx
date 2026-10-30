import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { useAuth } from '../auth/AuthProvider.js';
import { Card, Field, Kv, Notice } from '../ui/index.js';
import { useEmployer } from './EmployerApp.js';

export const WorkplaceSettings: React.FC = () => {
  const { base } = useEmployer();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const wp = base.workplace;
  const isOwner = base.member.role === 'owner';
  const [shiftStart, setShiftStart] = useState(wp.shiftStart);
  const [shiftEnd, setShiftEnd] = useState(wp.shiftEnd);
  const [radius, setRadius] = useState(wp.geofence.radiusM);
  const [center, setCenter] = useState(wp.geofence.center);
  const [msg, setMsg] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const save = async () => {
    try {
      await api(`/workplaces/${wp.id}`, {
        method: 'PATCH',
        body: { shiftStart, shiftEnd, geofence: { center, radiusM: radius } },
      });
      setMsg({ kind: 'info', text: 'Saved.' });
    } catch (err) {
      setMsg({ kind: 'error', text: errorMessage(err) });
    }
  };

  const recentre = async () => {
    const r = await getFix(20_000);
    if (r.ok) setCenter({ lat: r.fix.lat, lng: r.fix.lng });
    else setMsg({ kind: 'error', text: 'Could not get your location.' });
  };

  return (
    <>
      <h1 className="t-title">Settings</h1>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="cols">
        <Card>
          <h2 className="t-headline">Workplace</h2>
          <Kv k="Name" v={wp.name} />
          <Kv
            k="Type"
            v={wp.sector === 'construction' ? 'Construction site' : 'Campus or facilities'}
          />
          <Kv k="State" v={wp.state} />
          <Kv k="Invite code" v={wp.inviteCode} />
          <div className="grid-2">
            <Field label="Shift starts">
              <input
                type="time"
                className="input"
                value={shiftStart}
                disabled={!isOwner}
                onChange={(e) => setShiftStart(e.target.value)}
              />
            </Field>
            <Field label="Shift ends">
              <input
                type="time"
                className="input"
                value={shiftEnd}
                disabled={!isOwner}
                onChange={(e) => setShiftEnd(e.target.value)}
              />
            </Field>
          </div>
          <Field label={`Site radius: ${radius} m`}>
            <input
              type="range"
              min={50}
              max={1000}
              step={25}
              value={radius}
              disabled={!isOwner}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </Field>
          <span className="t-caption muted">
            Centre {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </span>
          {isOwner && (
            <div className="row-flex">
              <button type="button" className="btn btn-secondary btn-sm" onClick={recentre}>
                Re-centre on my location
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                Save
              </button>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="t-headline">Account</h2>
          <Kv k="Signed in as" v={base.member.name} />
          <Kv k="Role" v={base.member.role} />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              await signOut();
              navigate('/welcome', { replace: true });
            }}
          >
            Sign out
          </button>
        </Card>
      </div>
    </>
  );
};
