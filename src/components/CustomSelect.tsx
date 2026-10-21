import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  ariaLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  defaultOpen?: boolean;
  defaultSearch?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Selecione...",
  ariaLabel,
  searchable = false,
  searchPlaceholder = "Buscar...",
  defaultOpen = false,
  defaultSearch = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [search, setSearch] = useState(defaultSearch);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const listboxId = useId();

  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  // Find currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filter options if searchable
  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, searchable, search]);

  // Adjust placement if space below is limited
  const updatePlacement = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setPlacement("top");
      } else {
        setPlacement("bottom");
      }
    }
  };

  useEffect(() => {
    if (defaultOpen) {
      updatePlacement();
    }
  }, [defaultOpen]);

  // When opening, reset search and highlighted index
  const openMenu = () => {
    if (disabled) return;
    updatePlacement();
    setIsOpen(true);
    setSearch("");
    const selIdx = filteredOptions.findIndex((opt) => opt.value === value);
    setHighlightedIndex(selIdx >= 0 ? selIdx : 0);
  };

  const closeMenu = (refocus = true) => {
    setIsOpen(false);
    setSearch("");
    if (refocus) {
      triggerRef.current?.focus();
    }
  };

  const selectOption = (optValue: string) => {
    onChange(optValue);
    closeMenu(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  // Focus search input when menu opens if searchable
  useEffect(() => {
    if (isOpen && searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchable]);

  // Keep highlighted index within bounds
  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
    }
  }, [filteredOptions.length, highlightedIndex]);

  // Scroll active option into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeEl = listboxRef.current.children[
        highlightedIndex
      ] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation on trigger button
  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  };

  // Keyboard navigation inside menu
  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
      return;
    }

    if (e.key === "Tab") {
      closeMenu(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredOptions[highlightedIndex];
      if (current) {
        selectOption(current.value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select ${isOpen ? "is-open" : ""} ${
        disabled ? "is-disabled" : ""
      }`}
      onKeyDown={isOpen ? handleMenuKeyDown : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className="custom-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="custom-select-value">
          {selectedOption ? (
            <>
              {selectedOption.badge && (
                <span className="custom-select-badge">
                  {selectedOption.badge}
                </span>
              )}
              <span className="custom-select-text">{selectedOption.label}</span>
            </>
          ) : (
            <span className="custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className="custom-select-chevron"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={`custom-select-menu custom-select-menu--${placement}`}
          role="presentation"
        >
          {searchable && (
            <div className="custom-select-search-wrap">
              <Search
                size={14}
                className="custom-select-search-icon"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="text"
                className="custom-select-search-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " && search.length === 0) {
                    e.stopPropagation();
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  className="custom-select-clear-btn"
                  aria-label="Limpar busca"
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          <ul
            ref={listboxRef}
            id={listboxId}
            className="custom-select-list"
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
          >
            {filteredOptions.length === 0 ? (
              <li className="custom-select-empty" role="presentation">
                Nenhum resultado encontrado
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-select-option ${
                      isSelected ? "is-selected" : ""
                    } ${isHighlighted ? "is-highlighted" : ""}`}
                    onClick={() => selectOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <span className="custom-select-option-content">
                      {opt.badge && (
                        <span className="custom-select-badge">{opt.badge}</span>
                      )}
                      <span className="custom-select-option-label">
                        {opt.label}
                      </span>
                    </span>
                    {isSelected && (
                      <Check
                        size={15}
                        className="custom-select-check"
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
