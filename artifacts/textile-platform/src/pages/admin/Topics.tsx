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
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

type Topic = { id: number; name: string; slug: string; description?: string; parentId?: number; sortOrder: number };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function TopicForm({ topic, topics, onSave, onClose }: {
  topic?: Topic; topics: Topic[]; onSave: (d: any) => void; onClose: () => void;
}) {
  const [name, setName] = useState(topic?.name ?? "");
  const [slug, setSlug] = useState(topic?.slug ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [parentId, setParentId] = useState<string>(topic?.parentId?.toString() ?? "none");
  const [sortOrder, setSortOrder] = useState(topic?.sortOrder ?? 0);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!topic) setSlug(slugify(v));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Name *</Label>
          <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Fabric Science" />
        </div>
        <div className="space-y-1">
          <Label>Slug *</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. fabric-science" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Parent Topic</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger>
            <SelectValue placeholder="Top-level topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Top-level topic —</SelectItem>
            {topics.filter(t => t.id !== topic?.id && !t.parentId).map(t => (
              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-1">
        <Label>Sort Order</Label>
        <Input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} className="w-24" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave({ name, slug, description: description || null, parentId: parentId === "none" ? null : parseInt(parentId), sortOrder })}>
          Save Topic
        </Button>
      </div>
    </div>
  );
}

export function Topics() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Topic | null | "new">(null);

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["admin-topics"],
    queryFn: () => apiGet("/api/admin/topics"),
  });

  const create = useMutation({
    mutationFn: (d: any) => apiPost("/api/admin/topics", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topics"] }); setEditing(null); toast({ title: "Topic created" }); },
    onError: () => toast({ title: "Failed to create topic", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }: any) => apiPut(`/api/admin/topics/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topics"] }); setEditing(null); toast({ title: "Topic updated" }); },
    onError: () => toast({ title: "Failed to update topic", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/topics/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-topics"] }); toast({ title: "Topic deleted" }); },
    onError: () => toast({ title: "Failed to delete topic", variant: "destructive" }),
  });

  const topLevel = topics.filter(t => !t.parentId);
  const childrenOf = (id: number) => topics.filter(t => t.parentId === id);

  return (
    <AdminLayout title="Topics" breadcrumbs={[{ label: "Knowledge" }, { label: "Topics" }]}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{topics.length} topics — supports Topic → Subtopic → Sub-subtopic hierarchy</p>
          <Button onClick={() => setEditing("new")} size="sm"><Plus className="w-4 h-4 mr-1" /> New Topic</Button>
        </div>

        {/* Topic tree */}
        <div className="bg-white rounded-xl border border-[#eaeaea] divide-y divide-[#f4f4f4]">
          {topLevel.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No topics yet. Create your first topic to start building the knowledge hierarchy.
            </div>
          )}
          {topLevel.map(topic => (
            <div key={topic.id}>
              {/* Top-level row */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-[#fafaf9]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-[#1a1a1a]">{topic.name}</span>
                  <span className="text-xs text-muted-foreground">/{topic.slug}</span>
                  {childrenOf(topic.id).length > 0 && (
                    <span className="text-[10px] bg-[#f0f0ee] text-[#555] px-1.5 py-0.5 rounded-full">{childrenOf(topic.id).length} subtopics</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(topic)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete "${topic.name}"?`)) del.mutate(topic.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              {/* Subtopics */}
              {childrenOf(topic.id).map(sub => (
                <div key={sub.id}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#fafafa] hover:bg-[#f5f5f2]">
                    <div className="flex items-center gap-2 pl-6">
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-sm text-[#333]">{sub.name}</span>
                      <span className="text-xs text-muted-foreground">/{sub.slug}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(sub)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete "${sub.name}"?`)) del.mutate(sub.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {/* Sub-subtopics */}
                  {childrenOf(sub.id).map(subsub => (
                    <div key={subsub.id} className="flex items-center justify-between px-4 py-2 bg-[#f8f8f7] hover:bg-[#f5f5f2]">
                      <div className="flex items-center gap-2 pl-12">
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-sm text-[#555]">{subsub.name}</span>
                        <span className="text-xs text-muted-foreground">/{subsub.slug}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(subsub)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm(`Delete "${subsub.name}"?`)) del.mutate(subsub.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New Topic" : `Edit: ${(editing as Topic)?.name}`}</DialogTitle>
          </DialogHeader>
          <TopicForm
            topic={editing === "new" ? undefined : (editing as Topic)}
            topics={topics}
            onClose={() => setEditing(null)}
            onSave={(d) => {
              if (editing === "new") create.mutate(d);
              else update.mutate({ id: (editing as Topic).id, ...d });
            }}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
