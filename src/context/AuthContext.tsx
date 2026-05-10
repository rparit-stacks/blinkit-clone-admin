import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { adminLogin } from "../api/adminApi";

interface AdminInfo { adminId: string; email: string; name: string; role: string; }
interface AuthCtx {
  admin: AdminInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    const raw = localStorage.getItem("adminInfo");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminLogin(email, password);
    localStorage.setItem("adminToken", res.token);
    const info = { adminId: res.adminId, email: res.email, name: res.name, role: res.role };
    localStorage.setItem("adminInfo", JSON.stringify(info));
    setAdmin(info);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdmin(null);
  }, []);

  return <AuthContext.Provider value={{ admin, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
};
