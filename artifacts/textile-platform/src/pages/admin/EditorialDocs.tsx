import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { Plus, Save, FileText } from "lucide-react";

type Doc = {
  id: number; slug: string; title: string; content: string; docType: string;
  version: string; effectiveDate?: string; docNumber?: string; status: string; approvedBy?: string;
};

const DOC_TYPES = [
  { value: "editorial-identity", label: "Editorial Identity Policy" },
  { value: "editorial-standards", label: "Editorial Standards" },
  { value: "publication-ethics", label: "Publication Ethics" },
  { value: "copyright", label: "Copyright & Intellectual Property" },
  { value: "privacy-policy", label: "Privacy Policy" },
  { value: "terms-of-use", label: "Terms of Use" },
  { value: "disclaimer", label: "Disclaimer" },
  { value: "ai-transparency", label: "AI & Research Transparency Policy" },
  { value: "corrections", label: "Corrections & Updates Policy" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-500",
};

export function EditorialDocs() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Doc | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: docs = [] } = useQuery<Doc[]>({
    queryKey: ["admin-editorial-docs"],
    queryFn: () => apiGet("/api/admin/editorial-documents"),
  });

  const create = useMutation({
    mutationFn: (d: any) => apiPost("/api/admin/editorial-documents", d),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["admin-editorial-docs"] });
      setCreating(false);
      setSelected(doc);
      toast({ title: "Document created" });
    },
    onError: () => toast({ title: "Failed to create document", variant: "destructive" }),
  });

  const save = useMutation({
    mutationFn: (d: Doc) => apiPut(`/api/admin/editorial-documents/${d.slug}`, d),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-editorial-docs"] });
      setSelected(updated);
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("");

  return (
    <AdminLayout title="Editorial Documents" breadcrumbs={[{ label: "Knowledge" }, { label: "Editorial Docs" }]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Documents ({docs.length})</h2>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" /> New</Button>
          </div>
          <div className="bg-white rounded-xl border border-[#eaeaea] divide-y divide-[#f4f4f4]">
            {docs.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No editorial documents yet.</p>}
            {docs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelected(doc)}
                className={`px-4 py-3 cursor-pointer hover:bg-[#fafaf9] ${selected?.slug === doc.slug ? "bg-primary/5 border-l-2 border-primary" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#1a1a1a] truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">v{doc.version}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[doc.status] ?? ""}`}>{doc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {creating ? (
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 space-y-4">
              <h2 className="font-semibold text-[#1a1a1a]">New Document</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Title *</Label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Privacy Policy" />
                </div>
                <div className="space-y-1">
                  <Label>Slug *</Label>
                  <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="e.g. privacy-policy" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Document Type *</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                <Button onClick={() => create.mutate({ slug: newSlug, title: newTitle, docType: newType, content: "", status: "draft" })} disabled={!newSlug || !newTitle || !newType}>Create</Button>
              </div>
            </div>
          ) : selected ? (
            <div className="bg-white rounded-xl border border-[#eaeaea] p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={selected.title} onChange={e => setSelected({ ...selected, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Version</Label>
                  <Input value={selected.version} onChange={e => setSelected({ ...selected, version: e.target.value })} className="w-24" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Effective Date</Label>
                  <Input type="date" value={selected.effectiveDate ?? ""} onChange={e => setSelected({ ...selected, effectiveDate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Document Number</Label>
                  <Input value={selected.docNumber ?? ""} onChange={e => setSelected({ ...selected, docNumber: e.target.value })} placeholder="e.g. EP-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={selected.status} onValueChange={v => setSelected({ ...selected, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Approved By</Label>
                  <Input value={selected.approvedBy ?? ""} onChange={e => setSelected({ ...selected, approvedBy: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Content</Label>
                <textarea
                  className="w-full border border-[#eaeaea] rounded-lg p-3 text-sm font-mono min-h-[300px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                  value={selected.content}
                  onChange={e => setSelected({ ...selected, content: e.target.value })}
                  placeholder="Write the document content here (Markdown supported)…"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => save.mutate(selected)} disabled={save.isPending}>
                  <Save className="w-4 h-4 mr-1.5" />
                  {save.isPending ? "Saving…" : "Save Document"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#eaeaea] p-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a document to edit, or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
