import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("artisan-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("artisan-token")));

  useEffect(() => {
    if (!localStorage.getItem("artisan-token")) {
      setLoading(false);
      return;
    }

    getMe()
      .then(nextUser => {
        setUser(nextUser);
        localStorage.setItem("artisan-user", JSON.stringify(nextUser));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  function setSession(session) {
    localStorage.setItem("artisan-token", session.token);
    localStorage.setItem("artisan-user", JSON.stringify(session.user));
    setUser(session.user);
  }

  function logout() {
    localStorage.removeItem("artisan-token");
    localStorage.removeItem("artisan-user");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      setSession,
      setUser,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

