import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem("token"));
  const [user, setUserState] = useState(() => safeParse("user"));
  const [permissions, setPermissionsState] = useState(() => safeParse("permissions"));

  const login = useCallback((newToken, newUser, newPermissions) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("permissions", JSON.stringify(newPermissions || {}));
    setTokenState(newToken);
    setUserState(newUser);
    setPermissionsState(newPermissions || {});
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setTokenState(null);
    setUserState({});
    setPermissionsState({});
  }, []); 
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        setTokenState(null);
        setUserState({});
        setPermissionsState({});
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, permissions, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}