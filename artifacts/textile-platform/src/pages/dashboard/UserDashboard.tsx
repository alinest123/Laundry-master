import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import {
  Calendar, Video, Clock, FileText, Bookmark, User, Bell,
  Shield, ChevronRight, ExternalLink, Trash2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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

// ── Topic options for newsletter ──────────────────────────────────────────────
const TOPICS = [
  "Fabric Science", "Dry Cleaning", "Stain Removal", "Water Quality",
  "Garment Analysis", "Textile Testing", "Sustainability", "Industry News",
];

// ── Tab: Profile ──────────────────────────────────────────────────────────────

function ProfileTab({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

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
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-serif font-bold text-primary">Profile Information</h2>
      {field("Full name", "name")}
      {field("Phone", "phone", "tel")}
      {field("Bio", "bio", "text", true)}
      {field("Avatar URL", "avatarUrl", "url")}
      <div className="pt-2">
        <Button onClick={save} disabled={saving} className="bg-primary text-white">
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

  if (!data) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif font-bold text-primary">My Appointments</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/consultations/book">Book new session</Link>
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 border border-border rounded-xl">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-primary font-bold mb-2">No appointments yet</p>
          <p className="text-muted-foreground mb-6">Book a session with one of our experts.</p>
          <Button asChild><Link href="/consultations/book">Browse Experts</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((apt: any) => (
            <div key={apt.id} className="bg-background border border-border rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
              <div className="flex items-start gap-5">
                <div className="bg-muted p-3 text-center min-w-[72px]">
                  <div className="text-[0.65rem] font-bold text-primary uppercase">
                    {new Date(apt.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-2xl font-serif font-bold text-primary">
                    {new Date(apt.scheduledAt).getDate()}
                  </div>
                </div>
                <div>
                  <div className="mb-1">{statusBadge(apt.status)}</div>
                  <h3 className="font-serif font-bold text-base text-primary mb-0.5">
                    {apt.service?.name ?? "Consultation"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    with {apt.expert?.name ?? "Expert"}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-primary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {apt.service?.duration && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {apt.service.duration} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {apt.zoomLink ? (
                  <Button size="sm" className="gap-2 bg-primary text-white" asChild>
                    <a href={apt.zoomLink} target="_blank" rel="noopener noreferrer">
                      <Video className="w-4 h-4" /> Join
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>Awaiting link</Button>
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

  if (!all) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-primary mb-6">Zoom Meetings</h2>
      {all.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 border border-border rounded-xl">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-primary font-bold mb-2">No upcoming video calls</p>
          <p className="text-muted-foreground">Confirmed consultations with video links appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {all.map((item: any) => {
            const isAppt = !!item.scheduledAt;
            const date = isAppt ? item.scheduledAt : item.startTime;
            const link = isAppt ? item.zoomLink : item.joinUrl;
            const title = isAppt ? (item.service?.name ?? "Consultation") : item.title;
            return (
              <div key={`${isAppt ? "a" : "m"}-${item.id}`}
                className="bg-background border border-border rounded-xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm">{title}</p>
                    {date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                        at {new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                {link ? (
                  <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" /> Join
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled>Pending</Button>
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

  if (!data) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-primary mb-6">Invoices & Payments</h2>
      {data.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 border border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-primary font-bold mb-2">No invoices yet</p>
          <p className="text-muted-foreground">Payment history will appear here.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {data.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold text-sm text-primary">{p.description ?? `Payment #${p.id}`}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  {p.providerRef && <> · Ref: {p.providerRef}</>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {statusBadge(p.status)}
                <span className="font-bold text-primary text-sm">
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

  if (!data) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h2 className="text-xl font-serif font-bold text-primary mb-6">Saved Articles</h2>
      {data.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 border border-border rounded-xl">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-primary font-bold mb-2">No saved articles</p>
          <p className="text-muted-foreground mb-6">Bookmark articles to read them later.</p>
          <Button variant="outline" asChild><Link href="/articles">Explore Knowledge Hub</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item: any) => (
            <div key={item.savedId} className="border border-border rounded-xl overflow-hidden bg-background flex flex-col group">
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
                <h3 className="font-serif font-bold text-primary leading-snug mb-2 flex-1">
                  {item.article.title}
                </h3>
                {item.article.excerpt && (
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{item.article.excerpt}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
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

  if (!prefs) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-serif font-bold text-primary">Newsletter Preferences</h2>

      <div className="border border-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-primary">Email newsletter</p>
            <p className="text-sm text-muted-foreground">Receive research updates and industry insights</p>
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
          <p className="text-sm font-semibold text-primary mb-3">Topics you're interested in</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(t => {
              const on = prefs.newsletterTopics.includes(t);
              return (
                <button key={t} onClick={() => toggleTopic(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${on ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button onClick={save} disabled={saving} className="bg-primary text-white">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save preferences"}
      </Button>
    </div>
  );
}

// ── Tab: 2FA ──────────────────────────────────────────────────────────────────

function TwoFATab() {
  return (
    <div className="max-w-md">
      <h2 className="text-xl font-serif font-bold text-primary mb-4">Two-Factor Authentication</h2>
      <div className="border border-border rounded-lg p-6 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="font-bold text-primary mb-2">Coming soon</p>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication via authenticator app will be available in a future update.
          Your account slot is already reserved.
        </p>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function UserDashboard() {
  const { user, loading, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any | null>(null);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  // Load full profile for avatar / member since date
  useEffect(() => {
    if (user) {
      apiGet<any>("/api/user/profile").then(setProfile).catch(() => {});
    }
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

  const tabs = [
    { id: "profile",      icon: User,     label: "Profile" },
    { id: "appointments", icon: Calendar, label: "Appointments" },
    { id: "zoom",         icon: Video,    label: "Zoom Meetings" },
    { id: "invoices",     icon: FileText, label: "Invoices" },
    { id: "saved",        icon: Bookmark, label: "Saved Articles" },
    { id: "newsletter",   icon: Bell,     label: "Newsletter" },
    { id: "twofa",        icon: Shield,   label: "2FA" },
  ];

  return (
    <Shell>
      {/* Profile header */}
      <div className="bg-muted/30 border-b border-border py-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-5">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-serif font-bold shrink-0">
                {initials(user.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-serif font-bold text-primary">Welcome back, {user.name.split(" ")[0]}</h1>
              {memberSince && <p className="text-sm text-muted-foreground">Member since {memberSince}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 md:px-8 py-10">
        <Tabs defaultValue="profile">
          <TabsList className="mb-8 w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent flex-wrap gap-x-6 gap-y-0">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-0 font-semibold text-sm flex items-center gap-1.5 text-muted-foreground data-[state=active]:text-primary">
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab user={{ ...user, ...profile }} onRefresh={() => { refreshUser(); apiGet<any>("/api/user/profile").then(setProfile).catch(() => {}); }} />
          </TabsContent>
          <TabsContent value="appointments"><AppointmentsTab /></TabsContent>
          <TabsContent value="zoom"><ZoomTab /></TabsContent>
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
          <TabsContent value="saved"><SavedArticlesTab /></TabsContent>
          <TabsContent value="newsletter"><NewsletterTab /></TabsContent>
          <TabsContent value="twofa"><TwoFATab /></TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
