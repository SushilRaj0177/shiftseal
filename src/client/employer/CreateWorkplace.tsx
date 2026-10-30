import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocationFix } from '../../shared/model.js';
import { api, errorMessage } from '../lib/api.js';
import { getFix } from '../lib/location.js';
import { Icon } from '../components/Icon.js';
import { AppBar, Card, Field, Notice, Spinner } from '../ui/index.js';
import { rememberWorkplace } from '../App.js';

const PRESETS = {
  construction: [
    { code: 'GATE', name: 'Main gate', kind: 'gate' },
    { code: 'SCAF-A', name: 'Scaffold A', kind: 'scaffold' },
    { code: 'BASEMENT', name: 'Basement', kind: 'basement' },
    { code: 'CRANE', name: 'Crane area', kind: 'crane' },
  ],
  campus: [
    { code: 'GATE', name: 'Main gate', kind: 'gate' },
    { code: 'HOSTEL', name: 'Hostel', kind: 'hostel' },
    { code: 'ACADEMIC', name: 'Academic block', kind: 'academic' },
    { code: 'CANTEEN', name: 'Cafeteria', kind: 'cafeteria' },
  ],
};

const STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Delhi',
  'Gujarat',
  'Uttar Pradesh',
  'West Bengal',
  'Other',
];

/** Owner setup: name, type of work, site boundary from the owner's own location, zones, shift times. */
export default function CreateWorkplace() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [sector, setSector] = useState<'construction' | 'campus'>('construction');
  const [state, setState] = useState('Tamil Nadu');
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [payDay, setPayDay] = useState(6);
  const [radius, setRadius] = useState(150);
  const [centre, setCentre] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [zones, setZones] = useState(PRESETS.construction.map((z) => ({ ...z })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async () => {
    setLocating(true);
    setError(null);
    const r = await getFix(20_000);
    setLocating(false);
    if (r.ok) setCentre(r.fix);
    else setError('Could not get your location. Allow location access and stand at the site.');
  };

  const create = async () => {
    if (!centre) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ workplace: { id: string } }>('/workplaces', {
        body: {
          name: name.trim(),
          ownerName: ownerName.trim(),
          sector,
          state,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
          shiftStart,
          shiftEnd,
          payDay,
          geofence: { center: { lat: centre.lat, lng: centre.lng }, radiusM: radius },
          zones: zones.filter((z) => z.name.trim()).map((z) => ({ ...z, name: z.name.trim() })),
        },
      });
      rememberWorkplace(res.workplace.id);
      navigate(`/e/${res.workplace.id}/invite`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const ready = name.trim() && ownerName.trim() && centre && zones.some((z) => z.name.trim());

  return (
    <main className="screen">
      <AppBar back="/join" title="Set up your workplace" />
      <div className="screen-body">
        <Field label="Your name">
          <input
            className="input"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="Workplace name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tower B, Perungudi"
          />
        </Field>
        <span className="t-label">Type of work</span>
        <div className="stack" role="radiogroup">
          {(
            [
              ['construction', 'Construction site', 'Zones, scaffolds, crane areas', 'scaffold'],
              ['campus', 'Campus or facilities', 'Housekeeping, security, hostels', 'building'],
            ] as const
          ).map(([key, title, sub, icon]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={sector === key}
              className="choice"
              onClick={() => {
                setSector(key);
                setZones(PRESETS[key].map((z) => ({ ...z })));
              }}
            >
              <Icon name={icon} size={22} />
              <span className="stack-sm grow">
                <span className="t-strong">{title}</span>
                <span className="t-caption muted">{sub}</span>
              </span>
            </button>
          ))}
        </div>
        <Field label="State (for labour rules)">
          <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <div className="grid-2">
          <Field label="Shift starts">
            <input
              type="time"
              className="input"
              value={shiftStart}
              onChange={(e) => setShiftStart(e.target.value)}
            />
          </Field>
          <Field label="Shift ends">
            <input
              type="time"
              className="input"
              value={shiftEnd}
              onChange={(e) => setShiftEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Pay day">
          <select
            className="select"
            value={payDay}
            onChange={(e) => setPayDay(Number(e.target.value))}
          >
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
              (d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              )
            )}
          </select>
        </Field>

        <Card>
          <span className="t-strong">Site boundary</span>
          <span className="t-caption muted">
            Stand at the centre of the site and tap below. Check-ins from outside this circle are
            marked for review, never blocked.
          </span>
          {centre ? (
            <span className="row-flex t-caption c-good">
              <Icon name="pin" size={18} />
              {centre.lat.toFixed(5)}, {centre.lng.toFixed(5)} · ±{Math.round(centre.accuracyM)} m
            </span>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={locate} disabled={locating}>
            {locating ? (
              <Spinner label="Finding location" />
            ) : centre ? (
              'Use my location again'
            ) : (
              'Use my current location'
            )}
          </button>
          <Field label={`Radius: ${radius} m`}>
            <input
              type="range"
              min={50}
              max={1000}
              step={25}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </Field>
        </Card>

        <Card>
          <span className="t-strong">Zones</span>
          <span className="t-caption muted">
            Workers pick these when reporting hazards. Each gets its own gate code.
          </span>
          {zones.map((z, i) => (
            <input
              key={z.code}
              className="input"
              value={z.name}
              aria-label={`Zone ${i + 1}`}
              onChange={(e) =>
                setZones(zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
            />
          ))}
          <button
            type="button"
            className="link-btn"
            style={{ alignSelf: 'flex-start' }}
            onClick={() =>
              setZones([...zones, { code: `Z${zones.length + 1}`, name: '', kind: 'pin' }])
            }
          >
            Add a zone
          </button>
        </Card>

        {error && <Notice kind="error">{error}</Notice>}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!ready || busy}
          onClick={create}
        >
          {busy ? 'Creating' : 'Create workplace'}
        </button>
      </div>
    </main>
  );
}
