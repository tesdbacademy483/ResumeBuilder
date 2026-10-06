import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import useAsync from "../../components/useAsync";
import { Badge, Button, Empty, Input, Loading, Modal, PageHead, Select } from "../../components/ui";
import { errorMessage, fieldErrors } from "../../utils/errors";
import { timeAgo } from "../../utils/format";

const STATUS = {
  waiting_first_login: { label: "Waiting for first login", tone: "warn" },
  header_pending: { label: "Header pending", tone: undefined },
  building_resume: { label: "Building resume", tone: "green" },
};

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

function CredentialCard({ email, password }) {
  const fb = useFeedback();
  const copy = async () => {
    await navigator.clipboard.writeText(`Login: ${window.location.origin}/login\nEmail: ${email}\nTemporary password: ${password}`);
    fb.success("Credentials copied");
  };
  return (
    <>
      <p className="muted">Share these with the student. The password is shown only once, and they'll set their own when they first sign in.</p>
      <dl className="credential">
        <dt>Email</dt><dd>{email}</dd>
        <dt>Password</dt><dd>{password}</dd>
      </dl>
      <Button variant="ghost" onClick={copy}>Copy credentials</Button>
    </>
  );
}

export default function Students() {
  const fb = useFeedback();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState({});
  const { data, loading, reload } = useAsync(() => adminApi.students.list(query), [JSON.stringify(query)]);

  const [createOpen, setCreateOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState({ email: "", temp_password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // {email, password}

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQuery({ ...(search && { search }), ...(status && { status }) }), 300);
    return () => clearTimeout(t);
  }, [search, status]);

  const closeCreate = () => {
    setCreateOpen(false);
    setCreated(null);
    setForm({ email: "", temp_password: "" });
    setErrors({});
    if (params.get("new")) setParams({});
  };

  const create = async () => {
    setBusy(true);
    setErrors({});
    try {
      const res = await adminApi.students.create({ email: form.email.trim(), ...(form.temp_password && { temp_password: form.temp_password }) });
      setCreated({ email: res.email, password: res.temp_password });
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      fb.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (s) => {
    const ok = await fb.confirm({
      title: "Reset this student's password?",
      text: `${s.email} will get a new temporary password and must change it at their next sign-in.`,
      confirmText: "Reset password",
    });
    if (!ok) return;
    try {
      const res = await adminApi.students.resetPassword(s.id);
      setCreated({ email: s.email, password: res.temp_password, reset: true });
      setCreateOpen(true);
    } catch (err) {
      fb.error(errorMessage(err));
    }
  };

  const toggleActive = async (s) => {
    if (s.is_active) {
      const ok = await fb.confirm({
        title: "Deactivate this student?",
        text: `${s.email} won't be able to sign in until you activate the account again. Their resume is kept.`,
        confirmText: "Deactivate",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await adminApi.students.update(s.id, { is_active: !s.is_active });
      fb.success(s.is_active ? "Student deactivated" : "Student activated");
      reload();
    } catch (err) {
      fb.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHead title="Students" text="Create logins, track progress, and view each student's resume."
        actions={<Button onClick={() => setCreateOpen(true)}>Create student login</Button>} />

      <div className="toolbar">
        <input className="input" type="search" placeholder="Search by name or email" aria-label="Search students"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <section className="panel">
        {loading ? <Loading /> : !data?.length ? (
          <Empty title={query.search || query.status ? "No students match" : "No students yet"}
            text={query.search || query.status ? "Try a different search or status." : "Create a login and share it with your first student."} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Status</th><th>Last sign-in</th><th>Account</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <td><div>{s.student_name || "Name not added yet"}</div><div className="muted small">{s.email}</div></td>
                    <td><StatusBadge status={s.onboarding_status} /></td>
                    <td className="muted">{timeAgo(s.last_login)}</td>
                    <td>{s.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-ghost btn-sm" to={`/admin/students/${s.id}/resume`}>View resume</Link>
                        <Button variant="subtle" size="sm" onClick={() => resetPassword(s)}>Reset password</Button>
                        <Button variant={s.is_active ? "danger" : "ghost"} size="sm" onClick={() => toggleActive(s)}>
                          {s.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={createOpen} onClose={closeCreate}
        title={created ? (created.reset ? "New temporary password" : "Student login created") : "Create student login"}
        footer={created ? <Button onClick={closeCreate}>Done</Button> : (
          <>
            <Button variant="ghost" onClick={closeCreate}>Cancel</Button>
            <Button onClick={create} loading={busy} disabled={!form.email}>Create login</Button>
          </>
        )}>
        {created ? <CredentialCard email={created.email} password={created.password} /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="muted">The student fills in their own name and resume after signing in. You only set up their login.</p>
            <Input label="Student's email" type="email" required value={form.email} error={errors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Temporary password" type="text" value={form.temp_password} error={errors.temp_password}
              hint="Leave empty and a secure one is generated for you."
              onChange={(e) => setForm({ ...form, temp_password: e.target.value })} />
          </div>
        )}
      </Modal>
    </>
  );
}
