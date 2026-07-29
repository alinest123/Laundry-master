import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface SiteStatus {
  maintenanceMode: boolean;
  siteName: string;
  logoUrl: string | null;
  logoText: string;
  logoSizeDesktop: string;
  logoSizeMobile: string;
}

export function useSiteStatus() {
  return useQuery<SiteStatus>({
    queryKey: ["site-status"],
    queryFn: () => apiGet<SiteStatus>("/api/site-status"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
