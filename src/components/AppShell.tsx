import type { ReactNode } from "react";
import { BookOpen, Moon, Search, Sun, Timer } from "lucide-react";
import { useMediaQuery, type Route } from "../lib/hooks";
import { elapsedOf, phaseTargetMs, useStore } from "../lib/store";
import { liveFocusMs, sumBetween } from "../lib/stats";
import { addDays, formatClock, formatCountdown, formatDuration, startOfDay } from "../lib/time";

interface Props {
  route: Route;
  now: number;
  zenMode?: boolean;
  onOpenPalette?: () => void;
  children: ReactNode;
}

const NAV: { route: Route; label: string; icon: typeof Timer }[] = [
  { route: "cronometro", label: "Cronômetro", icon: Timer },
  { route: "materias", label: "Matérias", icon: BookOpen },
];

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" />
      <circle cx="16" cy="16" r="9" />
      <path d="M16 7a9 9 0 0 1 9 9" />
    </svg>
  );
}

export function AppShell({ route, now, zenMode, onOpenPalette, children }: Props) {
  const { state, actions } = useStore();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const searchParams = new URLSearchParams(window.location.search);
  const themeParam = searchParams.get("theme");
  const effective =
    themeParam === "dark" || themeParam === "light"
      ? themeParam
      : state.theme === "system"
        ? prefersDark
          ? "dark"
          : "light"
        : state.theme;

  const t = state.timer;
  const today = startOfDay(now);
  const todayMs = sumBetween(state.sessions, today, addDays(today, 1)) + liveFocusMs(t, now);
  const goalMs = (state.settings.dailyGoalHours || 6) * 3600_000;
  const goalPct = Math.min(100, Math.round((todayMs / goalMs) * 100));

  // Live clock next to "Cronômetro" when the user is on another screen.
  const elapsed = elapsedOf(t, now);
  const live =
    t.status === "idle"
      ? null
      : t.mode === "pomodoro"
        ? formatCountdown(phaseTargetMs(t.phase, state.settings) - elapsed)
        : formatClock(elapsed);

  const themeButton = (
    <button
      type="button"
      className="icon-btn"
      aria-label={effective === "dark" ? "Usar tema claro" : "Usar tema escuro"}
      title={effective === "dark" ? "Tema claro" : "Tema escuro"}
      onClick={() => actions.setTheme(effective === "dark" ? "light" : "dark")}
    >
      {effective === "dark" ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );

  const navItems = (variant: "side" | "tab") =>
    NAV.map(({ route: r, label, icon: Icon }) => (
      <a
        key={r}
        href={`#/${r}`}
        className={variant === "side" ? "nav-item" : "tab-item"}
        aria-current={route === r ? "page" : undefined}
      >
        <Icon size={variant === "side" ? 18 : 20} aria-hidden />
        <span>{label}</span>
        {r === "cronometro" && live && (
          <span className={`nav-live tnum${t.status === "paused" ? " is-paused" : ""}`}>{live}</span>
        )}
      </a>
    ));

  return (
    <div className={`shell${zenMode ? " shell--zen" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div className="brand-text">
            <strong>Cronômetro</strong>
            <span>Vestibular ITA</span>
          </div>
        </div>

        <button
          type="button"
          className="nav-search-btn"
          onClick={onOpenPalette}
          title="Buscar matérias e tópicos (Ctrl+K)"
        >
          <Search size={15} aria-hidden />
          <span>Buscar tópicos...</span>
          <kbd className="nav-search-kbd">Ctrl K</kbd>
        </button>

        <nav className="nav" aria-label="Principal">
          {navItems("side")}
        </nav>

        <div className="sidebar-foot">
          <div className="today">
            <span className="today-label">
              Estudado hoje · <span className="tnum">{goalPct}%</span>
            </span>
            <span className="today-value tnum">{formatDuration(todayMs)}</span>
            <div className="today-goal-track" title={`Meta diária: ${state.settings.dailyGoalHours}h`}>
              <div className="today-goal-fill" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
          {themeButton}
        </div>
      </aside>

      <header className="mobile-bar">
        <div className="brand">
          <BrandMark />
          <div className="brand-text">
            <strong>Cronômetro</strong>
            <span className="tnum">Hoje: {formatDuration(todayMs)}</span>
          </div>
        </div>
        <div className="mobile-bar-actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Buscar matérias ou tópicos"
            title="Buscar tópicos"
            onClick={onOpenPalette}
          >
            <Search size={18} aria-hidden />
          </button>
          {themeButton}
        </div>
      </header>

      <main className="content">{children}</main>

      <nav className="tabbar" aria-label="Principal">
        {navItems("tab")}
      </nav>
    </div>
  );
}
