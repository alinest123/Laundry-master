import { Link, useLocation } from "wouter";
import {
  FileText, Users, Tag, Folder, LayoutDashboard, ChevronRight,
  Globe, Settings, LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/articles", icon: FileText, label: "Articles" },
  { href: "/admin/authors", icon: Users, label: "Authors" },
  { href: "/admin/categories", icon: Folder, label: "Categories" },
  { href: "/admin/tags", icon: Tag, label: "Tags" },
];

export function AdminLayout({ children, title, breadcrumbs }: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111111] flex flex-col shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#4a7c59] rounded flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-xs font-bold leading-none">Laundry Master</p>
              <p className="text-white/40 text-[10px] mt-0.5">CMS Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? location === href : location.startsWith(href) && href !== "/admin";
            const isActive = exact ? location === href : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <span className={`flex items-center gap-3 px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4a7c59]" />}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link href="/">
            <span className="flex items-center gap-3 px-3 py-2 rounded text-sm text-white/40 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
              <Globe className="w-4 h-4" />
              View Site
            </span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="pl-56 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-stone-200 px-6 py-3 flex items-center gap-2">
          {breadcrumbs ? (
            <>
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-400" />}
                  {b.href ? (
                    <Link href={b.href}><span className="text-sm text-stone-500 hover:text-stone-900 cursor-pointer">{b.label}</span></Link>
                  ) : (
                    <span className="text-sm text-stone-900 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </>
          ) : (
            <span className="text-sm font-semibold text-stone-900">{title}</span>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
