/** Shared API helpers for user-facing endpoints not yet in the generated client */
export const API_ORIGIN =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_ORIGIN}${path}`, { credentials: "include" }).then(handleResponse<T>);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_ORIGIN}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  }).then(handleResponse<T>);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${API_ORIGIN}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(handleResponse<T>);
}

export function apiDelete<T>(path: string): Promise<T> {
  return fetch(`${API_ORIGIN}${path}`, {
    method: "DELETE",
    credentials: "include",
  }).then(handleResponse<T>);
}
