import { NavLink, Outlet } from "react-router-dom";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">R</span>Resume Builder</div>
        <nav className="nav" aria-label="Admin">
          <NavLink to="/admin" end>Overview</NavLink>
          <NavLink to="/admin/students">Students</NavLink>
          <NavLink to="/admin/courses">Courses</NavLink>
        </nav>
        <div className="sidebar-foot">
          <span className="sidebar-user">Admin: {user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
