import { useEffect, useRef, useState } from "react";
import { AppShell } from "./components/AppShell";
import { CommandPalette } from "./components/CommandPalette";
import { SubjectsScreen } from "./components/SubjectsScreen";
import { TimerScreen } from "./components/TimerScreen";
import { useToast } from "./components/Toast";
import { useNow, useRoute } from "./lib/hooks";
import { chime } from "./lib/sound";
import { elapsedOf, phaseTargetMs, useStore } from "./lib/store";
import { SUBJECT_BY_ID } from "./lib/subjects";
import { formatClock, formatCountdown } from "./lib/time";

const BASE_TITLE = "Cronômetro ITA";

export function App() {
  const { state, actions } = useStore();
  const toast = useToast();
  const [route, navigate] = useRoute();
  const searchParams = new URLSearchParams(window.location.search);
  const [zenMode, setZenMode] = useState(() => searchParams.has("zen"));
  const [paletteOpen, setPaletteOpen] = useState(() => searchParams.has("palette"));

  const t = state.timer;
  const now = useNow(t.status === "running", 250);

  // Pomodoro phase changes happen here so they fire on any screen.
  useEffect(() => {
    if (t.mode === "pomodoro" && t.status === "running") actions.tick();
  }, [now, t.mode, t.status, actions]);

  // Prevent accidental tab closure while timer is running
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (t.status === "running") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [t.status]);

  // Keep screen awake while studying (Screen Wake Lock API)
  useEffect(() => {
    if (t.status !== "running" || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    navigator.wakeLock.request("screen").then((sentinel) => {
      if (!cancelled) lock = sentinel;
      else sentinel.release();
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (lock) lock.release();
    };
  }, [t.status]);

  // Chime + notice once per automatic phase change.
  const lastEventAt = useRef(t.lastEvent?.at ?? 0);
  useEffect(() => {
    const ev = t.lastEvent;
    if (!ev || ev.at === lastEventAt.current) return;
    lastEventAt.current = ev.at;
    if (state.settings.sound) chime(ev.type);
    const msg =
      ev.type === "focus-done"
        ? "Bloco de foco concluído e salvo. Hora da pausa."
        : "Pausa encerrada. Inicie o próximo bloco.";
    toast(msg);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Cronômetro ITA", {
          body: msg,
          icon: "/icon.svg",
          tag: "cronometro-ita-phase",
        });
      } catch {}
    }
  }, [t.lastEvent, state.settings.sound, toast]);

  // Tab title shows the running clock.
  useEffect(() => {
    if (t.status === "idle") {
      document.title = BASE_TITLE;
      return;
    }
    const elapsed = elapsedOf(t, now);
    const clock =
      t.mode === "pomodoro"
        ? formatCountdown(phaseTargetMs(t.phase, state.settings) - elapsed)
        : formatClock(elapsed);
    const label = t.mode === "pomodoro" && t.phase !== "foco" ? "Pausa" : SUBJECT_BY_ID[t.subjectId]?.short;
    document.title = `${t.status === "paused" ? "Pausado · " : ""}${clock} · ${label}`;
  }, [now, t, state.settings]);

  // Dynamic favicon with mini circular progress.
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) return;
    if (t.status === "idle") {
      link.href = "/icon.svg";
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const elapsed = elapsedOf(t, now);
    const target = t.mode === "pomodoro" ? phaseTargetMs(t.phase, state.settings) : 3_600_000;
    const p = Math.min(1, Math.max(0, t.mode === "pomodoro" ? elapsed / target : (elapsed % 3_600_000) / 3_600_000));

    ctx.fillStyle = "#1f6c76";
    ctx.beginPath();
    ctx.roundRect(0, 0, 32, 32, 9);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(16, 16, 10, -Math.PI / 2, -Math.PI / 2 + p * 2 * Math.PI);
    ctx.stroke();

    link.href = canvas.toDataURL("image/png");
  }, [now, t.status, t.mode, t.phase, state.settings]);

  // Global shortcut: Ctrl+K / Cmd+K / Slash to open Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const el = e.target;
        if (el instanceof HTMLElement && el.closest("input, select, textarea, [contenteditable]")) {
          return;
        }
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const study = (subjectId: string, topicId: string | null) => {
    if (t.status === "idle") {
      actions.setSubject(subjectId, topicId);
    } else {
      toast("Há uma sessão em andamento. Finalize-a para trocar de matéria.");
    }
    navigate("cronometro");
  };

  const handlePaletteSelect = (subjectId: string, topicId: string | null) => {
    study(subjectId, topicId);
  };

  return (
    <>
      <AppShell
        route={route}
        now={now}
        zenMode={zenMode}
        onOpenPalette={() => setPaletteOpen(true)}
      >
        {route === "cronometro" ? (
          <TimerScreen
            now={now}
            zenMode={zenMode}
            onToggleZen={() => setZenMode((prev) => !prev)}
          />
        ) : (
          <SubjectsScreen onStudy={study} />
        )}
      </AppShell>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
        onNavigate={(r) => navigate(r)}
      />
    </>
  );
}
