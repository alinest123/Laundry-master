import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, Menu, X, Clock, Phone, MapPin, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { label: "Knowledge Hub", href: "/articles" },
  { label: "Categories", href: "/categories" },
  { label: "Consultations", href: "/consultations" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function TopBanner() {
  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="hidden md:flex max-w-[1280px] mx-auto px-6 h-10 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[#aaa] text-[0.72rem]">
            <Clock className="w-3 h-3 shrink-0" strokeWidth={2} />
            <span>Mon – Fri 8:00 – 18:00 / Sat 9:00 – 14:00</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[#aaa] text-[0.72rem]">
            <Phone className="w-3 h-3 shrink-0" strokeWidth={2} />
            <span>+1-800-TEXTILE</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[#aaa] text-[0.72rem]">
            <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
            <span>Global — serving 94 countries</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
            { label: "Twitter", path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" },
          ].map(({ label, path }) => (
            <a key={label} href="#" aria-label={label} className="text-[#666] hover:text-white transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
            </a>
          ))}
          <a href="#" aria-label="LinkedIn" className="text-[#666] hover:text-white transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="text-[#666] hover:text-white transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

/** Avatar dropdown for authenticated users */
function UserDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    setLocation("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[#666] hover:text-[#1c1c1c] transition-colors"
        aria-label="Account menu"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name}
            className="w-7 h-7 rounded-full object-cover border border-[#e0e0e0]" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#1c1c1c] text-white flex items-center justify-center text-[0.6rem] font-bold">
            {user ? initials(user.name) : <User className="w-3.5 h-3.5" />}
          </div>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e8e8e8] rounded-xl shadow-lg py-1 z-50">
          {user ? (
            <>
              <div className="px-4 py-2.5 border-b border-[#f0f0f0]">
                <p className="text-xs font-bold text-[#1c1c1c] truncate">{user.name}</p>
                <p className="text-[0.68rem] text-[#999] truncate">{user.email}</p>
              </div>
              <Link href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#888]" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#888]" />
                Dashboard
              </Link>
              <Link href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333] hover:bg-[#f5f5f2] transition-colors">
                <User className="w-3.5 h-3.5 text-[#888]" />
                Sign in
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#f0f0f0]">
      <TopBanner />
      <div className="max-w-[1280px] mx-auto px-6 h-[64px] flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-[#1c1c1c] rounded-sm flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="font-extrabold text-[1.05rem] tracking-tight text-[#1c1c1c]">Laundry Master</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`text-[0.82rem] font-semibold transition-colors ${
                location.startsWith(item.href) ? "text-[#1c1c1c]" : "text-[#666] hover:text-[#1c1c1c]"
              }`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          <Link href="/search" className="p-2 text-[#666] hover:text-[#1c1c1c] transition-colors">
            <Search className="w-[18px] h-[18px]" strokeWidth={2} />
          </Link>

          {loading ? (
            <div className="w-7 h-7 rounded-full bg-[#f0f0f0] animate-pulse" />
          ) : (
            <UserDropdown />
          )}

          <button className="md:hidden p-2 text-[#666] hover:text-[#1c1c1c]" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[#e8e8e8] bg-white">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="block px-6 py-3.5 text-sm font-semibold text-[#333] border-b border-[#f0f0f0] hover:bg-[#f5f5f2]">
              {item.label}
            </Link>
          ))}
          {!user && (
            <>
              <Link href="/login" onClick={() => setOpen(false)}
                className="block px-6 py-3.5 text-sm font-semibold text-[#333] border-b border-[#f0f0f0] hover:bg-[#f5f5f2]">
                Sign in
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}
                className="block px-6 py-3.5 text-sm font-semibold text-[#333] border-b border-[#f0f0f0] hover:bg-[#f5f5f2]">
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
