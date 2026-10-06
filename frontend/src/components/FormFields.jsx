import { Checkbox, Input, Select, Textarea } from "./ui";

/**
 * Renders inputs from a config list:
 * { name, label, type: text|email|url|number|date|textarea|select|checkbox|tags, required, options, full, hint, disabledWhen }
 */
export default function FormFields({ fields, values, errors = {}, onChange }) {
  const set = (name, value) => onChange({ ...values, [name]: value });
  return (
    <div className="form-grid">
      {fields.map((f) => {
        const common = {
          label: f.label,
          required: f.required,
          error: errors[f.name],
          hint: f.hint,
          className: f.full || ["textarea", "checkbox"].includes(f.type) ? "full" : "",
          disabled: f.disabledWhen?.(values),
        };
        const val = values[f.name] ?? "";
        if (f.type === "textarea")
          return <Textarea key={f.name} {...common} rows={f.rows || 4} value={val} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />;
        if (f.type === "select")
          return <Select key={f.name} {...common} options={f.options} placeholder={f.placeholder} value={val} onChange={(e) => set(f.name, e.target.value)} />;
        if (f.type === "checkbox")
          return (
            <div key={f.name} className="full">
              <Checkbox label={f.label} checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
            </div>
          );
        if (f.type === "tags")
          return (
            <Input key={f.name} {...common} value={Array.isArray(val) ? val.join(", ") : val} placeholder={f.placeholder}
              hint={f.hint || "Separate with commas"}
              onChange={(e) => set(f.name, e.target.value.split(",").map((s) => s.trimStart()))} />
          );
        return (
          <Input key={f.name} {...common} type={f.type || "text"} value={val} placeholder={f.placeholder}
            onChange={(e) => set(f.name, f.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} />
        );
      })}
    </div>
  );
}

/** Clean form values before sending: trim tags, turn "" into null for dates/numbers. */
export function cleanPayload(fields, values) {
  const out = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.type === "tags") v = (Array.isArray(v) ? v : []).map((s) => s.trim()).filter(Boolean);
    else if (["date", "number"].includes(f.type) && (v === "" || v === undefined)) v = null;
    else if (f.type === "checkbox") v = !!v;
    else if (v === undefined || v === null) v = f.type === "select" && f.nullable ? null : "";
    if (f.type === "select" && f.nullable && v === "") v = null;
    out[f.name] = v;
  }
  return out;
}
