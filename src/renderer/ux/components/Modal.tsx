import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-card__header">
          <h2>{title}</h2>
          <button className="button button--ghost" onClick={onClose} type="button">
            {'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}
          </button>
        </header>
        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  );
}
