import { Link, useLocation } from "wouter";
import {
  FileText, Users, Tag, Folder, LayoutDashboard, ChevronRight,
  Globe, LogOut, Shirt, Droplets, UserCog, Calendar, CreditCard,
  Video, Mail, Image, Search, ArrowLeftRight, Settings, Shield,
  ClipboardList, BookOpen, ChevronDown, Menu, X, PanelTop, MessageCircle,
} from "lucide-react";
import { useAuth, can } from "@/lib/auth";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  icon: any;
  label: string;
  exact?: boolean;
  resource?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [{ href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true, resource: "dashboard" }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/articles", icon: FileText, label: "Articles", resource: "articles" },
      { href: "/admin/categories", icon: Folder, label: "Categories", resource: "categories" },
      { href: "/admin/authors", icon: BookOpen, label: "Authors", resource: "authors" },
      { href: "/admin/tags", icon: Tag, label: "Tags", resource: "tags" },
      { href: "/admin/comments", icon: MessageCircle, label: "Comments", resource: "articles" },
      { href: "/admin/fabrics", icon: Shirt, label: "Fabrics", resource: "fabrics" },
      { href: "/admin/stains", icon: Droplets, label: "Stains", resource: "stains" },
      { href: "/admin/media", icon: Image, label: "Media Library", resource: "media" },
    ],
  },
  {
    label: "Expertise",
    items: [
      { href: "/admin/experts", icon: Users, label: "Experts", resource: "experts" },
      { href: "/admin/appointments", icon: Calendar, label: "Appointments", resource: "appointments" },
      { href: "/admin/zoom", icon: Video, label: "Zoom Meetings", resource: "zoom" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/payments", icon: CreditCard, label: "Payments", resource: "payments" },
      { href: "/admin/newsletter", icon: Mail, label: "Newsletter", resource: "newsletter" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/page-content", icon: PanelTop, label: "Page Content", resource: "settings" },
      { href: "/admin/seo", icon: Search, label: "SEO", resource: "seo" },
      { href: "/admin/redirects", icon: ArrowLeftRight, label: "Redirects", resource: "redirects" },
      { href: "/admin/settings", icon: Settings, label: "Site Settings", resource: "settings" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", icon: UserCog, label: "Users", resource: "users" },
      { href: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs", resource: "audit_logs" },
      { href: "/admin/security-logs", icon: Shield, label: "Security Logs", resource: "security_logs" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", administrator: "Administrator", editor: "Editor",
  author: "Author", consultant: "Consultant", user: "User",
};

export function AdminLayout({ children, title, breadcrumbs }: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav tap)
  useEffect(() => { setSidebarOpen(false); }, [location]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const toggleSection = (label: string) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.resource || !user || can(user.role, item.resource, "view")
    ),
  })).filter(section => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 lg:w-56 bg-[#111111] flex flex-col shrink-0
        fixed inset-y-0 left-0 z-40
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#4a7c59] rounded flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold leading-none truncate">Laundry Master</p>
              <p className="text-white/40 text-[10px] mt-0.5">CMS Admin</p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {visibleSections.map((section) => (
            <div key={section.label || "main"} className="mb-1">
              {section.label && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-2 py-1 mb-0.5 group"
                >
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                    {section.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-white/20 transition-transform ${collapsedSections[section.label] ? "-rotate-90" : ""}`} />
                </button>
              )}
              {!collapsedSections[section.label] && section.items.map(({ href, icon: Icon, label, exact }) => {
                const isActive = exact ? location === href : location.startsWith(href) && href !== "/admin";
                return (
                  <Link key={href} href={href}>
                    <span className={`flex items-center gap-2.5 px-2.5 py-2 lg:py-1.5 rounded text-sm cursor-pointer transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-xs">{label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4a7c59] shrink-0" />}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer — user info + logout */}
        <div className="px-2 py-3 border-t border-white/10">
          {user && (
            <div className="px-2.5 py-2 mb-1 rounded bg-white/5">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className="text-white/40 text-[10px] truncate">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          )}
          <Link href="/">
            <span className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
              <Globe className="w-3.5 h-3.5" /> View Site
            </span>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs text-white/40 hover:text-red-400 hover:bg-white/5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="pl-0 lg:pl-56 flex-1 flex flex-col min-h-screen w-full min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs / title */}
          <div className="flex items-center gap-2 min-w-0">
            {breadcrumbs ? (
              breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-2 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />}
                  {b.href
                    ? <Link href={b.href}><span className="text-sm text-stone-500 hover:text-stone-900 cursor-pointer truncate">{b.label}</span></Link>
                    : <span className="text-sm text-stone-900 font-medium truncate">{b.label}</span>}
                </span>
              ))
            ) : (
              <span className="text-sm font-semibold text-stone-900 truncate">{title}</span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
