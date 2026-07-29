import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { BookOpen, FileText, FlaskConical, Zap, ArrowRight, Filter, Clock, ChevronDown, Tag } from "lucide-react";
import { usePageContent } from "@/lib/usePageContent";
import { apiGet } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type Article = {
  id: number; title: string; slug: string; excerpt?: string;
  readingTime: number; contentType: string; knowledgeLevel: string;
  difficulty?: string; expertReviewStatus: string; featuredImage?: string;
};

type Topic = { id: number; name: string; slug: string; parentId?: number; articleCount: number };
type LearningPathItem = { title: string; slug: string; description: string; count: number };

type HubData = {
  articles: Article[];
  topics: Topic[];
  learningPaths: LearningPathItem[];
  totalItems: number;
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  "60-second":            "60-Second",
  "professional-article": "Professional Article",
  "editorial":            "Editorial",
  "practical-guide":      "Practical Guide",
  "technical-article":    "Technical Article",
  "research-paper":       "Research Paper",
  "white-paper":          "White Paper",
  "case-study":           "Case Study",
  "best-practice-guide":  "Best Practice",
  "sop":                  "SOP",
  "technical-reference":  "Technical Reference",
  "expert-interview":     "Expert Interview",
  "industry-heritage":    "Heritage",
  "professional-profile": "Profile",
};

const LEVEL_COLORS: Record<string, string> = {
  "quick":        "bg-yellow-100 text-yellow-800",
  "professional": "bg-blue-100 text-blue-800",
  "advanced":     "bg-purple-100 text-purple-800",
};

const REVIEW_BADGE: Record<string, string> = {
  "technically-verified": "✓ Verified",
  "expert-reviewed":      "✓ Expert Reviewed",
  "editorially-reviewed": "Reviewed",
  "not-reviewed":         "",
};

function ArticleCard({ article }: { article: Article }) {
  const is60s = article.contentType === "60-second";
  return (
    <Link href={`/articles/${article.slug}`}
      className="group block bg-white border border-[#eaeaea] rounded-xl overflow-hidden hover:border-[#4a7c59]/50 hover:shadow-sm transition-all">
      {article.featuredImage && !is60s && (
        <div className="aspect-[16/7] overflow-hidden bg-[#f8f8f6]">
          <img src={article.featuredImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {is60s && (
        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">60-Second Knowledge</span>
        </div>
      )}
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${LEVEL_COLORS[article.knowledgeLevel] ?? "bg-gray-100 text-gray-600"}`}>
            {article.knowledgeLevel === "quick" ? "Quick" : article.knowledgeLevel === "advanced" ? "Advanced" : "Professional"}
          </span>
          {article.difficulty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f0ee] text-[#555] uppercase tracking-wider font-medium">{article.difficulty}</span>
          )}
          {REVIEW_BADGE[article.expertReviewStatus] && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{REVIEW_BADGE[article.expertReviewStatus]}</span>
          )}
        </div>
        <h3 className="font-semibold text-[#1a1a1a] text-sm leading-snug mb-2 group-hover:text-[#4a7c59] transition-colors line-clamp-2">{article.title}</h3>
        {article.excerpt && <p className="text-xs text-[#666] line-clamp-2 mb-3">{article.excerpt}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#999] flex items-center gap-1"><Clock className="w-3 h-3" />{article.readingTime} min</span>
          <span className="text-xs text-[#bbb]">{CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType}</span>
        </div>
      </div>
    </Link>
  );
}

const CONTENT_TYPES = [
  { value: "", label: "All types" },
  { value: "60-second", label: "60-Second" },
  { value: "professional-article", label: "Professional Article" },
  { value: "practical-guide", label: "Practical Guide" },
  { value: "technical-article", label: "Technical Article" },
  { value: "research-paper", label: "Research Paper" },
  { value: "case-study", label: "Case Study" },
  { value: "best-practice-guide", label: "Best Practice" },
  { value: "sop", label: "SOP" },
];

const KNOWLEDGE_LEVELS = [
  { value: "", label: "All levels" },
  { value: "quick", label: "Quick (60-second)" },
  { value: "professional", label: "Professional" },
  { value: "advanced", label: "Advanced / Technical" },
];

const DIFFICULTIES = [
  { value: "", label: "Any difficulty" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export function KnowledgeHub() {
  const { c } = usePageContent("knowledge");
  const [contentType, setContentType] = useState("");
  const [knowledgeLevel, setKnowledgeLevel] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topicId, setTopicId] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams();
  if (contentType) params.set("contentType", contentType);
  if (knowledgeLevel) params.set("knowledgeLevel", knowledgeLevel);
  if (difficulty) params.set("difficulty", difficulty);
  if (topicId) params.set("topicId", topicId);
  const qs = params.toString();

  const { data, isLoading } = useQuery<HubData>({
    queryKey: ["knowledge-hub", qs],
    queryFn: () => apiGet(`/api/knowledge${qs ? `?${qs}` : ""}`),
  });

  const articles = data?.articles ?? [];
  const topics = (data?.topics ?? []).filter(t => !t.parentId && t.articleCount > 0);
  const learningPaths = data?.learningPaths ?? [];
  const activeFilters = [contentType, knowledgeLevel, difficulty, topicId].filter(Boolean).length;
  const selectedTopicName = topicId ? data?.topics.find(t => t.id.toString() === topicId)?.name : null;

  return (
    <Shell>
      {/* Hero */}
      <div className="bg-[#1a2e1a] text-white pt-20 pb-14">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-5">
            {c("hero_headline", "The Knowledge Hub")}
          </h1>
          <p className="text-xl text-white/75 font-light leading-relaxed mb-8">
            {c("hero_subheadline", "Professional knowledge and technical resources for textile care specialists.")}
          </p>
          {/* Three-layer journey entry points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
            <button onClick={() => { setKnowledgeLevel("quick"); setContentType("60-second"); }}
              className={`group p-4 rounded-xl border transition-all text-left ${knowledgeLevel === "quick" ? "bg-amber-500/20 border-amber-400" : "bg-white/5 border-white/15 hover:bg-white/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" fill="currentColor" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">60-Second</span>
              </div>
              <p className="text-white text-sm font-medium leading-snug">Essential facts, fast</p>
              <p className="text-white/50 text-xs mt-1">Quick knowledge cards</p>
            </button>
            <button onClick={() => { setKnowledgeLevel("professional"); setContentType(""); }}
              className={`group p-4 rounded-xl border transition-all text-left ${knowledgeLevel === "professional" && !contentType ? "bg-blue-500/20 border-blue-400" : "bg-white/5 border-white/15 hover:bg-white/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Professional</span>
              </div>
              <p className="text-white text-sm font-medium leading-snug">Applied expertise</p>
              <p className="text-white/50 text-xs mt-1">Guides, SOPs, case studies</p>
            </button>
            <button onClick={() => { setKnowledgeLevel("advanced"); setContentType(""); }}
              className={`group p-4 rounded-xl border transition-all text-left ${knowledgeLevel === "advanced" ? "bg-purple-500/20 border-purple-400" : "bg-white/5 border-white/15 hover:bg-white/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Technical</span>
              </div>
              <p className="text-white text-sm font-medium leading-snug">Deep technical mastery</p>
              <p className="text-white/50 text-xs mt-1">Research, white papers, specs</p>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Topics navigation */}
        {topics.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-3 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Browse by Topic</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTopicId("")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${!topicId ? "bg-[#4a7c59] text-white border-[#4a7c59]" : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#4a7c59]"}`}>
                All Topics
              </button>
              {topics.map(t => (
                <button key={t.id} onClick={() => setTopicId(topicId === t.id.toString() ? "" : t.id.toString())}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${topicId === t.id.toString() ? "bg-[#4a7c59] text-white border-[#4a7c59]" : "bg-white text-[#555] border-[#e0e0e0] hover:border-[#4a7c59]"}`}>
                  {t.name} <span className="opacity-60 text-xs ml-1">{t.articleCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {selectedTopicName && (
              <span className="text-sm font-semibold text-[#1a1a1a]">
                Topic: <span className="text-[#4a7c59]">{selectedTopicName}</span>
              </span>
            )}
            {activeFilters > 0 && !selectedTopicName && (
              <span className="text-sm text-[#666]">{articles.length} results</span>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${showFilters || activeFilters > 0 ? "bg-[#4a7c59]/10 border-[#4a7c59]/30 text-[#4a7c59]" : "bg-white border-[#eaeaea] text-[#555] hover:border-[#4a7c59]"}`}>
            <Filter className="w-3.5 h-3.5" />
            Filters {activeFilters > 0 && <span className="bg-[#4a7c59] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white border border-[#eaeaea] rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-1.5">Content Type</label>
              <select className="w-full text-sm border border-[#eaeaea] rounded-lg px-3 py-2 bg-white"
                value={contentType} onChange={e => setContentType(e.target.value)}>
                {CONTENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-1.5">Knowledge Level</label>
              <select className="w-full text-sm border border-[#eaeaea] rounded-lg px-3 py-2 bg-white"
                value={knowledgeLevel} onChange={e => setKnowledgeLevel(e.target.value)}>
                {KNOWLEDGE_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#999] uppercase tracking-wider mb-1.5">Difficulty</label>
              <select className="w-full text-sm border border-[#eaeaea] rounded-lg px-3 py-2 bg-white"
                value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {activeFilters > 0 && (
              <div className="sm:col-span-3 flex justify-end">
                <button onClick={() => { setContentType(""); setKnowledgeLevel(""); setDifficulty(""); setTopicId(""); }}
                  className="text-xs text-[#999] hover:text-red-500 transition-colors">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Article grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-[#eaeaea] rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[16/7] bg-[#f0f0ee]" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-[#f0f0ee] rounded w-3/4" />
                  <div className="h-3 bg-[#f0f0ee] rounded w-full" />
                  <div className="h-3 bg-[#f0f0ee] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-[#999]">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No resources found</p>
            {activeFilters > 0 && (
              <button onClick={() => { setContentType(""); setKnowledgeLevel(""); setDifficulty(""); setTopicId(""); }}
                className="mt-3 text-sm text-[#4a7c59] hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(a => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}

        {/* Learning paths section (shown when no filters active) */}
        {!activeFilters && learningPaths.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#f0f0ee]">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-6 h-6 text-[#4a7c59]" />
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#1a1a1a]">Learning Paths</h2>
                <p className="text-sm text-[#666]">Structured sequences from fundamentals to mastery</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {learningPaths.map(path => (
                <div key={path.slug} className="bg-white border border-[#eaeaea] rounded-xl p-6 hover:border-[#4a7c59]/40 hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-[#1a1a1a] mb-2">{path.title}</h3>
                  {path.description && <p className="text-sm text-[#666] mb-4">{path.description}</p>}
                  <div className="flex items-center justify-between text-xs text-[#999]">
                    <span>{path.count} articles</span>
                    <ArrowRight className="w-4 h-4 text-[#4a7c59]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
