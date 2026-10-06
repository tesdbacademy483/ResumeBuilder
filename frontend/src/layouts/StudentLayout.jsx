import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { studentApi } from "../api/endpoints";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

// Resume sections in order. `key` matches the `completion` object from /api/student/resume/.
export const STEPS = [
  { path: "header", label: "Header", key: "header" },
  { path: "summary", label: "Summary", key: "summary" },
  { path: "skills", label: "Skills", key: "skills" },
  { path: "experience", label: "Experience", key: "experience" },
  { path: "projects", label: "Projects", key: "projects" },
  { path: "education", label: "Education", key: "education" },
  { path: "certifications", label: "Certifications", key: "certifications" },
  { path: "additional", label: "Additional info", optional: true },
  { path: "resume", label: "Preview and download", final: true },
];
const TRACKED = STEPS.filter((s) => s.key);

const ProgressContext = createContext({ completion: {}, refreshProgress: () => {} });
export const useProgress = () => useContext(ProgressContext);

export default function StudentLayout() {
  const { user, logout, refreshMe } = useAuth();
  const { pathname } = useLocation();
  const [completion, setCompletion] = useState({});

  const refreshProgress = useCallback(async () => {
    try {
      const r = await studentApi.resume();
      setCompletion(r.completion);
      if (r.completion.header !== user?.header_completed) refreshMe();
    } catch { /* progress is decorative; ignore errors */ }
  }, [user?.header_completed, refreshMe]);

  useEffect(() => { refreshProgress(); }, [refreshProgress]);

  // The header comes first: until it's complete, every other step redirects there.
  if (!user.header_completed && !pathname.endsWith("/student/header")) {
    return <Navigate to="/student/header" replace />;
  }

  const done = TRACKED.filter((s) => completion[s.key]).length;
  const progress = done / TRACKED.length;

  return (
    <ProgressContext.Provider value={{ completion, refreshProgress }}>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand"><span className="brand-mark">R</span>Resume Builder</div>
          <p className="rail-summary"><strong>{done} of {TRACKED.length}</strong> sections done</p>
          <nav aria-label="Resume sections">
            <ol className="rail" style={{ "--progress": progress }}>
              {STEPS.map((s) => {
                const isDone = s.key && completion[s.key];
                const locked = !user.header_completed && s.path !== "header";
                return (
                  <li key={s.path} className={[isDone && "done", s.optional && "optional"].filter(Boolean).join(" ")}>
                    <NavLink to={`/student/${s.path}`} aria-disabled={locked}
                      onClick={(e) => locked && e.preventDefault()} style={locked ? { opacity: 0.45 } : undefined}>
                      <span className="rail-node" aria-hidden="true">{isDone ? "✓" : ""}</span>
                      {s.label}
                      {isDone && <span className="sr-only"> (done)</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="sidebar-foot">
            <span className="sidebar-user">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </aside>
        <main className="main"><Outlet /></main>
      </div>
    </ProgressContext.Provider>
  );
}
