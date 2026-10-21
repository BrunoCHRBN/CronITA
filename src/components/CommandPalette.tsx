import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, Search, Timer, X } from "lucide-react";
import { SUBJECTS, type Subject, type Topic } from "../lib/subjects";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (subjectId: string, topicId: string | null) => void;
  onNavigate: (route: "cronometro" | "materias") => void;
}

interface PaletteItem {
  id: string;
  type: "subject" | "topic" | "nav";
  title: string;
  subtitle?: string;
  subjectShort?: string;
  subjectId?: string;
  topicId?: string | null;
  route?: "cronometro" | "materias";
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CommandPalette({ open, onClose, onSelect, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const titleId = useId();

  // Reset query and selected on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      dialogRef.current?.showModal();
      inputRef.current?.focus();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  // Index of searchable items
  const allItems = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [
      { id: "nav-timer", type: "nav", title: "Ir para o Cronômetro", route: "cronometro" },
      { id: "nav-subjects", type: "nav", title: "Ir para Matérias do ITA", route: "materias" },
    ];

    SUBJECTS.forEach((sub: Subject) => {
      list.push({
        id: `sub-${sub.id}`,
        type: "subject",
        title: sub.name,
        subtitle: `Matéria · ${sub.topics.length} tópicos do edital`,
        subjectShort: sub.short,
        subjectId: sub.id,
        topicId: null,
      });

      sub.topics.forEach((top: Topic) => {
        list.push({
          id: `top-${top.id}`,
          type: "topic",
          title: top.name,
          subtitle: sub.name,
          subjectShort: sub.short,
          subjectId: sub.id,
          topicId: top.id,
        });
      });
    });

    return list;
  }, []);

  const filteredItems = useMemo<PaletteItem[]>(() => {
    const q = normalize(query.trim());
    if (!q) {
      return allItems.slice(0, 8); // Top default actions and subjects
    }
    return allItems
      .filter((item) => {
        const titleMatch = normalize(item.title).includes(q);
        const subMatch = item.subtitle ? normalize(item.subtitle).includes(q) : false;
        return titleMatch || subMatch;
      })
      .slice(0, 15);
  }, [allItems, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIdx] as HTMLElement | undefined;
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  const selectItem = (item: PaletteItem) => {
    if (item.type === "nav" && item.route) {
      onNavigate(item.route);
    } else if (item.subjectId) {
      onSelect(item.subjectId, item.topicId ?? null);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIdx]) {
        selectItem(filteredItems[selectedIdx]);
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="palette-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="palette-card">
        <h2 id={titleId} className="sr-only">
          Busca rápida de matérias e comandos
        </h2>
        <div className="palette-header">
          <Search size={18} className="palette-search-icon" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Buscar matéria ou tópico do ITA (ex: Termodinâmica, Cônicas)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls="palette-results"
          />
          {query && (
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              aria-label="Limpar busca"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={15} aria-hidden />
            </button>
          )}
          <kbd className="palette-esc-hint">Esc</kbd>
        </div>

        <ul ref={listRef} id="palette-results" className="palette-list" role="listbox">
          {filteredItems.length === 0 ? (
            <li className="palette-empty" role="presentation">
              Nenhum tópico ou matéria encontrado para &ldquo;{query}&rdquo;
            </li>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <li
                  key={item.id}
                  id={`palette-item-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`palette-item${isSelected ? " is-selected" : ""}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  {item.subjectShort ? (
                    <span className="monogram monogram--sm" aria-hidden>
                      {item.subjectShort}
                    </span>
                  ) : item.route === "cronometro" ? (
                    <span className="palette-icon-wrap" aria-hidden>
                      <Timer size={16} />
                    </span>
                  ) : (
                    <span className="palette-icon-wrap" aria-hidden>
                      <BookOpen size={16} />
                    </span>
                  )}
                  <div className="palette-item-text">
                    <span className="palette-item-title">{item.title}</span>
                    {item.subtitle && <span className="palette-item-sub">{item.subtitle}</span>}
                  </div>
                  <span className="palette-item-action">
                    {item.type === "nav" ? "Ir" : "Estudar"}
                    <kbd>↵</kbd>
                  </span>
                </li>
              );
            })
          )}
        </ul>

        <footer className="palette-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navegar
          </span>
          <span>
            <kbd>↵</kbd> selecionar
          </span>
          <span>
            <kbd>Esc</kbd> fechar
          </span>
        </footer>
      </div>
    </dialog>
  );
}
