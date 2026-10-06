import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Modal } from "./ui";

const FeedbackContext = createContext(null);

/** Toasts + a themed confirm dialog, available everywhere through useFeedback(). */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolver = useRef(null);

  const push = useCallback((text, type = "success") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback((opts) => {
    setConfirmState(opts);
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (answer) => {
    resolver.current?.(answer);
    setConfirmState(null);
  };

  const value = {
    success: (t) => push(t, "success"),
    error: (t) => push(t, "error"),
    confirm,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === "error" ? "toast-error" : ""}`}>{t.text}</div>
        ))}
      </div>
      <Modal
        open={!!confirmState}
        title={confirmState?.title || "Are you sure?"}
        onClose={() => close(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {confirmState?.confirmText || "Confirm"}
            </Button>
          </>
        }
      >
        <p className="muted">{confirmState?.text}</p>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export const useFeedback = () => useContext(FeedbackContext);
