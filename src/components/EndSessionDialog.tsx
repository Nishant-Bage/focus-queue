import { useEffect, useRef } from "react";

export function EndSessionDialog({
  onEnd,
  onClose,
}: {
  onEnd: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="end-dialog"
      aria-labelledby="end-session-title"
      aria-describedby="end-session-description"
      onCancel={onClose}
    >
      <h2 id="end-session-title">End this session?</h2>
      <p id="end-session-description">
        This stops the timer. This unfinished session won’t be added to your
        history. Your tasks and previous sessions stay saved.
      </p>
      <div className="end-dialog-actions">
        <button className="quiet" autoFocus onClick={onClose}>
          Keep going
        </button>
        <button className="primary" onClick={onEnd}>
          End without saving
        </button>
      </div>
    </dialog>
  );
}
