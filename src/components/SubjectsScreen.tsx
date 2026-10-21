import { useMemo, useState } from "react";
import { Check, ChevronDown, Play } from "lucide-react";
import { useStore } from "../lib/store";
import { SUBJECTS, TOTAL_TOPICS } from "../lib/subjects";
import { statsBySubject } from "../lib/stats";
import { formatDuration } from "../lib/time";

interface Props {
  onStudy: (subjectId: string, topicId: string | null) => void;
}

export function SubjectsScreen({ onStudy }: Props) {
  const { state, actions } = useStore();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const stats = useMemo(() => statsBySubject(state.sessions), [state.sessions]);

  const totalMs = state.sessions.reduce((n, s) => n + s.durationMs, 0);
  const reviewedCount = Object.keys(state.reviewed).length;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Matérias</h1>
          <p className="page-sub">Conteúdo do vestibular do ITA. Marque os tópicos que já revisou.</p>
        </div>
      </header>

      <dl className="summary">
        <div className="summary-item">
          <dt>Tempo total</dt>
          <dd className="tnum">{formatDuration(totalMs)}</dd>
        </div>
        <div className="summary-item">
          <dt>Tópicos revisados</dt>
          <dd className="tnum">
            {reviewedCount}
            <span className="summary-of"> de {TOTAL_TOPICS}</span>
          </dd>
        </div>
        <div className="summary-item">
          <dt>Sessões</dt>
          <dd className="tnum">{state.sessions.length}</dd>
        </div>
      </dl>

      <section className="panel distribution-card" aria-labelledby="dist-title">
        <div className="panel-head">
          <div>
            <h2 id="dist-title" className="panel-title">
              Distribuição da Carga Horária
            </h2>
            <p className="panel-sub">
              Equilíbrio de estudo entre as matérias eliminatórias do vestibular do ITA.
            </p>
          </div>
          <span className="panel-figure tnum">{totalMs > 0 ? "100%" : "0%"}</span>
        </div>

        {totalMs === 0 ? (
          <p className="empty">
            Nenhuma sessão registrada. A proporção de tempo por matéria aparecerá aqui conforme você cronometrar suas sessões.
          </p>
        ) : (
          <>
            <div className="dist-bar" role="img" aria-label="Distribuição do tempo por matéria">
              {SUBJECTS.map((sub, i) => {
                const subMs = stats[sub.id]?.totalMs ?? 0;
                if (subMs === 0) return null;
                const pct = (subMs / totalMs) * 100;
                return (
                  <span
                    key={sub.id}
                    className={`dist-segment dist-segment--${i}`}
                    style={{ width: `${pct}%` }}
                    title={`${sub.name}: ${pct.toFixed(1)}% (${formatDuration(subMs)})`}
                  />
                );
              })}
            </div>
            <ul className="dist-legend">
              {SUBJECTS.map((sub, i) => {
                const subMs = stats[sub.id]?.totalMs ?? 0;
                const pct = totalMs > 0 ? Math.round((subMs / totalMs) * 100) : 0;
                return (
                  <li key={sub.id} className="dist-legend-item">
                    <span className={`dist-dot dist-segment--${i}`} aria-hidden />
                    <span className="dist-name">{sub.name}</span>
                    <span className="dist-pct tnum">{pct}%</span>
                    <span className="dist-time tnum">({formatDuration(subMs)})</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <div className="subject-grid">
        {SUBJECTS.map((sub) => {
          const st = stats[sub.id];
          const done = sub.topics.filter((tp) => state.reviewed[tp.id]).length;
          const pct = Math.round((done / sub.topics.length) * 100);
          const isOpen = !!open[sub.id];
          const listId = `topics-${sub.id}`;

          return (
            <article key={sub.id} className="panel subject-card" aria-labelledby={`title-${sub.id}`}>
              <header className="subject-head">
                <span className="monogram" aria-hidden>
                  {sub.short}
                </span>
                <div className="subject-title">
                  <h2 id={`title-${sub.id}`}>{sub.name}</h2>
                  <span className="tnum">
                    {st ? `${formatDuration(st.totalMs)} · ${st.sessions} ${st.sessions === 1 ? "sessão" : "sessões"}` : "Nenhuma sessão ainda"}
                  </span>
                </div>
                <button type="button" className="btn btn-soft" onClick={() => onStudy(sub.id, null)}>
                  <Play size={15} aria-hidden />
                  Estudar
                </button>
              </header>

              <div
                className="progress"
                role="progressbar"
                aria-label={`Progresso em ${sub.name}`}
                aria-valuemin={0}
                aria-valuemax={sub.topics.length}
                aria-valuenow={done}
              >
                <span className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="subject-meta tnum">
                <span>
                  {done} de {sub.topics.length} tópicos revisados
                </span>
                <span>{pct}%</span>
              </div>

              <button
                type="button"
                className="disclosure"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => setOpen({ ...open, [sub.id]: !isOpen })}
              >
                {isOpen ? "Ocultar tópicos" : "Ver tópicos"}
                <ChevronDown size={16} aria-hidden className="disclosure-icon" />
              </button>

              {isOpen && (
                <ul id={listId} className="topic-list">
                  {sub.topics.map((tp) => {
                    const ms = st?.byTopic[tp.id] ?? 0;
                    const checked = !!state.reviewed[tp.id];
                    return (
                      <li key={tp.id} className={`topic${checked ? " is-done" : ""}`}>
                        <label className="topic-check">
                          <input
                            type="checkbox"
                            className="sr-only-input"
                            checked={checked}
                            onChange={() => actions.toggleReviewed(tp.id)}
                          />
                          <span className="checkbox" aria-hidden>
                            <Check size={13} strokeWidth={3} />
                          </span>
                          <span className="topic-name">{tp.name}</span>
                        </label>
                        <span className="topic-time tnum">{ms > 0 ? formatDuration(ms) : "—"}</span>
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          aria-label={`Estudar ${tp.name}`}
                          title="Estudar este tópico"
                          onClick={() => onStudy(sub.id, tp.id)}
                        >
                          <Play size={14} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
