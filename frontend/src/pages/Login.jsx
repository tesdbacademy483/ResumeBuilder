import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const me = await login(username, password);
      navigate(me.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
