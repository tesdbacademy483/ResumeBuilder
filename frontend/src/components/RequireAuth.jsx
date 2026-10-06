import { Navigate, useLocation } from "react-router-dom";
import { homeFor, useAuth } from "../context/AuthContext";
import { Spinner } from "./ui";

export function FullPageLoader() {
  return <div className="auth"><Spinner /></div>;
}

/** Gate for every signed-in page: login -> password change -> correct role. */
export default function RequireAuth({ role, allowTempPassword, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.must_change_password && !allowTempPassword) return <Navigate to="/change-password" replace />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}
