import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "administrator" | "editor" | "author" | "consultant" | "user";
};

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) setUser(await res.json());
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || "Login failed");
    }
    const data = await res.json();
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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

export function can(role: AdminUser["role"] | undefined, resource: string, action: string): boolean {
  if (!role) return false;
  return PERMS[role]?.[resource]?.includes(action) ?? false;
}
