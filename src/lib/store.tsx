import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { SUBJECTS, SUBJECT_BY_ID } from "./subjects";

export type Mode = "livre" | "pomodoro";
export type Phase = "foco" | "pausa-curta" | "pausa-longa";
export type ThemePref = "system" | "light" | "dark";

export interface Session {
  id: string;
  subjectId: string;
  topicId: string | null;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  mode: Mode;
}

export interface TimerState {
  status: "idle" | "running" | "paused";
  mode: Mode;
  phase: Phase;
  /** Completed Pomodoro focus blocks since the counter was last reset. */
  cycle: number;
  subjectId: string;
  topicId: string | null;
  /** When the current block started (first press of "Iniciar"). */
  startedAt: number | null;
  /** When the current running stretch started; null while paused/idle. */
  segmentStart: number | null;
  /** Time accumulated in earlier running stretches of this block. */
  accumulatedMs: number;
  /** Last automatic phase change, used to play a sound once. */
  lastEvent: { type: "focus-done" | "break-done"; at: number } | null;
}

export interface Settings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  longBreakEvery: number;
  sound: boolean;
  dailyGoalHours: number;
}

export interface AppData {
  version: 1;
  sessions: Session[];
  reviewed: Record<string, true>;
  settings: Settings;
  timer: TimerState;
  theme: ThemePref;
}

/** Sessions shorter than this are not saved (accidental starts). */
export const MIN_SESSION_MS = 10_000;

const STORAGE_KEY = "cronita:v1";
const LEGACY_STORAGE_KEY = "cronometro-ita:v1";

const DEFAULT_SETTINGS: Settings = {
  focusMin: 50,
  shortBreakMin: 10,
  longBreakMin: 25,
  longBreakEvery: 3,
  sound: true,
  dailyGoalHours: 6,
};

function defaultTimer(): TimerState {
  return {
    status: "idle",
    mode: "livre",
    phase: "foco",
    cycle: 0,
    subjectId: SUBJECTS[0].id,
    topicId: null,
    startedAt: null,
    segmentStart: null,
    accumulatedMs: 0,
    lastEvent: null,
  };
}

function defaultData(): AppData {
  return {
    version: 1,
    sessions: [],
    reviewed: {},
    settings: { ...DEFAULT_SETTINGS },
    timer: defaultTimer(),
    theme: "system",
  };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.version !== 1) return defaultData();
    const base = defaultData();
    const timer = { ...base.timer, ...parsed.timer };
    if (!SUBJECT_BY_ID[timer.subjectId]) {
      timer.subjectId = base.timer.subjectId;
      timer.topicId = null;
    }
    return {
      ...base,
      ...parsed,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      reviewed: parsed.reviewed ?? {},
      settings: { ...base.settings, ...parsed.settings },
      timer,
    };
  } catch {
    return defaultData();
  }
}

export function elapsedOf(t: TimerState, now: number): number {
  const running = t.status === "running" && t.segmentStart !== null ? now - t.segmentStart : 0;
  return t.accumulatedMs + Math.max(0, running);
}

export function phaseTargetMs(phase: Phase, s: Settings): number {
  const min = phase === "foco" ? s.focusMin : phase === "pausa-curta" ? s.shortBreakMin : s.longBreakMin;
  return min * 60_000;
}

/** True when the running block counts as study time. */
export function isFocusBlock(t: TimerState): boolean {
  return t.mode === "livre" || t.phase === "foco";
}

function toIdle(t: TimerState): TimerState {
  return { ...t, status: "idle", phase: "foco", startedAt: null, segmentStart: null, accumulatedMs: 0 };
}

type Action =
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "finish"; now: number; id: string }
  | { type: "discard" }
  | { type: "tick"; now: number; id: string }
  | { type: "setMode"; mode: Mode }
  | { type: "setSubject"; subjectId: string; topicId: string | null }
  | { type: "toggleReviewed"; topicId: string }
  | { type: "updateSettings"; settings: Partial<Settings> }
  | { type: "resetCycle" }
  | { type: "setTheme"; theme: ThemePref }
  | { type: "deleteSession"; id: string }
  | { type: "restoreSession"; session: Session }
  | { type: "importData"; data: AppData };

function reducer(state: AppData, action: Action): AppData {
  const t = state.timer;
  switch (action.type) {
    case "start": {
      if (t.status === "running") return state;
      const startedAt = t.status === "idle" ? action.now : t.startedAt;
      const accumulatedMs = t.status === "idle" ? 0 : t.accumulatedMs;
      return {
        ...state,
        timer: { ...t, status: "running", startedAt, segmentStart: action.now, accumulatedMs },
      };
    }
    case "pause": {
      if (t.status !== "running") return state;
      return {
        ...state,
        timer: { ...t, status: "paused", accumulatedMs: elapsedOf(t, action.now), segmentStart: null },
      };
    }
    case "finish": {
      if (t.status === "idle") return state;
      const elapsed = elapsedOf(t, action.now);
      let sessions = state.sessions;
      if (isFocusBlock(t) && elapsed >= MIN_SESSION_MS) {
        sessions = [
          ...sessions,
          {
            id: action.id,
            subjectId: t.subjectId,
            topicId: t.topicId,
            startedAt: t.startedAt ?? action.now - elapsed,
            endedAt: action.now,
            durationMs: elapsed,
            mode: t.mode,
          },
        ];
      }
      return { ...state, sessions, timer: toIdle(t) };
    }
    case "discard":
      return t.status === "idle" ? state : { ...state, timer: toIdle(t) };
    case "tick": {
      if (t.mode !== "pomodoro" || t.status !== "running" || t.segmentStart === null) return state;
      const target = phaseTargetMs(t.phase, state.settings);
      if (elapsedOf(t, action.now) < target) return state;
      // The exact moment the block ended, even if the tab was asleep.
      const endAt = t.segmentStart + (target - t.accumulatedMs);

      if (t.phase !== "foco") {
        return {
          ...state,
          timer: { ...toIdle(t), lastEvent: { type: "break-done", at: action.now } },
        };
      }

      const session: Session = {
        id: action.id,
        subjectId: t.subjectId,
        topicId: t.topicId,
        startedAt: t.startedAt ?? endAt - target,
        endedAt: endAt,
        durationMs: target,
        mode: "pomodoro",
      };
      const cycle = t.cycle + 1;
      const phase: Phase = cycle % state.settings.longBreakEvery === 0 ? "pausa-longa" : "pausa-curta";
      let timer: TimerState = {
        ...t,
        cycle,
        phase,
        status: "running",
        startedAt: endAt,
        segmentStart: endAt,
        accumulatedMs: 0,
        lastEvent: { type: "focus-done", at: action.now },
      };
      // Break also already over (computer was asleep): wait for the user.
      if (action.now - endAt >= phaseTargetMs(phase, state.settings)) {
        timer = { ...toIdle(timer), lastEvent: { type: "break-done", at: action.now } };
      }
      return { ...state, sessions: [...state.sessions, session], timer };
    }
    case "setMode":
      if (t.status !== "idle" || t.mode === action.mode) return state;
      return { ...state, timer: { ...t, mode: action.mode, phase: "foco" } };
    case "setSubject":
      if (t.status !== "idle") return state;
      return { ...state, timer: { ...t, subjectId: action.subjectId, topicId: action.topicId } };
    case "toggleReviewed": {
      const reviewed = { ...state.reviewed };
      if (reviewed[action.topicId]) delete reviewed[action.topicId];
      else reviewed[action.topicId] = true;
      return { ...state, reviewed };
    }
    case "updateSettings":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "resetCycle":
      return { ...state, timer: { ...t, cycle: 0 } };
    case "setTheme":
      return { ...state, theme: action.theme };
    case "deleteSession":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case "restoreSession": {
      const sessions = [...state.sessions, action.session].sort((a, b) => a.startedAt - b.startedAt);
      return { ...state, sessions };
    }
    case "importData": {
      const imported = action.data;
      return {
        ...state,
        sessions: Array.isArray(imported.sessions) ? imported.sessions : state.sessions,
        reviewed: imported.reviewed ? { ...imported.reviewed } : state.reviewed,
        settings: { ...state.settings, ...imported.settings },
      };
    }
  }
}

export function exportDataJson(state: AppData): string {
  const exportPayload: AppData = {
    version: 1,
    sessions: state.sessions,
    reviewed: state.reviewed,
    settings: state.settings,
    timer: toIdle(state.timer),
    theme: state.theme,
  };
  return JSON.stringify(exportPayload, null, 2);
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function useStoreValue() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    const themeParam = new URLSearchParams(window.location.search).get("theme");
    const activeTheme = themeParam === "dark" || themeParam === "light" ? themeParam : state.theme;
    if (activeTheme === "system") delete root.dataset.theme;
    else root.dataset.theme = activeTheme;
  }, [state.theme]);

  const start = useCallback(() => dispatch({ type: "start", now: Date.now() }), []);
  const pause = useCallback(() => dispatch({ type: "pause", now: Date.now() }), []);
  const discard = useCallback(() => dispatch({ type: "discard" }), []);
  const tick = useCallback(() => dispatch({ type: "tick", now: Date.now(), id: newId() }), []);

  /** Ends the block. Returns the saved session id, or null if nothing was saved. */
  const finish = useCallback((): { id: string; durationMs: number } | null => {
    const now = Date.now();
    const id = newId();
    const t = state.timer;
    const elapsed = elapsedOf(t, now);
    dispatch({ type: "finish", now, id });
    return isFocusBlock(t) && t.status !== "idle" && elapsed >= MIN_SESSION_MS
      ? { id, durationMs: elapsed }
      : null;
  }, [state.timer]);

  const actions = useMemo(
    () => ({
      start,
      pause,
      finish,
      discard,
      tick,
      setMode: (mode: Mode) => dispatch({ type: "setMode", mode }),
      setSubject: (subjectId: string, topicId: string | null = null) =>
        dispatch({ type: "setSubject", subjectId, topicId }),
      toggleReviewed: (topicId: string) => dispatch({ type: "toggleReviewed", topicId }),
      updateSettings: (settings: Partial<Settings>) => dispatch({ type: "updateSettings", settings }),
      resetCycle: () => dispatch({ type: "resetCycle" }),
      setTheme: (theme: ThemePref) => dispatch({ type: "setTheme", theme }),
      deleteSession: (id: string) => dispatch({ type: "deleteSession", id }),
      restoreSession: (session: Session) => dispatch({ type: "restoreSession", session }),
      importData: (data: AppData) => dispatch({ type: "importData", data }),
    }),
    [start, pause, finish, discard, tick],
  );

  return { state, actions };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
