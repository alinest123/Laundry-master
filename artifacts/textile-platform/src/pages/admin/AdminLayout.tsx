import { Link, useLocation } from "wouter";
import {
  FileText, Users, Tag, Folder, LayoutDashboard, ChevronRight,
  Globe, LogOut, UserCog, Calendar, CreditCard,
  Video, Mail, Image, Search, ArrowLeftRight, Settings, Shield,
  ClipboardList, BookOpen, Menu, X, PanelTop, MessageCircle, Check,
  Layers, GitBranch, BookMarked, ScrollText, Palette,
} from "lucide-react";
import { useAuth, can } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";

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
      { href: "/admin/articles",   icon: FileText,     label: "Articles",      resource: "articles" },
      { href: "/admin/categories", icon: Folder,       label: "Categories",    resource: "categories" },
      { href: "/admin/authors",    icon: BookOpen,     label: "Authors",       resource: "authors" },
      { href: "/admin/tags",       icon: Tag,          label: "Tags",          resource: "tags" },
      { href: "/admin/comments",   icon: MessageCircle,label: "Comments",      resource: "articles" },
      { href: "/admin/media",      icon: Image,        label: "Media Library", resource: "media" },
    ],
  },
  {
    label: "Expertise",
    items: [
      { href: "/admin/experts",     icon: Users,    label: "Experts",      resource: "experts" },
      { href: "/admin/appointments",icon: Calendar, label: "Appointments", resource: "appointments" },
      { href: "/admin/zoom",        icon: Video,    label: "Zoom Meetings",resource: "zoom" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/payments",   icon: CreditCard, label: "Payments",   resource: "payments" },
      { href: "/admin/newsletter", icon: Mail,       label: "Newsletter", resource: "newsletter" },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { href: "/admin/topics",            icon: Layers,      label: "Topics",             resource: "settings" },
      { href: "/admin/learning-paths",    icon: GitBranch,   label: "Learning Paths",     resource: "settings" },
      { href: "/admin/editorial-docs",    icon: ScrollText,  label: "Editorial Docs",     resource: "settings" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/branding",     icon: Palette,        label: "Branding & Images", resource: "settings" },
      { href: "/admin/page-content", icon: PanelTop,       label: "Page Content",      resource: "settings" },
      { href: "/admin/seo",          icon: Search,         label: "SEO",               resource: "seo" },
      { href: "/admin/redirects",    icon: ArrowLeftRight, label: "Redirects",         resource: "redirects" },
      { href: "/admin/settings",     icon: Settings,       label: "Site Settings",     resource: "settings" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users",         icon: UserCog,     label: "Users",         resource: "users" },
      { href: "/admin/audit-logs",    icon: ClipboardList,label: "Audit Logs",   resource: "audit_logs" },
      { href: "/admin/security-logs", icon: Shield,      label: "Security Logs", resource: "security_logs" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin", administrator: "Administrator", editor: "Editor",
  author: "Author", consultant: "Consultant", user: "User",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function AdminLayout({ children, title, breadcrumbs }: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const savedScrollTop = useRef(0);

  // Preserve sidebar nav scroll position across navigations.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    // Track scroll position continuously.
    const onScroll = () => { savedScrollTop.current = el.scrollTop; };
    el.addEventListener("scroll", onScroll, { passive: true });

    // When focus lands on any child (e.g. after the browser calls scrollIntoView
    // for the focused <a>), re-assert our saved position immediately.
    const onFocusIn = () => {
      requestAnimationFrame(() => {
        if (navRef.current) navRef.current.scrollTop = savedScrollTop.current;
      });
    };
    el.addEventListener("focusin", onFocusIn);

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  useEffect(() => {
    const restore = () => {
      if (navRef.current) navRef.current.scrollTop = savedScrollTop.current;
    };
    // rAF catches the first paint; setTimeout 100ms is a safety-net for any
    // browser scroll-into-view that fires after rAF.
    const raf = requestAnimationFrame(restore);
    const tid = setTimeout(restore, 100);
    return () => { cancelAnimationFrame(raf); clearTimeout(tid); };
  }, [location]);

  // Lock body scroll only on mobile (when the overlay is visible).
  // On desktop the sidebar is inline — never touch body overflow.
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      document.body.style.overflow = sidebarOpen ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !item.resource || !user || can(user.role, item.resource, "view")
    ),
  })).filter(section => section.items.length > 0);

  const pageTitle = breadcrumbs ? breadcrumbs[breadcrumbs.length - 1]?.label : title;

  return (
    <div className="h-screen bg-[#f0f0ee] flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-[#eaeaea] h-14 flex items-center justify-between px-4 z-30 shrink-0">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5 text-[#555]" /> : <Menu className="w-5 h-5 text-[#555]" />}
        </button>

        <span className="font-bold text-base text-[#1a1a1a]">{pageTitle}</span>

        {user && (
          <div className="w-9 h-9 shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-[#e0e0e0]" />
            ) : (
              <div className="w-9 h-9 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center text-sm font-bold select-none">
                {initials(user.name)}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/20 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={[
          // Mobile: fixed drawer controlled by transform
          "fixed top-14 left-0 bottom-0 w-60 bg-white border-r border-[#eaeaea] z-20",
          "flex flex-col overflow-y-auto transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: part of the flex row, fixed height so nav can scroll
          "lg:static lg:translate-x-0 lg:h-full lg:shrink-0",
          sidebarOpen ? "lg:flex" : "lg:hidden",
        ].join(" ")}>
          {/* User info */}
          <div className="px-4 py-4 border-b border-[#f0f0f0] shrink-0">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#e0e0e0] shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 select-none">
                  {user ? initials(user.name) : "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#1a1a1a] truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground">{user ? (ROLE_LABELS[user.role] ?? user.role) : ""}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav ref={navRef} className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
            {visibleSections.map((section) => (
              <div key={section.label || "main"}>
                {section.label && (
                  <p className="px-3 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map(({ href, icon: Icon, label, exact }) => {
                    const isActive = exact
                      ? location === href
                      : location.startsWith(href) && href !== "/admin";
                    // onMouseDown on the <a> prevents browser focus→scrollIntoView on nav.
                    return (
                      <Link key={href} href={href} onMouseDown={e => e.preventDefault()}>
                        <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors
                          ${isActive
                            ? "bg-primary/10 text-primary"
                            : "text-[#555] hover:bg-[#f5f5f2] hover:text-[#1a1a1a]"
                          }`}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-[#888]"}`} />
                          <span className="truncate">{label}</span>
                          {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-[#f0f0f0] px-2 py-3 space-y-0.5 shrink-0">
            <Link href="/">
              <span className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#555] hover:bg-[#f5f5f2] hover:text-[#1a1a1a] cursor-pointer transition-colors">
                <Globe className="w-4 h-4 text-[#888]" />
                View Site
              </span>
            </Link>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#555] hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#888]" />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 p-4 lg:p-6 xl:p-8 overflow-auto">
          {/* Breadcrumbs (below top bar, inside content) */}
          {breadcrumbs && breadcrumbs.length > 1 && (
            <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                  {b.href
                    ? <Link href={b.href}><span className="hover:text-primary cursor-pointer transition-colors">{b.label}</span></Link>
                    : <span className="text-[#1a1a1a] font-medium">{b.label}</span>
                  }
                </span>
              ))}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
