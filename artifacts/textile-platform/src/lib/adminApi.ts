const BASE = "/api/admin";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
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
