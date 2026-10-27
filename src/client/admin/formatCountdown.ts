/** Human-readable time left until a deadline, relative to the demo's reference day (noon UTC). */
export function formatCountdown(
  deadlineIso: string,
  refTodayIso: string
): {
  label: string;
  overdue: boolean;
} {
  const nowMs = Date.parse(`${refTodayIso}T12:00:00Z`);
  const targetMs = Date.parse(deadlineIso);
  const diffHours = Math.round((targetMs - nowMs) / (3600 * 1000));
  if (diffHours < 0) {
    return { label: `${Math.abs(diffHours)}h overdue`, overdue: true };
  }
  if (diffHours < 24) {
    return { label: `${diffHours}h remaining`, overdue: false };
  }
  const days = Math.floor(diffHours / 24);
  const remH = diffHours % 24;
  return { label: `${days}d ${remH}h left`, overdue: false };
}
