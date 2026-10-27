import type { AnonymousFeedbackEntry, FeedbackTheme } from '../types.js';

export const ANONYMITY_MIN_RESPONSES = 5;

export interface GroupFeedbackVisibility {
  workplaceId: string;
  team: string;
  count: number;
  threshold: number;
  visible: boolean;
  statusMessage: string;
  themes: { theme: FeedbackTheme; count: number }[];
  entries: AnonymousFeedbackEntry[];
}

export function evaluateGroupAnonymity(
  workplaceId: string,
  team: string,
  entries: AnonymousFeedbackEntry[]
): GroupFeedbackVisibility {
  const groupEntries = entries.filter((e) => e.workplaceId === workplaceId && e.team === team);
  const count = groupEntries.length;
  const visible = count >= ANONYMITY_MIN_RESPONSES;

  if (!visible) {
    return {
      workplaceId,
      team,
      count,
      threshold: ANONYMITY_MIN_RESPONSES,
      visible: false,
      statusMessage: `Not enough responses yet to protect anonymity (${count}/${ANONYMITY_MIN_RESPONSES})`,
      themes: [],
      entries: [],
    };
  }

  const themeCounts = new Map<FeedbackTheme, number>();
  for (const entry of groupEntries) {
    for (const th of entry.themes) {
      themeCounts.set(th, (themeCounts.get(th) ?? 0) + 1);
    }
  }

  const themes = Array.from(themeCounts.entries())
    .map(([theme, c]) => ({ theme, count: c }))
    .sort((a, b) => b.count - a.count);

  return {
    workplaceId,
    team,
    count,
    threshold: ANONYMITY_MIN_RESPONSES,
    visible: true,
    statusMessage: `Anonymity threshold met (${count}/${ANONYMITY_MIN_RESPONSES})`,
    themes,
    entries: groupEntries,
  };
}
