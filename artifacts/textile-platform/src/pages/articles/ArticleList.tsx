import { Shell } from "@/components/layout/Shell";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Search, Filter, ChevronRight, BookOpen } from "lucide-react";
import { 
  useListArticles, 
  useListCategories,
  useListTags 
} from "@workspace/api-client-react";

export function ArticleList() {
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  
  const { data: articleData, isLoading } = useListArticles({ 
    page, 
    limit: 12, 
    category: activeCategory 
  });
  
  const { data: categories } = useListCategories();
  const { data: tags } = useListTags();

  return (
    <Shell>
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-accent/80 text-sm mb-6 font-bold uppercase tracking-wider">
              <Link href="/">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <span>Knowledge Hub</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Knowledge Hub</h1>
            <p className="text-xl text-white/80 font-light">
              The world's most comprehensive library of textile care science, research, and technical guides.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="lg:w-1/4 flex-shrink-0">
            <div className="sticky top-24 space-y-10">
              <div>
                <h3 className="font-serif font-bold text-lg mb-4 text-primary border-b border-border pb-2">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search articles..." className="pl-9 bg-muted/50" />
                </div>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg mb-4 text-primary border-b border-border pb-2">Categories</h3>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => { setActiveCategory(undefined); setPage(1); }}
                      className={`text-sm w-full text-left transition-colors ${!activeCategory ? "text-secondary font-bold" : "text-muted-foreground hover:text-primary"}`}
                    >
                      All Categories
                    </button>
                  </li>
                  {categories?.map(category => (
                    <li key={category.id}>
                      <button 
                        onClick={() => { setActiveCategory(category.slug); setPage(1); }}
                        className={`text-sm w-full flex items-center justify-between transition-colors ${activeCategory === category.slug ? "text-secondary font-bold" : "text-muted-foreground hover:text-primary"}`}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 text-muted-foreground font-normal">{category.articleCount}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-serif font-bold text-lg mb-4 text-primary border-b border-border pb-2">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags?.slice(0, 15).map(tag => (
                    <span key={tag.id} className="text-xs border border-border px-3 py-1 text-muted-foreground hover:border-secondary hover:text-secondary cursor-pointer transition-colors">
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/50 p-6 border border-border">
                <BookOpen className="w-8 h-8 text-secondary mb-4" />
                <h4 className="font-serif font-bold text-primary mb-2">Technical Guides</h4>
                <p className="text-sm text-muted-foreground mb-4">Deep dive into specific topics with our comprehensive long-form guides.</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/knowledge">Browse Guides</Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-primary">
                {activeCategory ? categories?.find(c => c.slug === activeCategory)?.name : "Latest Publications"}
              </h2>
              <div className="text-sm text-muted-foreground">
                Showing {articleData?.articles?.length || 0} of {articleData?.total || 0} results
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted aspect-[4/3]"></div>
                ))}
              </div>
            ) : articleData?.articles && articleData.articles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {articleData.articles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                
                {/* Pagination */}
                {articleData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8 border-t border-border">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground px-4">
                      Page {page} of {articleData.totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.min(articleData.totalPages, p + 1))}
                      disabled={page === articleData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-muted/30 border border-border">
                <p className="text-lg text-muted-foreground">No articles found matching your criteria.</p>
                <Button variant="link" onClick={() => setActiveCategory(undefined)} className="mt-4">
                  Clear filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </Shell>
  );
}
