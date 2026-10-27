import { describe, it, expect } from 'vitest';
import { formatCountdown } from '../../src/client/admin/formatCountdown.js';

describe('formatCountdown', () => {
  const today = '2026-10-27';

  it('reports hours remaining for deadlines within a day', () => {
    expect(formatCountdown('2026-10-27T17:00:00Z', today)).toEqual({
      label: '5h remaining',
      overdue: false,
    });
  });

  it('reports days and hours for later deadlines', () => {
    expect(formatCountdown('2026-10-29T15:00:00Z', today)).toEqual({
      label: '2d 3h left',
      overdue: false,
    });
  });

  it('flags overdue deadlines', () => {
    expect(formatCountdown('2026-10-26T08:00:00Z', today)).toEqual({
      label: '28h overdue',
      overdue: true,
    });
  });
});
