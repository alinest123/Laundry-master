const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const BASE = `${API_ORIGIN}/api/admin`;

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const adminApi = {
  // ── Articles ──────────────────────────────────────────────────────────────
  articles: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/articles${q}`);
    },
    get: (id: number) => req<any>("GET", `/articles/${id}`),
    create: (data: any) => req<any>("POST", "/articles", data),
    update: (id: number, data: any) => req<any>("PUT", `/articles/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/articles/${id}`),
    publish: (id: number) => req<any>("POST", `/articles/${id}/publish`),
    unpublish: (id: number) => req<any>("POST", `/articles/${id}/unpublish`),
    schedule: (id: number, scheduledAt: string) => req<any>("POST", `/articles/${id}/schedule`, { scheduledAt }),
  },

  // ── Authors ───────────────────────────────────────────────────────────────
  authors: {
    list: () => req<any[]>("GET", "/authors"),
    get: (id: number) => req<any>("GET", `/authors/${id}`),
    create: (data: any) => req<any>("POST", "/authors", data),
    update: (id: number, data: any) => req<any>("PUT", `/authors/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/authors/${id}`),
  },

  // ── Categories ────────────────────────────────────────────────────────────
  categories: {
    list: () => req<any[]>("GET", "/categories"),
    flat: () => req<any[]>("GET", "/categories/flat"),
    create: (data: any) => req<any>("POST", "/categories", data),
    update: (id: number, data: any) => req<any>("PUT", `/categories/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/categories/${id}`),
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  tags: {
    list: () => req<any[]>("GET", "/tags"),
    create: (data: any) => req<any>("POST", "/tags", data),
    update: (id: number, data: any) => req<any>("PUT", `/tags/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/tags/${id}`),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    list: () => req<any[]>("GET", "/users"),
    get: (id: number) => req<any>("GET", `/users/${id}`),
    create: (data: any) => req<any>("POST", "/users", data),
    update: (id: number, data: any) => req<any>("PUT", `/users/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/users/${id}`),
  },

  // ── Fabrics ───────────────────────────────────────────────────────────────
  fabrics: {
    list: () => req<any[]>("GET", "/fabrics"),
    get: (id: number) => req<any>("GET", `/fabrics/${id}`),
    create: (data: any) => req<any>("POST", "/fabrics", data),
    update: (id: number, data: any) => req<any>("PUT", `/fabrics/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/fabrics/${id}`),
  },

  // ── Stains ────────────────────────────────────────────────────────────────
  stains: {
    list: () => req<any[]>("GET", "/stains"),
    get: (id: number) => req<any>("GET", `/stains/${id}`),
    create: (data: any) => req<any>("POST", "/stains", data),
    update: (id: number, data: any) => req<any>("PUT", `/stains/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/stains/${id}`),
  },

  // ── Experts ───────────────────────────────────────────────────────────────
  experts: {
    list: () => req<any[]>("GET", "/experts"),
    get: (id: number) => req<any>("GET", `/experts/${id}`),
    create: (data: any) => req<any>("POST", "/experts", data),
    update: (id: number, data: any) => req<any>("PUT", `/experts/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/experts/${id}`),
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  appointments: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/appointments${q}`);
    },
    update: (id: number, data: any) => req<any>("PATCH", `/appointments/${id}`, data),
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  payments: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/payments${q}`);
    },
    get: (id: number) => req<any>("GET", `/payments/${id}`),
  },

  // ── Zoom ──────────────────────────────────────────────────────────────────
  zoom: {
    list: () => req<any[]>("GET", "/zoom"),
    get: (id: number) => req<any>("GET", `/zoom/${id}`),
    create: (data: any) => req<any>("POST", "/zoom", data),
    update: (id: number, data: any) => req<any>("PUT", `/zoom/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/zoom/${id}`),
  },

  // ── Newsletter ────────────────────────────────────────────────────────────
  newsletter: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/newsletter${q}`);
    },
    deleteOne: (id: number) => req<void>("DELETE", `/newsletter/${id}`),
    bulkDelete: (ids: number[]) => req<any>("POST", "/newsletter/bulk-delete", { ids }),
  },

  // ── Media ─────────────────────────────────────────────────────────────────
  media: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/media${q}`);
    },
    create: (data: any) => req<any>("POST", "/media", data),
    delete: (id: number) => req<void>("DELETE", `/media/${id}`),
  },

  // ── SEO ───────────────────────────────────────────────────────────────────
  seo: {
    list: () => req<any[]>("GET", "/seo"),
    update: (id: number, data: any) => req<any>("PATCH", `/seo/${id}`, data),
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  redirects: {
    list: () => req<any[]>("GET", "/redirects"),
    create: (data: any) => req<any>("POST", "/redirects", data),
    update: (id: number, data: any) => req<any>("PUT", `/redirects/${id}`, data),
    delete: (id: number) => req<void>("DELETE", `/redirects/${id}`),
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: () => req<any>("GET", "/settings"),
    update: (data: any) => req<any>("PUT", "/settings", data),
  },

  // ── Audit Logs ────────────────────────────────────────────────────────────
  auditLogs: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/audit-logs${q}`);
    },
  },

  // ── Security Logs ─────────────────────────────────────────────────────────
  securityLogs: {
    list: (params?: Record<string, string>) => {
      const q = params ? "?" + new URLSearchParams(params).toString() : "";
      return req<any>("GET", `/security-logs${q}`);
    },
  },
};

// Slug generation utility
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
