import { Link } from "wouter";
import { useState } from "react";
import { usePageContent } from "@/lib/usePageContent";

const COLS = [
  {
    title: "Knowledge",
    links: [
      { label: "All Articles", href: "/articles" },
      { label: "Categories", href: "/categories" },
      { label: "Knowledge Hub", href: "/knowledge" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Consultations", href: "/consultations" },
      { label: "Book a Session", href: "/consultations/book" },
      { label: "Our Experts", href: "/about" },
      { label: "Training", href: "/articles?category=training" },
    ],
  },
  {
    title: "Key Topics",
    links: [
      { label: "Fabric Science", href: "/categories/fabric-science" },
      { label: "Stain Removal", href: "/categories/stain-removal" },
      { label: "Dry Cleaning", href: "/categories/dry-cleaning" },
      { label: "Sustainability", href: "/categories/sustainability" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { c } = usePageContent("footer");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {}
  }

  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* Brand + newsletter */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-white/15 rounded-sm flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="font-extrabold text-[1.05rem] tracking-tight">Laundry Master</span>
          </div>

          <p className="text-[#888] text-sm leading-relaxed mb-6 max-w-xs">
            {c("tagline", "The global authority in professional textile care — science-first knowledge for laundry, dry cleaning, and fabric science professionals.")}
          </p>

          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#555] mb-3">
            {c("newsletter_label", "Newsletter Sign-up")}
          </p>
          {submitted ? (
            <p className="text-[#5a8c5e] text-sm font-semibold">✓ Thank you for subscribing!</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-[#2a2a2a] border border-[#333] text-white placeholder-[#555] text-sm px-3 py-2 rounded-[4px] outline-none focus:border-[#5a8c5e]"
              />
              <button
                type="submit"
                className="bg-[#4a7c59] hover:bg-[#3d6a4b] text-white text-sm font-bold px-4 py-2 rounded-[4px] transition-colors"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Link columns — 2-col grid on mobile (Services on right), flat into parent grid on desktop */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:contents">
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#555] mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[#888] hover:text-white text-sm transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom bar */}
      <div className="border-t border-[#2a2a2a]">
        <div className="max-w-[1280px] mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <p className="text-[#555] text-xs">{c("copyright", "© 2026 TextilePro. Textile care knowledge for professionals.")}</p>
          <div className="flex items-center gap-5">
            <Link href="/about" className="text-[#555] hover:text-[#888] text-xs transition-colors">Privacy Policy</Link>
            <Link href="/about" className="text-[#555] hover:text-[#888] text-xs transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
