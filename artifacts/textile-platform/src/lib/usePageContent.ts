import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

/**
 * Fetches CMS-editable content for a page slug from /api/page-content/:page.
 * Returns a helper `c(key, fallback)` so components never go blank even when
 * the API is loading or a field hasn't been saved yet.
 */
export function usePageContent(page: string) {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["page-content", page],
    queryFn: () => apiGet<Record<string, string>>(`/api/page-content/${page}`),
    staleTime: 60_000,
  });

  function c(key: string, fallback: string): string {
    const val = data?.[key];
    return val && val.trim() !== "" ? val : fallback;
  }

  return { c, data };
}
