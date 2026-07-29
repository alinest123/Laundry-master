import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export type SiteImageMap = Record<string, string>;

const QUERY_KEY = ["site-images"];

/** Public hook — returns key→url map. Falls back gracefully if API is loading. */
export function useSiteImages(): SiteImageMap {
  const { data } = useQuery<SiteImageMap>({
    queryKey: QUERY_KEY,
    queryFn: () => apiGet<SiteImageMap>("/api/site-images"),
    staleTime: 60_000,
  });
  return data ?? {};
}

/** Returns a single image URL by key, or `fallback` if not set or empty. */
export function useImage(key: string, fallback: string): string {
  const images = useSiteImages();
  const val = images[key];
  return val && val.trim() !== "" ? val : fallback;
}

/** Imperatively invalidates the site-images cache (use after an admin save). */
export function useInvalidateSiteImages() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY });
}
