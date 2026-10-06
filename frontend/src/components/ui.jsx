import { useEffect, useId } from "react";

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Button({ variant = "primary", size, block, loading, children, className = "", ...rest }) {
  const cls = ["btn", `btn-${variant}`, size === "sm" && "btn-sm", block && "btn-block", className].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Field({ label, required, error, hint, className = "", children, id }) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field-label" htmlFor={id}>
          {label}
          {required && <span className="req" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

function useFieldId(id) {
  const auto = useId();
  return id || auto;
}

export function Input({ label, required, error, hint, className, id, ...rest }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={fid}>
      <input id={fid} className="input" required={required} aria-invalid={!!error} {...rest} />
    </Field>
  );
}

export function Textarea({ label, required, error, hint, className, id, ...rest }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={fid}>
      <textarea id={fid} className="textarea" required={required} aria-invalid={!!error} {...rest} />
    </Field>
  );
}

export function Select({ label, required, error, hint, className, id, options = [], placeholder, ...rest }) {
  const fid = useFieldId(id);
  return (
    <Field label={label} required={required} error={error} hint={hint} className={className} id={fid}>
      <select id={fid} className="select" required={required} aria-invalid={!!error} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox({ label, className = "", ...rest }) {
  return (
    <label className={`check ${className}`}>
      <input type="checkbox" {...rest} />
      {label}
    </label>
  );
}

export function Badge({ tone, children }) {
  return <span className={`badge ${tone ? `badge-${tone}` : ""}`}>{children}</span>;
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="subtle" size="sm" onClick={onClose} aria-label="Close">Close</Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function PageHead({ title, text, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="empty" aria-live="polite">
      <Spinner />
    </div>
  );
}
