import { useEffect } from 'react';
import './FriendlyModal.css';

/**
 * Generic in-app modal to replace native alert/confirm dialogs.
 */
export default function FriendlyModal({
  open,
  title = 'Notice',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="friendly-modal" role="dialog" aria-modal="true" aria-labelledby="friendly-modal-title">
      <button type="button" className="friendly-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="friendly-modal__panel">
        <h2 id="friendly-modal-title" className="friendly-modal__title">{title}</h2>
        <p className="friendly-modal__message">{message}</p>
        <div className="friendly-modal__actions">
          {showCancel && (
            <button
              type="button"
              className="friendly-modal__btn friendly-modal__btn--secondary"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className="friendly-modal__btn friendly-modal__btn--primary"
            onClick={onConfirm || onClose}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
