import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";

type Topic = { id: number; name: string };
type Article = { id: number; title: string; knowledgeLevel?: string; contentType?: string };
type PathItem = { articleId: number; stage: string; notes?: string; title?: string; knowledgeLevel?: string };
type LearningPath = { id: number; title: string; slug: string; description?: string; topicId?: number; sortOrder: number; items?: PathItem[] };

const STAGES = [
  { value: "start-here", label: "Start Here" },
  { value: "build-understanding", label: "Build Understanding" },
  { value: "go-deeper", label: "Go Deeper" },
  { value: "apply-knowledge", label: "Apply Knowledge" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LearningPaths() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<LearningPath | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTopicId, setNewTopicId] = useState<string>("none");
  const [articleSearch, setArticleSearch] = useState("");

  const { data: paths = [] } = useQuery<LearningPath[]>({
    queryKey: ["admin-learning-paths"],
    queryFn: () => apiGet("/api/admin/learning-paths"),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["admin-topics"],
    queryFn: () => apiGet("/api/admin/topics"),
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["admin-articles-simple"],
    queryFn: () => apiGet("/api/admin/articles?limit=200").then(r => r.articles ?? []),
  });

  const { data: pathDetail } = useQuery<LearningPath>({
    queryKey: ["admin-learning-path", selected?.id],
    queryFn: () => apiGet(`/api/admin/learning-paths/${selected!.id}`),
    enabled: !!selected,
  });

  const [editItems, setEditItems] = useState<PathItem[]>([]);
  const activeItems = pathDetail ? (editItems.length > 0 || pathDetail.items?.length === 0 ? editItems : pathDetail.items ?? []) : editItems;

  const create = useMutation({
    mutationFn: (d: any) => apiPost("/api/admin/learning-paths", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-learning-paths"] }); setCreating(false); setNewTitle(""); setNewSlug(""); setNewDesc(""); toast({ title: "Learning path created" }); },
    onError: () => toast({ title: "Failed to create path", variant: "destructive" }),
  });

  const saveItems = useMutation({
    mutationFn: ({ id, items }: { id: number; items: PathItem[] }) =>
      apiPut(`/api/admin/learning-paths/${id}`, { items }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-learning-path", selected?.id] }); toast({ title: "Saved" }); setEditItems([]); },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/learning-paths/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-learning-paths"] }); setSelected(null); toast({ title: "Deleted" }); },
  });

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(articleSearch.toLowerCase())
  ).slice(0, 10);

  const addItem = (article: Article) => {
    const base = pathDetail?.items ?? [];
    const current = editItems.length > 0 ? editItems : base;
    if (current.find(i => i.articleId === article.id)) return;
    setEditItems([...current, { articleId: article.id, stage: "build-understanding", title: article.title, knowledgeLevel: article.knowledgeLevel }]);
    setArticleSearch("");
  };

  const removeItem = (articleId: number) => {
    const base = pathDetail?.items ?? [];
    const current = editItems.length > 0 ? editItems : base;
    setEditItems(current.filter(i => i.articleId !== articleId));
  };

  const updateItemStage = (articleId: number, stage: string) => {
    const base = pathDetail?.items ?? [];
    const current = editItems.length > 0 ? editItems : base;
    setEditItems(current.map(i => i.articleId === articleId ? { ...i, stage } : i));
  };

  return (
    <AdminLayout title="Learning Paths" breadcrumbs={[{ label: "Knowledge" }, { label: "Learning Paths" }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — path list */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">All Paths ({paths.length})</h2>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
          </div>
          <div className="bg-white rounded-xl border border-[#eaeaea] divide-y divide-[#f4f4f4]">
            {paths.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No learning paths yet.</p>}
            {paths.map(p => (
              <div
                key={p.id}
                onClick={() => { setSelected(p); setEditItems([]); }}
                className={`px-4 py-3 cursor-pointer hover:bg-[#fafaf9] transition-colors ${selected?.id === p.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
              >
                <p className="font-medium text-sm text-[#1a1a1a]">{p.title}</p>
                <p className="text-xs text-muted-foreground">{topics.find(t => t.id === p.topicId)?.name ?? "No topic"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — path editor */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="bg-white rounded-xl border border-[#eaeaea] p-12 text-center text-sm text-muted-foreground">
              Select a learning path to edit its items, or create a new one.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-[#eaeaea] p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-[#1a1a1a]">{selected.title}</h2>
                    <p className="text-xs text-muted-foreground">/{selected.slug}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => { if (confirm("Delete this path?")) del.mutate(selected.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Article search */}
                <div className="space-y-1">
                  <Label className="text-xs">Add article to path</Label>
                  <Input placeholder="Search articles…" value={articleSearch} onChange={e => setArticleSearch(e.target.value)} />
                  {articleSearch && (
                    <div className="border rounded-lg bg-white shadow-sm max-h-48 overflow-y-auto divide-y">
                      {filteredArticles.map(a => (
                        <div key={a.id} className="px-3 py-2 hover:bg-[#fafaf9] cursor-pointer flex justify-between items-center" onClick={() => addItem(a)}>
                          <span className="text-sm">{a.title}</span>
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      ))}
                      {filteredArticles.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>}
                    </div>
                  )}
                </div>

                {/* Items grouped by stage */}
                {STAGES.map(stage => {
                  const stageItems = activeItems.filter(i => i.stage === stage.value);
                  return (
                    <div key={stage.value}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stage.label}</p>
                      {stageItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic pl-2">No items in this stage</p>
                      ) : (
                        <div className="space-y-1">
                          {stageItems.map(item => (
                            <div key={item.articleId} className="flex items-center gap-2 bg-[#fafaf9] rounded-lg px-3 py-2">
                              <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1 truncate">{item.title ?? `Article #${item.articleId}`}</span>
                              <Select value={item.stage} onValueChange={v => updateItemStage(item.articleId, v)}>
                                <SelectTrigger className="h-6 text-xs w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STAGES.map(s => <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => removeItem(item.articleId)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => saveItems.mutate({ id: selected.id, items: activeItems })} disabled={saveItems.isPending}>
                    {saveItems.isPending ? "Saving…" : "Save Path"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Learning Path</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(slugify(e.target.value)); }} placeholder="e.g. Water Quality" />
              </div>
              <div className="space-y-1">
                <Label>Slug *</Label>
                <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Topic</Label>
              <Select value={newTopicId} onValueChange={setNewTopicId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No topic —</SelectItem>
                  {topics.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button onClick={() => create.mutate({ title: newTitle, slug: newSlug, description: newDesc || null, topicId: newTopicId === "none" ? null : parseInt(newTopicId) })} disabled={!newTitle || !newSlug}>Create Path</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
