import type { Category } from '../types';

export type CategoryGroup = 'mens_double' | 'womens_double' | 'mix_double' | 'mens_single' | 'final';

export interface ScheduleDay {
  date: string; // ISO date e.g. '2026-07-13'
  label: string;
  category: Category;
  categoryGroup: CategoryGroup;
  timing: string;
  isFinal: boolean;
}

/**
 * Map each numbered category to its base group for the 2-game rule.
 * Rule: Each player can play max 2 Games per CategoryGroup per opponent team (excluding Final).
 */
export const CATEGORY_GROUP_MAP: Record<Category, CategoryGroup> = {
  mens_single: 'mens_single',
  womens_double: 'womens_double',
  mix_double: 'mix_double',
  mens_double_1: 'mens_double',
  mens_double_2: 'mens_double',
  mens_double_3: 'mens_double',
  mens_double_4: 'mens_double',
  mens_double_5: 'mens_double',
};

export const MAX_GAMES_PER_PLAYER_PER_OPPONENT = 2;
export const MAX_GAMES_PER_PLAYER_FINAL = 2;

/** Captain selection deadline: 3:00 PM (15:00) on game day */
export const CAPTAIN_DEADLINE_HOUR = 15; // 24-hour format

export const TOURNAMENT_SCHEDULE: ScheduleDay[] = [
  { date: '2026-07-13', label: '13th July', category: 'mens_double_1', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-14', label: '14th July', category: 'mens_double_2', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-15', label: '15th July', category: 'mix_double', categoryGroup: 'mix_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-16', label: '16th July', category: 'mens_double_3', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-17', label: '17th July', category: 'mens_single', categoryGroup: 'mens_single', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-20', label: '20th July', category: 'mens_double_4', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-21', label: '21st July', category: 'mens_double_5', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-22', label: '22nd July', category: 'womens_double', categoryGroup: 'womens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-23', label: '23rd July', category: 'mens_double_5', categoryGroup: 'mens_double', timing: '6:00 PM – 8:00 PM', isFinal: false },
  { date: '2026-07-24', label: '24th July', category: 'mens_double_1', categoryGroup: 'mens_double', timing: '6:00 PM – 9:00 PM', isFinal: true },
];

/** Get today's schedule entry */
export function getTodaySchedule(): ScheduleDay | null {
  const today = new Date().toISOString().slice(0, 10);
  return TOURNAMENT_SCHEDULE.find((d) => d.date === today) ?? null;
}

/** Check if captain deadline has passed for today */
export function isDeadlinePassed(): boolean {
  const now = new Date();
  return now.getHours() >= CAPTAIN_DEADLINE_HOUR;
}
