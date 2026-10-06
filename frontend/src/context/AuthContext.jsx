import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { tokens } from "../api/client";
import { authApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    if (!tokens.access) { setUser(null); return null; }
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      tokens.clear();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
    const onLogout = () => setUser(null);
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [refreshMe]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    tokens.set(data);
    return refreshMe();
  };

  const logout = () => {
    tokens.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Where a user belongs right after login. */
export function homeFor(user) {
  if (!user) return "/login";
  if (user.must_change_password) return "/change-password";
  if (user.role === "admin") return "/admin";
  return user.header_completed ? "/student/summary" : "/student/header";
}
