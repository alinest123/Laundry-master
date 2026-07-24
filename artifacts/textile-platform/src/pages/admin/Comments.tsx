import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, ExternalLink, MessageCircle, Clock } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommentRow {
  id: number;
  articleId: number;
  authorName: string;
  authorEmail: string;
  content: string;
  isApproved: number;   // 0 = pending, 1 = approved, -1 = rejected
  createdAt: string;
  articleTitle?: string;
  articleSlug?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(val: number) {
  if (val === 1) return { text: "Approved", cls: "bg-green-100 text-green-700 border-green-200" };
  if (val === -1) return { text: "Rejected", cls: "bg-red-100 text-red-700 border-red-200" };
  return { text: "Pending", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" };
}

function CommentCard({
  comment,
  onApprove,
  onDisapprove,
  onDelete,
}: {
  comment: CommentRow;
  onApprove: () => void;
  onDisapprove: () => void;
  onDelete: () => void;
}) {
  const { text, cls } = statusLabel(comment.isApproved);
  const date = new Date(comment.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="bg-white border border-border rounded-none p-5 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-primary text-sm">{comment.authorName}</p>
          <p className="text-xs text-muted-foreground">{comment.authorEmail}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 border rounded-none ${cls}`}>
            {text}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {date}
          </span>
        </div>
      </div>

      {/* Article link */}
      {comment.articleTitle && (
        <a
          href={`/articles/${comment.articleSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {comment.articleTitle}
        </a>
      )}

      {/* Content */}
      <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        {comment.isApproved !== 1 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-green-700 border-green-300 hover:bg-green-50 h-8 text-xs"
            onClick={onApprove}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </Button>
        )}
        {comment.isApproved !== -1 && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-red-700 border-red-300 hover:bg-red-50 h-8 text-xs"
            onClick={onDisapprove}
          >
            <XCircle className="w-3.5 h-3.5" /> Disapprove
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 text-muted-foreground hover:text-destructive h-8 text-xs ml-auto"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

// ── Admin API calls ───────────────────────────────────────────────────────────

const BASE = "/api/admin";

function fetchComments(status: string): Promise<CommentRow[]> {
  return apiGet(`${BASE}/comments${status !== "all" ? `?status=${status}` : ""}`);
}
function approveComment(id: number) {
  return fetch(`${BASE}/comments/${id}/approve`, { method: "PATCH", credentials: "include" }).then(
    (r) => r.json()
  );
}
function disapproveComment(id: number) {
  return fetch(`${BASE}/comments/${id}/disapprove`, { method: "PATCH", credentials: "include" }).then(
    (r) => r.json()
  );
}
function deleteComment(id: number) {
  return fetch(`${BASE}/comments/${id}`, { method: "DELETE", credentials: "include" }).then(
    (r) => r.json()
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Comments() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const qKey = ["admin-comments", filter];
  const { data: comments = [], isLoading } = useQuery<CommentRow[]>({
    queryKey: qKey,
    queryFn: () => fetchComments(filter),
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-comments"] });

  const approveMut = useMutation({
    mutationFn: (id: number) => approveComment(id),
    onSuccess: () => { toast({ title: "Comment approved" }); invalidate(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });
  const disapproveMut = useMutation({
    mutationFn: (id: number) => disapproveComment(id),
    onSuccess: () => { toast({ title: "Comment disapproved" }); invalidate(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => { toast({ title: "Comment deleted" }); invalidate(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const pending = comments.filter((c) => c.isApproved === 0).length;

  const TABS: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
              <MessageCircle className="w-6 h-6" /> Comments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Approve or reject reader comments before they go public.
            </p>
          </div>
          {pending > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-semibold">
              {pending} pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                filter === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-border p-5 h-32" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {filter !== "all" ? filter : ""} comments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onApprove={() => approveMut.mutate(comment.id)}
                onDisapprove={() => disapproveMut.mutate(comment.id)}
                onDelete={() => deleteMut.mutate(comment.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
