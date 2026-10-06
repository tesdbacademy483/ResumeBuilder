import { useState } from "react";
import { errorMessage, fieldErrors } from "../utils/errors";
import { useFeedback } from "./Feedback";
import FormFields, { cleanPayload } from "./FormFields";
import useAsync from "./useAsync";
import { Button, Empty, Loading, Modal } from "./ui";

/**
 * A complete list + add/edit modal + delete, driven by a field config.
 * Used by the admin catalog (topics, projects, summaries...) and student entries
 * (experience, education, certifications).
 */
export default function CrudSection({
  api, params, extra = {}, fields, defaults = {}, noun,
  title, renderItem, renderExpanded, emptyText, onChanged, sort, bare,
}) {
  const fb = useFeedback();
  const { data, loading, reload } = useAsync(() => api.list(params), [JSON.stringify(params)]);
  const [editing, setEditing] = useState(null); // null | "new" | item
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState({});

  const startNew = () => { setForm({ ...defaults }); setErrors({}); setEditing("new"); };
  const startEdit = (item) => { setForm({ ...item }); setErrors({}); setEditing(item); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...cleanPayload(fields, form), ...extra };
      if (editing === "new") await api.create(payload);
      else await api.update(editing.id, payload);
      fb.success(editing === "new" ? `${noun} added` : `${noun} updated`);
      setEditing(null);
      await reload();
      onChanged?.();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const ok = await fb.confirm({
      title: `Delete this ${noun.toLowerCase()}?`,
      text: "This can't be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove(item.id);
      fb.success(`${noun} deleted`);
      await reload();
      onChanged?.();
    } catch (err) {
      fb.error(errorMessage(err));
    }
  };

  const items = sort ? [...(data || [])].sort(sort) : data || [];

  return (
    <section className={bare ? "" : "panel"}>
      <div className="panel-head">
        {bare ? <h3>{title}</h3> : <h2>{title}</h2>}
        <Button size="sm" onClick={startNew}>Add {noun.toLowerCase()}</Button>
      </div>

      {loading ? <Loading /> : items.length === 0 ? (
        <Empty title={`No ${noun.toLowerCase()}s yet`} text={emptyText} />
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <div key={item.id} className="item" style={{ flexDirection: "column" }}>
              <div style={{ display: "flex", width: "100%", gap: 12, justifyContent: "space-between" }}>
                <div className="item-body">{renderItem(item)}</div>
                <div className="row-actions">
                  {renderExpanded && (
                    <Button variant="subtle" size="sm" aria-expanded={!!open[item.id]}
                      onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}>
                      {open[item.id] ? "Hide contents" : "Show contents"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(item)}>Delete</Button>
                </div>
              </div>
              {renderExpanded && open[item.id] && <div className="item-nested" style={{ width: "100%" }}>{renderExpanded(item)}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === "new" ? `Add ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing === "new" ? `Add ${noun.toLowerCase()}` : "Save changes"}</Button>
          </>
        }
      >
        <FormFields fields={fields} values={form} errors={errors} onChange={setForm} />
      </Modal>
    </section>
  );
}
