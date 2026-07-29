import { Shell } from "@/components/layout/Shell";
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ChevronRight, Clock, Zap, BookOpen, ArrowRight, Tag } from "lucide-react";

type Topic = { id: number; name: string; slug: string; description?: string; featuredImage?: string; parentId?: number };
type Article = {
  id: number; title: string; slug: string; excerpt?: string; readingTime: number;
  contentType: string; knowledgeLevel: string; difficulty?: string;
  expertReviewStatus: string; featuredImage?: string; publishedAt?: string;
};

const LEVEL_COLORS: Record<string, string> = {
  "quick":        "bg-amber-100 text-amber-800 border-amber-200",
  "professional": "bg-blue-100 text-blue-800 border-blue-200",
  "advanced":     "bg-purple-100 text-purple-800 border-purple-200",
};

const LEVEL_LABELS: Record<string, string> = {
  "quick": "60-Second", "professional": "Professional", "advanced": "Advanced",
};

const REVIEW_BADGE: Record<string, { label: string; cls: string }> = {
  "technically-verified": { label: "✓ Technically Verified", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "expert-reviewed":      { label: "✓ Expert Reviewed",      cls: "bg-green-50 text-green-700 border-green-200" },
  "editorially-reviewed": { label: "Reviewed",               cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

const CT_LABELS: Record<string, string> = {
  "60-second": "60-Second", "professional-article": "Article", "practical-guide": "Guide",
  "technical-article": "Technical", "research-paper": "Research", "white-paper": "White Paper",
  "case-study": "Case Study", "best-practice-guide": "Best Practice", "sop": "SOP",
  "technical-reference": "Reference", "expert-interview": "Interview",
};

function ArticleCard({ article }: { article: Article }) {
  const is60s = article.contentType === "60-second";
  const badge = REVIEW_BADGE[article.expertReviewStatus];

  return (
    <Link href={`/articles/${article.slug}`}
      className="group flex flex-col bg-white border border-[#eaeaea] rounded-xl overflow-hidden hover:border-[#4a7c59]/50 hover:shadow-md transition-all">
      {article.featuredImage && !is60s && (
        <div className="aspect-[16/7] overflow-hidden bg-[#f5f5f2] shrink-0">
          <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {is60s && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <Zap className="w-4 h-4 text-white" fill="white" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">60-Second Knowledge</span>
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${LEVEL_COLORS[article.knowledgeLevel] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {LEVEL_LABELS[article.knowledgeLevel] ?? article.knowledgeLevel}
          </span>
          {article.difficulty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#fafaf9] text-[#666] border-[#e8e8e4] font-medium">
              {article.difficulty}
            </span>
          )}
          {badge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.cls}`}>{badge.label}</span>
          )}
        </div>
        <h3 className="font-semibold text-[#1a1a1a] text-sm leading-snug mb-2 group-hover:text-[#4a7c59] transition-colors line-clamp-2 flex-1">{article.title}</h3>
        {article.excerpt && <p className="text-xs text-[#666] line-clamp-2 mb-3">{article.excerpt}</p>}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f4f4f0]">
          <span className="text-[11px] text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" />{article.readingTime} min</span>
          <span className="text-[11px] text-[#bbb]">{CT_LABELS[article.contentType] ?? article.contentType}</span>
        </div>
      </div>
    </Link>
  );
}

export function TopicPage() {
  const [, params] = useRoute("/knowledge/:slug");
  const slug = params?.slug ?? "";

  const { data, isLoading, isError } = useQuery<{ topic: Topic; subtopics: Topic[]; articles: Article[] }>({
    queryKey: ["topic-page", slug],
    queryFn: () => apiGet(`/api/knowledge/topic/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-20 animate-pulse max-w-6xl">
          <div className="h-4 bg-[#f0f0ee] rounded w-48 mb-6" />
          <div className="h-12 bg-[#f0f0ee] rounded w-1/2 mb-3" />
          <div className="h-4 bg-[#f0f0ee] rounded w-2/3 mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#f0f0ee] rounded-xl" />)}
          </div>
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-4">Topic Not Found</h1>
          <Link href="/knowledge" className="text-[#4a7c59] hover:underline">← Back to Knowledge Hub</Link>
        </div>
      </Shell>
    );
  }

  const { topic, subtopics, articles } = data;

  // Group articles by knowledge level
  const quick = articles.filter(a => a.knowledgeLevel === "quick" || a.contentType === "60-second");
  const professional = articles.filter(a => a.knowledgeLevel === "professional" && a.contentType !== "60-second");
  const advanced = articles.filter(a => a.knowledgeLevel === "advanced");

  const hasLayers = quick.length > 0 || professional.length > 0 || advanced.length > 0;

  return (
    <Shell>
      {/* Hero */}
      <div className="bg-[#1a2e1a] text-white pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-8 font-medium uppercase tracking-wider">
            <Link href="/knowledge" className="hover:text-white/80 transition-colors">Knowledge Hub</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">{topic.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className="p-3 bg-white/10 rounded-xl shrink-0">
              <Tag className="w-6 h-6 text-white/80" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">{topic.name}</h1>
              {topic.description && (
                <p className="text-lg text-white/70 leading-relaxed max-w-2xl">{topic.description}</p>
              )}
              <p className="text-sm text-white/40 mt-4">{articles.length} {articles.length === 1 ? "article" : "articles"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 max-w-6xl py-14">
        {/* Subtopics */}
        {subtopics.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3">Subtopics</h2>
            <div className="flex flex-wrap gap-2">
              {subtopics.map(sub => (
                <Link key={sub.id} href={`/knowledge/${sub.slug}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e8e8e4] rounded-full text-sm font-medium text-[#444] hover:border-[#4a7c59] hover:text-[#4a7c59] transition-colors">
                  {sub.name}
                  <ArrowRight className="w-3 h-3 opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-20 text-[#999]">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No articles in this topic yet.</p>
            <Link href="/knowledge" className="mt-3 inline-block text-sm text-[#4a7c59] hover:underline">Browse all knowledge →</Link>
          </div>
        ) : hasLayers ? (
          <div className="space-y-16">
            {/* Quick Knowledge */}
            {quick.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <Zap className="w-4 h-4 text-amber-600" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#1a1a1a]">60-Second Knowledge</h2>
                    <p className="text-xs text-[#888]">Essential facts, fast</p>
                  </div>
                  <span className="ml-auto text-xs text-[#bbb]">{quick.length} articles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quick.map(a => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}

            {/* Professional */}
            {professional.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#1a1a1a]">Professional Knowledge</h2>
                    <p className="text-xs text-[#888]">Applied expertise for practitioners</p>
                  </div>
                  <span className="ml-auto text-xs text-[#bbb]">{professional.length} articles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {professional.map(a => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}

            {/* Advanced / Technical */}
            {advanced.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#1a1a1a]">Technical Knowledge</h2>
                    <p className="text-xs text-[#888]">Deep technical expertise</p>
                  </div>
                  <span className="ml-auto text-xs text-[#bbb]">{advanced.length} articles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {advanced.map(a => <ArticleCard key={a.id} article={a} />)}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </div>
    </Shell>
  );
}
