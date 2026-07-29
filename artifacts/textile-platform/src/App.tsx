import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

import { AuthProvider, useAuth } from "@/lib/auth";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { apiGet } from "@/lib/api";
import { OrganizationSchema, WebSiteSchema } from "@/components/seo/JsonLd";
import { useSiteStatus } from "@/lib/useSiteStatus";

import { Home } from "@/pages/Home";
import { ArticleList } from "@/pages/articles/ArticleList";
import { ArticleDetail } from "@/pages/articles/ArticleDetail";
import { CategoryList } from "@/pages/categories/CategoryList";
import { CategoryDetail } from "@/pages/categories/CategoryDetail";
import { KnowledgeHub } from "@/pages/knowledge/KnowledgeHub";
import { SearchResults } from "@/pages/search/SearchResults";
import { ConsultationsList } from "@/pages/consultations/ConsultationsList";
import { BookConsultation } from "@/pages/consultations/BookConsultation";
import { UserDashboard } from "@/pages/dashboard/UserDashboard";
import { About } from "@/pages/about/About";
import { Contact } from "@/pages/contact/Contact";

// Auth pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";

// Admin CMS
import { Login } from "@/pages/admin/Login";
import { Dashboard } from "@/pages/admin/Dashboard";
import { ArticleList as AdminArticleList } from "@/pages/admin/articles/ArticleList";
import { ArticleEditor } from "@/pages/admin/articles/ArticleEditor";
import { Authors } from "@/pages/admin/Authors";
import { Categories as AdminCategories } from "@/pages/admin/Categories";
import { Tags } from "@/pages/admin/Tags";
import { Users } from "@/pages/admin/Users";

import { Experts } from "@/pages/admin/Experts";
import { Appointments } from "@/pages/admin/Appointments";
import { Payments } from "@/pages/admin/Payments";
import { ZoomMeetings } from "@/pages/admin/ZoomMeetings";
import { Newsletter } from "@/pages/admin/Newsletter";
import { MediaLibrary } from "@/pages/admin/MediaLibrary";
import { SeoManagement } from "@/pages/admin/SeoManagement";
import { Redirects } from "@/pages/admin/Redirects";
import { SiteSettings } from "@/pages/admin/SiteSettings";
import { PageContent } from "@/pages/admin/PageContent";
import { Comments } from "@/pages/admin/Comments";
import { AuditLogs } from "@/pages/admin/AuditLogs";
import { SecurityLogs } from "@/pages/admin/SecurityLogs";
import { Topics } from "@/pages/admin/Topics";
import { LearningPaths } from "@/pages/admin/LearningPaths";
import { EditorialDocs } from "@/pages/admin/EditorialDocs";
import { Branding } from "@/pages/admin/Branding";
import { TopicPage } from "@/pages/knowledge/TopicPage";

const queryClient = new QueryClient();

// ── Site-wide JSON-LD schemas (Organization + WebSite) ───────────────────────
function SiteSchemas() {
  const { data } = useSiteStatus();
  const siteName = data?.siteName ?? "Laundry Master";
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://laundrymaster.com";
  const logoUrl = data?.logoUrl ?? undefined;
  return (
    <>
      <OrganizationSchema name={siteName} url={siteUrl} logoUrl={logoUrl} />
      <WebSiteSchema name={siteName} url={siteUrl} />
    </>
  );
}

// ── Maintenance gate ──────────────────────────────────────────────────────────
function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data } = useQuery<{ maintenanceMode: boolean; siteName: string }>({
    queryKey: ["site-status"],
    queryFn: () => apiGet("/api/site-status"),
    staleTime: 10_000,
    refetchInterval: 15_000, // re-check every 15 s so turning it off/on reflects quickly
  });

  const [location] = useLocation();

  // Admins always bypass maintenance; admin paths always bypass (so /admin/login is reachable)
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isAdminPath = location.startsWith("/admin");

  if (!authLoading && data?.maintenanceMode && !isAdmin && !isAdminPath) {
    return <MaintenancePage siteName={data.siteName} />;
  }

  return <>{children}</>;
}

function AdminRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  return (
    <Route path={path}>
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    </Route>
  );
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      {/* User auth pages */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />

      {/* Admin login — unprotected */}
      <Route path="/admin/login" component={Login} />

      {/* Admin CMS — protected */}
      <AdminRoute path="/admin" component={Dashboard} />
      <AdminRoute path="/admin/articles" component={AdminArticleList} />
      <AdminRoute path="/admin/articles/new" component={ArticleEditor} />
      <AdminRoute path="/admin/articles/:id/edit" component={ArticleEditor} />
      <AdminRoute path="/admin/authors" component={Authors} />
      <AdminRoute path="/admin/categories" component={AdminCategories} />
      <AdminRoute path="/admin/tags" component={Tags} />
      <AdminRoute path="/admin/users" component={Users} />

      <AdminRoute path="/admin/experts" component={Experts} />
      <AdminRoute path="/admin/appointments" component={Appointments} />
      <AdminRoute path="/admin/payments" component={Payments} />
      <AdminRoute path="/admin/zoom" component={ZoomMeetings} />
      <AdminRoute path="/admin/newsletter" component={Newsletter} />
      <AdminRoute path="/admin/media" component={MediaLibrary} />
      <AdminRoute path="/admin/seo" component={SeoManagement} />
      <AdminRoute path="/admin/redirects" component={Redirects} />
      <AdminRoute path="/admin/settings" component={SiteSettings} />
      <AdminRoute path="/admin/page-content" component={PageContent} />
      <AdminRoute path="/admin/comments" component={Comments} />
      <AdminRoute path="/admin/audit-logs" component={AuditLogs} />
      <AdminRoute path="/admin/security-logs" component={SecurityLogs} />
      <AdminRoute path="/admin/topics" component={Topics} />
      <AdminRoute path="/admin/learning-paths" component={LearningPaths} />
      <AdminRoute path="/admin/editorial-docs" component={EditorialDocs} />
      <AdminRoute path="/admin/branding" component={Branding} />

      {/* Public site */}
      <Route path="/" component={Home} />
      <Route path="/articles" component={ArticleList} />
      <Route path="/articles/:slug" component={ArticleDetail} />
      <Route path="/categories" component={CategoryList} />
      <Route path="/categories/:slug" component={CategoryDetail} />
      <Route path="/knowledge" component={KnowledgeHub} />
      <Route path="/knowledge/:slug" component={TopicPage} />
      <Route path="/search" component={SearchResults} />
      <Route path="/consultations" component={ConsultationsList} />
      <Route path="/consultations/book" component={BookConsultation} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <SiteSchemas />
              <MaintenanceGate>
                <Router />
              </MaintenanceGate>
            </WouterRouter>
            <ScrollToTopButton />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
