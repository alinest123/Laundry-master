import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { API_ORIGIN } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "administrator" | "editor" | "author" | "consultant" | "user";
  avatarUrl?: string | null;
};

/** @deprecated Use AuthUser */
export type AdminUser = AuthUser;

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, captcha?: { token: string; answer: string }) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/me`, { credentials: "include" });
      if (res.ok) setUser(await res.json());
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = useCallback(async (
    email: string,
    password: string,
    captcha?: { token: string; answer: string },
  ) => {
    const body: Record<string, string> = { email, password };
    if (captcha) {
      body.captchaToken = captcha.token;
      body.captchaAnswer = captcha.answer;
    }
    const res = await fetch(`${API_ORIGIN}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Login failed");
    }
    setUser(await res.json());
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_ORIGIN}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Registration failed");
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_ORIGIN}/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Role permission helper (mirrors backend)
const PERMS: Record<string, Record<string, string[]>> = {
  super_admin:   { dashboard:["view"], articles:["view","create","edit","delete","publish"], categories:["view","create","edit","delete"], authors:["view","create","edit","delete"], tags:["view","create","edit","delete"], fabrics:["view","create","edit","delete"], stains:["view","create","edit","delete"], users:["view","create","edit","delete"], experts:["view","create","edit","delete"], appointments:["view","edit"], payments:["view"], zoom:["view","create","edit","delete"], newsletter:["view","create","delete"], media:["view","create","delete"], seo:["view","edit"], redirects:["view","create","edit","delete"], settings:["view","edit"], security_logs:["view"], audit_logs:["view"] },
  administrator: { dashboard:["view"], articles:["view","create","edit","delete","publish"], categories:["view","create","edit","delete"], authors:["view","create","edit","delete"], tags:["view","create","edit","delete"], fabrics:["view","create","edit","delete"], stains:["view","create","edit","delete"], users:["view","create","edit","delete"], experts:["view","create","edit","delete"], appointments:["view","edit"], payments:["view"], zoom:["view","create","edit","delete"], newsletter:["view","create","delete"], media:["view","create","delete"], seo:["view","edit"], redirects:["view","create","edit","delete"], audit_logs:["view"] },
  editor:        { dashboard:["view"], articles:["view","create","edit","delete","publish"], categories:["view","create","edit","delete"], authors:["view"], tags:["view","create","edit","delete"], fabrics:["view","create","edit","delete"], stains:["view","create","edit","delete"], experts:["view"], media:["view","create","delete"], seo:["view"] },
  author:        { dashboard:["view"], articles:["view","create","edit"], categories:["view"], tags:["view"], media:["view","create","delete"] },
  consultant:    { dashboard:["view"], appointments:["view"], payments:["view"], zoom:["view"] },
  user:          { payments:["view"] },
};

export function can(role: AuthUser["role"] | undefined, resource: string, action: string): boolean {
  if (!role) return false;
  return PERMS[role]?.[resource]?.includes(action) ?? false;
}
