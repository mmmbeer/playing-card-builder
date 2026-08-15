"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  children: ReactNode;
  className?: string;
  closeDisabled?: boolean;
  closeOnBackdrop?: boolean;
  description?: ReactNode;
  footer?: ReactNode;
  headerIcon?: ReactNode;
  kicker?: string;
  onClose: () => void;
  role?: "dialog" | "alertdialog";
  title: ReactNode;
};

export default function Modal({
  children,
  className = "",
  closeDisabled = false,
  closeOnBackdrop = true,
  description,
  footer,
  headerIcon,
  kicker,
  onClose,
  role = "dialog",
  title,
}: Props) {
  const titleId = useId();
  const modalRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    closeRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [closeDisabled, onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabledRef.current) {
        event.preventDefault();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && closeOnBackdrop && !closeDisabled) onClose();
      }}
    >
      <section
        ref={modalRef}
        className={`builder-modal ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header>
          <div className={headerIcon ? "modal-title-row" : undefined}>
            {headerIcon}
            <div>
              {kicker && <span className="panel-kicker">{kicker}</span>}
              <h2 id={titleId}>{title}</h2>
              {description && <p>{description}</p>}
            </div>
          </div>
          <button className="icon-control" onClick={onClose} disabled={closeDisabled} aria-label="Close">
            <X />
          </button>
        </header>
        {children}
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}
