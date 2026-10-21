import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: ReactNode;
}

/** Native <dialog>: focus trap, Esc to close and inert background for free. */
export function Dialog({ open, onClose, title, description, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-body">
        <div className="dialog-head">
          <h2 id={titleId} className="dialog-title">
            {title}
          </h2>
          <button
            type="button"
            className="icon-btn icon-btn--sm dialog-close-btn"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {description && (
          <p id={descId} className="dialog-desc">
            {description}
          </p>
        )}
        {children}
        <div className="dialog-actions">{actions}</div>
      </div>
    </dialog>
  );
}
