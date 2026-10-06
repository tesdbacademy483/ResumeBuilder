import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/endpoints";
import { useFeedback } from "../../components/Feedback";
import { Button, Input } from "../../components/ui";
import { homeFor, useAuth } from "../../context/AuthContext";
import { errorMessage, fieldErrors } from "../../utils/errors";

export default function ChangePassword() {
  const { user, refreshMe, logout } = useAuth();
  const fb = useFeedback();
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const firstTime = user?.must_change_password;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError("");
    if (form.new_password !== form.confirm_password) {
      setErrors({ confirm_password: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword(form);
      fb.success("Password changed");
      const me = await refreshMe();
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).some((k) => k in form)) setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="brand"><span className="brand-mark">R</span>Resume Builder</div>
        <h1>{firstTime ? "Set your own password" : "Change password"}</h1>
        <p>{firstTime
          ? "You're signed in with a temporary password. Choose a new one to continue."
          : "Enter your current password, then choose a new one."}</p>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert" role="alert">{error}</div>}
          <Input label={firstTime ? "Temporary password" : "Current password"} type="password"
            autoComplete="current-password" required value={form.old_password} onChange={set("old_password")} error={errors.old_password} />
          <Input label="New password" type="password" autoComplete="new-password" required
            value={form.new_password} onChange={set("new_password")} error={errors.new_password}
            hint="At least 8 characters. Avoid common words and all-number passwords." />
          <Input label="Confirm new password" type="password" autoComplete="new-password" required
            value={form.confirm_password} onChange={set("confirm_password")} error={errors.confirm_password} />
          <Button type="submit" block loading={busy}>Save password</Button>
          <Button type="button" variant="subtle" onClick={logout}>Sign out</Button>
        </form>
      </div>
    </div>
  );
}
