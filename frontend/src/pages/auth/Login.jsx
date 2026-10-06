import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Input } from "../../components/ui";
import { homeFor, useAuth } from "../../context/AuthContext";
import { errorMessage } from "../../utils/errors";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const me = await login(email.trim(), password);
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      setError(err.response?.status === 401
        ? "Email or password is incorrect, or this account has been deactivated."
        : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="brand"><span className="brand-mark">R</span>Resume Builder</div>
        <h1>Sign in</h1>
        <p>Use the email and password your admin gave you.</p>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert" role="alert">{error}</div>}
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" block loading={busy} disabled={!email || !password}>Sign in</Button>
        </form>
      </div>
    </div>
  );
}
