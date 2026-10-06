import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px", background: "#2c3e50", color: "white" }}>
      <strong>Resume Builder — {user.role === "admin" ? "Admin" : "Student"} panel</strong>
      <span>
        {user.username} <button onClick={handleLogout}>Logout</button>
      </span>
    </div>
  );
}
