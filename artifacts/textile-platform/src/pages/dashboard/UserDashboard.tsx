import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import {
  Calendar, Video, Clock, FileText, Bookmark, User, Bell,
  Shield, ChevronRight, ExternalLink, Trash2, Loader2,
  Camera, Menu, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, deleteStorageFile } from "@/lib/uploadFile";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-800",
    pending:   "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-700",
    succeeded: "bg-emerald-100 text-emerald-800",
    failed:    "bg-red-100 text-red-700",
    refunded:  "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`text-[0.68rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

const TOPICS = [
  "Fabric Science", "Dry Cleaning", "Stain Removal", "Water Quality",
  "Garment Analysis", "Textile Testing", "Sustainability", "Industry News",
];

// ── Avatar upload helper ───────────────────────────────────────────────────────

async function uploadAvatar(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const { servingUrl } = await uploadFile(file, "author", onProgress);
  return servingUrl;
}

// ── Tab: Profile ──────────────────────────────────────────────────────────────

function ProfileTab({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadProgress(0);
    // Best-effort: delete the old avatar
    if (form.avatarUrl) deleteStorageFile(form.avatarUrl);
    try {
      const url = await uploadAvatar(file, setUploadProgress);
      setForm(f => ({ ...f, avatarUrl: url }));
      toast({ title: "Avatar uploaded — save to apply" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false); setUploadProgress(0);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiPatch("/api/user/profile", form);
      toast({ title: "Profile updated" });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = "text", multiline = false) => (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-white"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-lg font-bold text-[#1a1a1a]">Profile Information</h2>

      {/* Avatar picker */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-white shadow" />
          ) : (
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow">
              {initials(form.name || user.name || "U")}
            </div>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full border border-[#e0e0e0] shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              : <Camera className="w-3.5 h-3.5 text-[#555]" />
            }
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="space-y-1 text-sm">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="font-semibold text-primary hover:underline block"
          >
            Upload from device
          </button>
          <p className="text-xs text-muted-foreground">JPG, PNG, GIF · max 5 MB</p>
          {form.avatarUrl && (
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, avatarUrl: "" }))}
              className="text-xs text-red-500 hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {field("Full name", "name")}
      {field("Phone", "phone", "tel")}
      {field("Bio", "bio", "text", true)}

      {/* Avatar URL (manual fallback) */}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Avatar URL <span className="normal-case font-normal">(or paste a link)</span>
        </label>
        <input
          type="url"
          value={form.avatarUrl}
          onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          placeholder="https://..."
        />
      </div>

      <div className="pt-1">
        <Button onClick={save} disabled={saving || uploading} className="bg-primary text-white rounded-lg">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

// ── Tab: Appointments ─────────────────────────────────────────────────────────

function AppointmentsTab() {
  const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    apiGet<any[]>("/api/user/appointments").then(setData).catch(() => setData([]));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-[#1a1a1a]">My Appointments</h2>
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link href="/consultations/book">Book new session</Link>
        </Button>
      </div>

      {data.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments yet" sub="Book a session with one of our experts.">
          <Button asChild className="rounded-lg"><Link href="/consultations/book">Browse Experts</Link></Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((apt: any) => (
            <div key={apt.id} className="bg-white rounded-2xl border border-[#eee] p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-orange-50 rounded-xl p-3 text-center min-w-[60px]">
                  <div className="text-[0.6rem] font-bold text-orange-600 uppercase">
                    {new Date(apt.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-xl font-bold text-orange-600">
                    {new Date(apt.scheduledAt).getDate()}
                  </div>
                </div>
                <div>
                  <div className="mb-1">{statusBadge(apt.status)}</div>
                  <h3 className="font-bold text-sm text-[#1a1a1a] mb-0.5">
                    {apt.service?.name ?? "Consultation"}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-1.5">
                    with {apt.expert?.name ?? "Expert"}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {apt.service?.duration && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {apt.service.duration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {apt.zoomLink ? (
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" asChild>
                    <a href={apt.zoomLink} target="_blank" rel="noopener noreferrer">
                      <Video className="w-3.5 h-3.5" /> Join
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-lg" disabled>Awaiting link</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Zoom Meetings ────────────────────────────────────────────────────────

function ZoomTab() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    apiGet<any>("/api/user/zoom-meetings").then(setData).catch(() => setData({ appointments: [], meetings: [] }));
  }, []);

  const all = data ? [...(data.appointments ?? []), ...(data.meetings ?? [])] : null;

  if (!all) return <Spinner />;

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-6">Zoom Meetings</h2>
      {all.length === 0 ? (
        <EmptyState icon={Video} title="No upcoming video calls" sub="Confirmed consultations with video links appear here." />
      ) : (
        <div className="space-y-3">
          {all.map((item: any) => {
            const isAppt = !!item.scheduledAt;
            const date = isAppt ? item.scheduledAt : item.startTime;
            const link = isAppt ? item.zoomLink : item.joinUrl;
            const title = isAppt ? (item.service?.name ?? "Consultation") : item.title;
            return (
              <div key={`${isAppt ? "a" : "m"}-${item.id}`}
                className="bg-white rounded-2xl border border-[#eee] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1a1a1a]">{title}</p>
                    {date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                        at {new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                {link ? (
                  <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" /> Join
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-lg" disabled>Pending</Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Invoices ─────────────────────────────────────────────────────────────

function InvoicesTab() {
  const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    apiGet<any[]>("/api/user/invoices").then(setData).catch(() => setData([]));
  }, []);

  if (!data) return <Spinner />;

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-6">Invoices & Payments</h2>
      {data.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" sub="Payment history will appear here." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden divide-y divide-[#f0f0f0] shadow-sm">
          {data.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-sm text-[#1a1a1a]">{p.description ?? `Payment #${p.id}`}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  {p.providerRef && <> · {p.providerRef}</>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {statusBadge(p.status)}
                <span className="font-bold text-sm text-[#1a1a1a]">
                  {(p.amount / 100).toLocaleString("en-US", { style: "currency", currency: p.currency?.toUpperCase() ?? "USD" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Saved Articles ───────────────────────────────────────────────────────

function SavedArticlesTab() {
  const { toast } = useToast();
  const [data, setData] = useState<any[] | null>(null);

  const load = () => {
    apiGet<any[]>("/api/user/saved-articles").then(setData).catch(() => setData([]));
  };

  useEffect(load, []);

  const unsave = async (articleId: number) => {
    try {
      await apiDelete(`/api/user/saved-articles/${articleId}`);
      toast({ title: "Removed from saved articles" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (!data) return <Spinner />;

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-6">Saved Articles</h2>
      {data.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved articles" sub="Bookmark articles to read them later.">
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href="/articles">Explore Knowledge Hub</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item: any) => (
            <div key={item.savedId} className="bg-white rounded-2xl border border-[#eee] overflow-hidden flex flex-col group shadow-sm">
              {item.article.featuredImage && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={item.article.featuredImage}
                    alt={item.article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-sm text-[#1a1a1a] leading-snug mb-2 flex-1">
                  {item.article.title}
                </h3>
                {item.article.excerpt && (
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{item.article.excerpt}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f0f0f0]">
                  <Link href={`/articles/${item.article.slug}`}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    Read <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => unsave(item.article.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    title="Remove bookmark">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Newsletter ───────────────────────────────────────────────────────────

function NewsletterTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<{ newsletterEnabled: boolean; newsletterTopics: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<any>("/api/user/newsletter").then(setPrefs).catch(() => {});
  }, []);

  const toggleTopic = (t: string) => {
    if (!prefs) return;
    const topics = prefs.newsletterTopics.includes(t)
      ? prefs.newsletterTopics.filter(x => x !== t)
      : [...prefs.newsletterTopics, t];
    setPrefs({ ...prefs, newsletterTopics: topics });
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      await apiPatch("/api/user/newsletter", prefs);
      toast({ title: "Newsletter preferences saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return <Spinner />;

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-lg font-bold text-[#1a1a1a]">Newsletter Preferences</h2>

      <div className="bg-white rounded-2xl border border-[#eee] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-[#1a1a1a]">Email newsletter</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receive research updates and industry insights</p>
          </div>
          <button
            onClick={() => setPrefs(p => p ? { ...p, newsletterEnabled: !p.newsletterEnabled } : p)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${prefs.newsletterEnabled ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs.newsletterEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {prefs.newsletterEnabled && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Topics you're interested in</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => {
              const on = prefs.newsletterTopics.includes(t);
              return (
                <button key={t} onClick={() => toggleTopic(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${on ? "bg-primary text-white border-primary" : "border-[#e0e0e0] text-muted-foreground hover:border-primary hover:text-primary"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button onClick={save} disabled={saving} className="bg-primary text-white rounded-lg">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save preferences"}
      </Button>
    </div>
  );
}

// ── Tab: 2FA ──────────────────────────────────────────────────────────────────

function TwoFATab() {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-[#1a1a1a] mb-4">Two-Factor Authentication</h2>
      <div className="bg-white rounded-2xl border border-[#eee] p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-purple-500" />
        </div>
        <p className="font-bold text-[#1a1a1a] mb-2">Coming soon</p>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication via authenticator app will be available in a future update.
        </p>
      </div>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="py-20 flex justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({
  icon: Icon, title, sub, children,
}: { icon: any; title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-[#eee] shadow-sm">
      <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <p className="font-bold text-[#1a1a1a] mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-5">{sub}</p>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: number | null;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
};

function StatCard({ icon: Icon, label, value, iconBg, iconColor, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#eee] p-4 flex flex-col gap-3 text-left shadow-sm hover:shadow-md transition-shadow w-full"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: "18px", height: "18px" }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#1a1a1a] leading-none mb-1">
          {value === null ? <span className="text-lg text-muted-foreground">—</span> : value}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </button>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { id: "profile",      icon: User,     label: "Profile" },
  { id: "appointments", icon: Calendar, label: "Appointments" },
  { id: "zoom",         icon: Video,    label: "Zoom Meetings" },
  { id: "invoices",     icon: FileText, label: "Invoices" },
  { id: "saved",        icon: Bookmark, label: "Saved Articles" },
  { id: "newsletter",   icon: Bell,     label: "Newsletter" },
  { id: "twofa",        icon: Shield,   label: "2FA" },
] as const;

type TabId = typeof NAV_TABS[number]["id"];

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function UserDashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<{
    saved: number | null;
    appointments: number | null;
    zoom: number | null;
    invoices: number | null;
  }>({ saved: null, appointments: null, zoom: null, invoices: null });

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user) return;
    apiGet<any>("/api/user/profile").then(setProfile).catch(() => {});
    // Fetch counts for at-a-glance
    apiGet<any[]>("/api/user/saved-articles").then(d => setStats(s => ({ ...s, saved: d.length }))).catch(() => {});
    apiGet<any[]>("/api/user/appointments").then(d => setStats(s => ({ ...s, appointments: d.length }))).catch(() => {});
    apiGet<any>("/api/user/zoom-meetings").then(d => setStats(s => ({ ...s, zoom: (d.appointments?.length ?? 0) + (d.meetings?.length ?? 0) }))).catch(() => {});
    apiGet<any[]>("/api/user/invoices").then(d => setStats(s => ({ ...s, invoices: d.length }))).catch(() => {});
  }, [user]);

  if (loading || !user) {
    return (
      <Shell>
        <div className="py-32 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const goTab = (id: TabId) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  const atAGlance = [
    { icon: Bookmark, label: "Saved Articles", value: stats.saved,       iconBg: "bg-purple-100", iconColor: "text-purple-600", tab: "saved"        as TabId },
    { icon: Calendar, label: "Appointments",   value: stats.appointments, iconBg: "bg-orange-100", iconColor: "text-orange-500", tab: "appointments" as TabId },
    { icon: Video,    label: "Zoom Meetings",  value: stats.zoom,         iconBg: "bg-blue-100",   iconColor: "text-blue-600",   tab: "zoom"         as TabId },
    { icon: FileText, label: "Invoices",       value: stats.invoices,     iconBg: "bg-teal-100",   iconColor: "text-teal-600",   tab: "invoices"     as TabId },
  ];

  return (
    <Shell>
      <div className="min-h-screen bg-[#f0f0ee]">
        <div className="flex">
          {/* ── Sidebar (desktop) / Drawer (mobile) ── */}
          <>
            {/* Overlay for mobile drawer */}
            {drawerOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-20 md:hidden"
                onClick={() => setDrawerOpen(false)}
              />
            )}

            <aside className={`
              fixed md:sticky top-14 left-0 h-[calc(100vh-56px)] w-60 bg-white border-r border-[#eaeaea] z-20
              flex flex-col py-4 overflow-y-auto
              transition-transform duration-200
              ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
              md:translate-x-0 md:flex
            `}>
              {/* User info in sidebar */}
              <div className="px-4 pb-4 border-b border-[#f0f0f0] mb-2">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#e0e0e0]" />
                  ) : (
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {initials(user.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#1a1a1a] truncate">{user.name}</p>
                    {memberSince && <p className="text-[10px] text-muted-foreground">Since {memberSince}</p>}
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-0.5 px-2">
                {NAV_TABS.map(({ id, icon: Icon, label }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => goTab(id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left
                        ${active
                          ? "bg-primary/10 text-primary"
                          : "text-[#555] hover:bg-[#f5f5f2] hover:text-[#1a1a1a]"
                        }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-[#888]"}`} />
                      {label}
                      {active && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
            {/* AT A GLANCE — shown on all tabs */}
            <section className="mb-8">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-3">
                At a glance
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {atAGlance.map(s => (
                  <StatCard
                    key={s.label}
                    icon={s.icon}
                    label={s.label}
                    value={s.value}
                    iconBg={s.iconBg}
                    iconColor={s.iconColor}
                    onClick={() => goTab(s.tab)}
                  />
                ))}
              </div>
            </section>

            {/* Tab content */}
            <div>
              {activeTab === "profile" && (
                <ProfileTab
                  user={{ ...user, ...profile }}
                  onRefresh={() => {
                    refreshUser();
                    apiGet<any>("/api/user/profile").then(setProfile).catch(() => {});
                  }}
                />
              )}
              {activeTab === "appointments" && <AppointmentsTab />}
              {activeTab === "zoom"         && <ZoomTab />}
              {activeTab === "invoices"     && <InvoicesTab />}
              {activeTab === "saved"        && <SavedArticlesTab />}
              {activeTab === "newsletter"   && <NewsletterTab />}
              {activeTab === "twofa"        && <TwoFATab />}
            </div>
          </main>
        </div>
      </div>
    </Shell>
  );
}
