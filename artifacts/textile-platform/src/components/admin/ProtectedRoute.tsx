import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, can } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  requiredPermission?: { resource: string; action: string };
}

export function ProtectedRoute({ children, requiredPermission }: Props) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/admin/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f4]">
        <div className="w-6 h-6 border-2 border-[#4a7c59] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (requiredPermission && !can(user.role, requiredPermission.resource, requiredPermission.action)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f4]">
        <div className="text-center">
          <p className="text-2xl font-bold text-stone-800 mb-2">403</p>
          <p className="text-stone-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
