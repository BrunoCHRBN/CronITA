import type { Session, TimerState } from "./store";
import { elapsedOf, isFocusBlock } from "./store";
import { addDays, startOfDay } from "./time";

/** Study time of the block currently on the clock (0 during breaks). */
export function liveFocusMs(t: TimerState, now: number): number {
  return t.status !== "idle" && isFocusBlock(t) ? elapsedOf(t, now) : 0;
}

export function sumBetween(sessions: Session[], from: number, to: number): number {
  let total = 0;
  for (const s of sessions) if (s.startedAt >= from && s.startedAt < to) total += s.durationMs;
  return total;
}

export function sessionsOfDay(sessions: Session[], dayStart: number): Session[] {
  const end = addDays(dayStart, 1);
  return sessions.filter((s) => s.startedAt >= dayStart && s.startedAt < end);
}

export interface DayTotal {
  day: number;
  ms: number;
}

/** Totals for the last 7 days, oldest first, including the live block today. */
export function lastSevenDays(sessions: Session[], t: TimerState, now: number): DayTotal[] {
  const today = startOfDay(now);
  const days: DayTotal[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = addDays(today, -i);
    days.push({ day, ms: sumBetween(sessions, day, addDays(day, 1)) });
  }
  days[6].ms += liveFocusMs(t, now);
  return days;
}

export interface SubjectStats {
  totalMs: number;
  byTopic: Record<string, number>;
  sessions: number;
}

export function statsBySubject(sessions: Session[]): Record<string, SubjectStats> {
  const out: Record<string, SubjectStats> = {};
  for (const s of sessions) {
    const st = (out[s.subjectId] ??= { totalMs: 0, byTopic: {}, sessions: 0 });
    st.totalMs += s.durationMs;
    st.sessions += 1;
    if (s.topicId) st.byTopic[s.topicId] = (st.byTopic[s.topicId] ?? 0) + s.durationMs;
  }
  return out;
}
