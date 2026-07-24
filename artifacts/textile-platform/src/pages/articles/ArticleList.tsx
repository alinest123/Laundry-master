import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useListArticles } from "@workspace/api-client-react";
import { getArticleImage } from "@/lib/articleImages";
import type { ArticleSummary } from "@workspace/api-client-react";

/* ── Blog-standard article row in main column ──────────────────────────────── */
function BlogPostItem({ article }: { article: ArticleSummary }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const category = article.categories?.[0]?.name ?? "Article";
  const imageUrl = article.featuredImage || getArticleImage(article.id);

  return (
    <article className="pb-10 mb-10 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
      {/* Image */}
      <Link href={`/articles/${article.slug}`} className="block overflow-hidden group mb-5">
        <img
          src={imageUrl}
          alt={article.title}
          className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-105 bg-gray-100"
        />
      </Link>

      {/* Meta */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
        {category} / {date}
      </p>

      {/* Title */}
      <h2 className="font-serif text-[1.55rem] font-bold text-gray-900 leading-snug mb-3">
        <Link
          href={`/articles/${article.slug}`}
          className="hover:text-primary transition-colors"
        >
          {article.title}
        </Link>
      </h2>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">
          {article.excerpt}
        </p>
      )}

      {/* Read more */}
      <Link
        href={`/articles/${article.slug}`}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-800 border-b border-gray-800 pb-px hover:text-primary hover:border-primary transition-colors"
      >
        — Read More
      </Link>
    </article>
  );
}

/* ── Sidebar: compact recent-post thumbnail row ─────────────────────────────── */
function RecentPostItem({ article }: { article: ArticleSummary }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const imageUrl = article.featuredImage || getArticleImage(article.id);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="flex gap-3 group mb-4 last:mb-0"
    >
      <img
        src={imageUrl}
        alt={article.title}
        className="w-[68px] h-[68px] object-cover shrink-0 bg-gray-100"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
          {article.title}
        </h4>
        <p className="text-[11px] text-gray-400">{date}</p>
      </div>
    </Link>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export function ArticleList() {
  const [page, setPage] = useState(1);
  const LIMIT = 5;

  const { data: articleData, isLoading } = useListArticles({ page, limit: LIMIT });
  const { data: recentData } = useListArticles({ page: 1, limit: 4 });

  const totalPages = articleData?.totalPages ?? 1;

  return (
    <Shell>
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 py-10 md:py-14 text-center">
        <nav className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-5">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600">Articles</span>
        </nav>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Knowledge Hub
        </h1>
        {/* decorative separator */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="block w-10 h-px bg-gray-300" />
          <span className="block w-[6px] h-[6px] rotate-45 bg-gray-400" />
          <span className="block w-10 h-px bg-gray-300" />
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="bg-[#f7f7f7] min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-14 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">

            {/* ── Main column ── */}
            <main className="w-full lg:w-[64%]">
              {isLoading ? (
                <div className="space-y-10">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse pb-10 border-b border-gray-200">
                      <div className="w-full aspect-[16/9] bg-gray-200 mb-5" />
                      <div className="h-3 bg-gray-200 w-1/3 mb-3 rounded" />
                      <div className="h-7 bg-gray-200 w-3/4 mb-3 rounded" />
                      <div className="h-4 bg-gray-200 w-full mb-2 rounded" />
                      <div className="h-4 bg-gray-200 w-2/3 rounded" />
                    </div>
                  ))}
                </div>
              ) : articleData?.articles && articleData.articles.length > 0 ? (
                <>
                  {articleData.articles.map((article) => (
                    <BlogPostItem key={article.id} article={article} />
                  ))}

                  {/* ── Numbered pagination ── */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 pt-8 mt-4">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(
                        (n) => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`w-10 h-10 text-sm font-semibold border transition-colors ${
                              n === page
                                ? "bg-primary text-white border-primary"
                                : "bg-white border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                            }`}
                          >
                            {n}
                          </button>
                        )
                      )}

                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="w-10 h-10 flex items-center justify-center border border-gray-300 bg-white text-gray-600 disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500">No articles found.</p>
                </div>
              )}
            </main>

            {/* ── Sidebar ── */}
            <aside className="w-full lg:w-[36%] space-y-8">
              {/* Search */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="font-serif font-bold text-lg text-gray-900 mb-4 pb-3 border-b border-gray-100">
                  Search
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search articles..."
                    className="pl-9 bg-gray-50 border-gray-200 text-sm focus:bg-white"
                  />
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="font-serif font-bold text-lg text-gray-900 mb-5 pb-3 border-b border-gray-100">
                  Recent Posts
                </h3>
                {recentData?.articles?.map((article) => (
                  <RecentPostItem key={article.id} article={article} />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Shell>
  );
}
