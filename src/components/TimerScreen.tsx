import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { CustomSelect, type SelectOption } from "./CustomSelect";
import { Dialog } from "./Dialog";
import { TimerRing } from "./TimerRing";
import { useToast } from "./Toast";
import { primeAudio } from "../lib/sound";
import {
  elapsedOf,
  exportDataJson,
  phaseTargetMs,
  useStore,
  type AppData,
  type Settings,
} from "../lib/store";
import { SUBJECTS, SUBJECT_BY_ID, TOPIC_BY_ID } from "../lib/subjects";
import { lastSevenDays, liveFocusMs, sessionsOfDay } from "../lib/stats";
import {
  formatClock,
  formatCountdown,
  formatDuration,
  formatTime,
  startOfDay,
  weekdayLetter,
  weekdayName,
} from "../lib/time";

const HOUR = 3_600_000;

function isTypingTarget(el: EventTarget | null): boolean {
  return el instanceof HTMLElement && !!el.closest("input, select, textarea, button, a, [contenteditable], .custom-select");
}

interface Props {
  now: number;
  zenMode: boolean;
  onToggleZen: () => void;
}

export function TimerScreen({ now, zenMode, onToggleZen }: Props) {
  const { state, actions } = useStore();
  const toast = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const openParam = searchParams.get("open");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(() => openParam === "settings");

  const t = state.timer;
  const s = state.settings;
  const subject = SUBJECT_BY_ID[t.subjectId];
  const subjectOptions: SelectOption[] = useMemo(
    () => SUBJECTS.map((sub) => ({ value: sub.id, label: sub.name, badge: sub.short })),
    []
  );
  const topicOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Geral, sem tópico" },
      ...subject.topics.map((top) => ({ value: top.id, label: top.name })),
    ],
    [subject.topics]
  );
  const isPomodoro = t.mode === "pomodoro";
  const onBreak = isPomodoro && t.phase !== "foco";
  const idle = t.status === "idle";
  const elapsed = elapsedOf(t, now);
  const target = isPomodoro ? phaseTargetMs(t.phase, s) : HOUR;
  const progress = isPomodoro ? elapsed / target : idle ? 0 : (elapsed % HOUR) / HOUR;
  const display = isPomodoro ? formatCountdown(target - elapsed) : formatClock(elapsed);
  const blockInSet = (t.cycle % s.longBreakEvery) + 1;

  let phaseLabel: string;
  if (onBreak) phaseLabel = t.phase === "pausa-longa" ? "Pausa longa" : "Pausa curta";
  else if (isPomodoro) phaseLabel = `Foco · bloco ${blockInSet} de ${s.longBreakEvery}`;
  else phaseLabel = idle ? "Cronômetro livre" : "Estudando";
  if (t.status === "paused") phaseLabel += " · pausado";

  const tone = onBreak ? "break" : t.status === "running" ? "running" : t.status === "paused" ? "paused" : "idle";

  const toggle = () => {
    primeAudio();
    if (t.status === "running") actions.pause();
    else actions.start();
  };

  const finish = () => {
    if (idle) return;
    if (onBreak) {
      actions.finish();
      toast("Pausa encerrada. Inicie o próximo bloco quando quiser.");
      return;
    }
    const saved = actions.finish();
    if (saved) {
      toast(`Sessão salva: ${formatDuration(saved.durationMs)} de ${subject.name}`, {
        label: "Desfazer",
        onAction: () => actions.deleteSession(saved.id),
      });
    } else {
      toast("Sessão com menos de 10 segundos, não foi salva.");
    }
  };

  const discard = () => {
    if (elapsed > 60_000 && !onBreak) setConfirmDiscard(true);
    else actions.discard();
  };

  // Keyboard: Space starts/pauses, Enter finishes, F toggles Zen mode, P toggles mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Enter" && !idle) {
        e.preventDefault();
        finish();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        onToggleZen();
      } else if (e.key === "Escape" && zenMode) {
        e.preventDefault();
        onToggleZen();
      } else if ((e.key === "p" || e.key === "P") && idle) {
        e.preventDefault();
        actions.setMode(t.mode === "livre" ? "pomodoro" : "livre");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className={`page${zenMode ? " page--zen" : ""}`}>
      {!zenMode && (
        <header className="page-head">
          <div>
            <h1 className="page-title">Cronômetro</h1>
            <p className="page-sub">Escolha a matéria, inicie e finalize para registrar a sessão.</p>
          </div>
        </header>
      )}

      <div className={`timer-layout${zenMode ? " timer-layout--zen" : ""}`}>
        <section className={`panel timer-card${zenMode ? " timer-card--zen" : ""}`} aria-label="Cronômetro">
          <div className="timer-toolbar">
            <div className="segmented" role="group" aria-label="Modo do cronômetro">
              {(["livre", "pomodoro"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="segmented-item"
                  aria-pressed={t.mode === m}
                  disabled={!idle && t.mode !== m}
                  onClick={() => actions.setMode(m)}
                >
                  {m === "livre" ? "Livre" : "Pomodoro"}
                </button>
              ))}
            </div>
            <div className="timer-toolbar-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label={zenMode ? "Sair do modo foco zen (Esc ou F)" : "Modo foco zen (F)"}
                title={zenMode ? "Sair do modo foco zen (Esc ou F)" : "Modo foco zen (F)"}
                onClick={onToggleZen}
              >
                {zenMode ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Ajustes"
                title="Ajustes"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings2 size={18} aria-hidden />
              </button>
            </div>
          </div>

          <TimerRing progress={progress} tone={tone}>
            <span className="phase-label">{phaseLabel}</span>
            <span className="clock" aria-live="off">
              {display}
            </span>
            <span className="clock-sub">
              {onBreak ? "Levante, beba água" : subject.name}
              {!onBreak && t.topicId && TOPIC_BY_ID[t.topicId] ? ` · ${TOPIC_BY_ID[t.topicId].name}` : ""}
            </span>
          </TimerRing>

          <div className="controls">
            <button
              type="button"
              className="icon-btn icon-btn--lg"
              aria-label="Descartar sessão"
              title="Descartar"
              disabled={idle}
              onClick={discard}
            >
              <RotateCcw size={20} aria-hidden />
            </button>
            <button type="button" className="btn btn-primary btn-xl" onClick={toggle}>
              {t.status === "running" ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
              {t.status === "running" ? "Pausar" : t.status === "paused" ? "Continuar" : "Iniciar"}
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--lg"
              aria-label={onBreak ? "Pular pausa" : "Finalizar e salvar"}
              title={onBreak ? "Pular pausa" : "Finalizar e salvar"}
              disabled={idle}
              onClick={finish}
            >
              {onBreak ? <SkipForward size={20} aria-hidden /> : <Square size={18} aria-hidden />}
            </button>
          </div>

          <div className="fields">
            <div className="field">
              <span className="field-label">Matéria</span>
              <CustomSelect
                value={t.subjectId}
                disabled={!idle}
                onChange={(val) => actions.setSubject(val, null)}
                options={subjectOptions}
                ariaLabel="Matéria de estudo"
                defaultOpen={openParam === "materia"}
              />
            </div>
            <div className="field">
              <span className="field-label">Tópico</span>
              <CustomSelect
                value={t.topicId ?? ""}
                disabled={!idle}
                onChange={(val) => actions.setSubject(t.subjectId, val || null)}
                options={topicOptions}
                placeholder="Geral, sem tópico"
                searchable={subject.topics.length > 5}
                searchPlaceholder="Filtrar tópicos..."
                ariaLabel="Tópico da matéria"
                defaultOpen={openParam === "topico"}
                defaultSearch={openParam === "topico" ? searchParams.get("q") ?? "" : ""}
              />
            </div>
          </div>
          {!idle && <p className="hint">Para trocar de matéria, finalize ou descarte a sessão atual.</p>}
          <p className="hint hint--keys">
            <kbd>Espaço</kbd> inicia ou pausa · <kbd>Enter</kbd> finaliza · <kbd>F</kbd> modo zen · <kbd>P</kbd> livre/pomodoro
          </p>
        </section>

        {!zenMode && (
          <aside className="side-col">
            <TodayPanel now={now} />
            <WeekPanel now={now} />
          </aside>
        )}
      </div>

      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Descartar esta sessão?"
        description={`${formatDuration(elapsed)} de ${subject.name} não serão registrados.`}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setConfirmDiscard(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                actions.discard();
                setConfirmDiscard(false);
              }}
            >
              Descartar
            </button>
          </>
        }
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function TodayPanel({ now }: { now: number }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const today = startOfDay(now);
  const list = useMemo(() => sessionsOfDay(state.sessions, today).reverse(), [state.sessions, today]);
  const total = list.reduce((n, s) => n + s.durationMs, 0) + liveFocusMs(state.timer, now);
  const goalHours = state.settings.dailyGoalHours || 6;
  const goalMs = goalHours * 3600_000;
  const goalPct = Math.min(100, Math.round((total / goalMs) * 100));

  return (
    <section className="panel" aria-labelledby="today-title">
      <div className="panel-head">
        <div>
          <h2 id="today-title" className="panel-title">
            Hoje
          </h2>
          <span className="panel-sub tnum">{goalPct}% da meta ({goalHours}h)</span>
        </div>
        <span className="panel-figure tnum">{formatDuration(total)}</span>
      </div>
      <div className="today-goal-track" title={`Meta diária: ${goalHours}h (${goalPct}%)`}>
        <div className="today-goal-fill" style={{ width: `${goalPct}%` }} />
      </div>
      {list.length === 0 ? (
        <p className="empty">Nenhuma sessão registrada hoje. As sessões aparecem aqui quando você finaliza o cronômetro.</p>
      ) : (
        <ul className="session-list">
          {list.map((s) => {
            const sub = SUBJECT_BY_ID[s.subjectId];
            const topic = s.topicId ? TOPIC_BY_ID[s.topicId] : null;
            return (
              <li key={s.id} className="session">
                <span className="monogram monogram--sm" aria-hidden>
                  {sub?.short ?? "—"}
                </span>
                <div className="session-main">
                  <span className="session-name">{sub?.name ?? "Matéria removida"}</span>
                  <span className="session-meta tnum">
                    {formatTime(s.startedAt)}–{formatTime(s.endedAt)}
                    {topic ? ` · ${topic.name}` : ""}
                  </span>
                </div>
                <span className="session-dur tnum">{formatDuration(s.durationMs)}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn--sm session-del"
                  aria-label={`Remover sessão de ${sub?.name ?? "matéria"} das ${formatTime(s.startedAt)}`}
                  onClick={() => {
                    actions.deleteSession(s.id);
                    toast("Sessão removida.", { label: "Desfazer", onAction: () => actions.restoreSession(s) });
                  }}
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function WeekPanel({ now }: { now: number }) {
  const { state } = useStore();
  const days = lastSevenDays(state.sessions, state.timer, now);
  const max = Math.max(...days.map((d) => d.ms), 30 * 60_000);
  const total = days.reduce((n, d) => n + d.ms, 0);

  return (
    <section className="panel" aria-labelledby="week-title">
      <div className="panel-head">
        <h2 id="week-title" className="panel-title">
          Últimos 7 dias
        </h2>
        <span className="panel-figure tnum">{formatDuration(total)}</span>
      </div>
      <ol className="week">
        {days.map((d, i) => (
          <li key={d.day} className={`week-day${i === 6 ? " is-today" : ""}`}>
            <span className="week-bar-track">
              <span className="week-bar" style={{ height: `${(d.ms / max) * 100}%` }} />
            </span>
            <span className="week-label" aria-hidden>
              {weekdayLetter(d.day)}
            </span>
            <span className="sr-only">
              {i === 6 ? "Hoje" : weekdayName(d.day)}: {formatDuration(d.ms)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Settings>(state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    if (open) {
      setDraft(state.settings);
      if (typeof Notification !== "undefined") {
        setNotifPermission(Notification.permission);
      }
    }
  }, [open, state.settings]);

  const requestNotif = async () => {
    if (typeof Notification === "undefined") {
      toast("Notificações não são suportadas neste navegador.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast("Notificações no sistema ativadas!");
      try {
        new Notification("CronITA", {
          body: "Notificações ativadas para término de blocos de foco e pausas.",
          icon: "/icon.svg",
        });
      } catch {}
    } else {
      toast("Permissão de notificação não concedida.");
    }
  };

  const num = (key: keyof Settings, label: string, min: number, max: number, unit: string) => (
    <label className="field field--row">
      <span className="field-label">{label}</span>
      <span className="number">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft[key] as number}
          onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
        />
        <span className="number-unit">{unit}</span>
      </span>
    </label>
  );

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min));

  const save = () => {
    actions.updateSettings({
      focusMin: clamp(draft.focusMin, 1, 180),
      shortBreakMin: clamp(draft.shortBreakMin, 1, 60),
      longBreakMin: clamp(draft.longBreakMin, 1, 90),
      longBreakEvery: clamp(draft.longBreakEvery, 1, 12),
      dailyGoalHours: clamp(draft.dailyGoalHours, 1, 16),
      sound: draft.sound,
    });
    onClose();
  };

  const handleExport = () => {
    const json = exportDataJson(state);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const todayStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cronita-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup exportado com sucesso.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text) as AppData;
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.sessions)) {
          throw new Error("Formato inválido");
        }
        actions.importData(parsed);
        toast(`Backup importado: ${parsed.sessions.length} sessões carregadas.`);
        onClose();
      } catch {
        toast("Erro ao ler arquivo de backup. Verifique se o JSON é válido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ajustes do Aplicativo"
      actions={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            Salvar
          </button>
        </>
      }
    >
      <div className="settings">
        {num("dailyGoalHours", "Meta diária de estudo", 1, 16, "horas")}
        {num("focusMin", "Bloco de foco Pomodoro", 1, 180, "min")}
        {num("shortBreakMin", "Pausa curta", 1, 60, "min")}
        {num("longBreakMin", "Pausa longa", 1, 90, "min")}
        {num("longBreakEvery", "Pausa longa a cada", 1, 12, "blocos")}
        <label className="field field--row">
          <span className="field-label">Som ao trocar de fase</span>
          <input
            type="checkbox"
            className="switch"
            checked={draft.sound}
            onChange={(e) => setDraft({ ...draft, sound: e.target.checked })}
          />
        </label>
        <div className="field field--row">
          <div>
            <span className="field-label">Notificações no sistema</span>
            <p className="field-hint">Alerta sobre o fim do bloco mesmo em outra aba</p>
          </div>
          {notifPermission === "granted" ? (
            <span className="status-badge">Ativadas</span>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-soft"
              onClick={requestNotif}
            >
              Ativar
            </button>
          )}
        </div>
        <div className="field field--row">
          <span className="field-label">
            Blocos concluídos: <span className="tnum">{state.timer.cycle}</span>
          </span>
          <button type="button" className="btn btn-quiet" onClick={actions.resetCycle}>
            Zerar contagem
          </button>
        </div>

        <div className="settings-section">
          <span className="field-label">Dados e Backup</span>
          <div className="settings-backup-actions">
            <button type="button" className="btn btn-soft" onClick={handleExport}>
              <Download size={15} aria-hidden />
              Exportar backup (JSON)
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} aria-hidden />
              Importar backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only-input"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
