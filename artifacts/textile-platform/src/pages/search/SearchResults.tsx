import { Shell } from "@/components/layout/Shell";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Search as SearchIcon, FileText, Folder, BookOpen, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchContent } from "@workspace/api-client-react";

export function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<"all" | "articles" | "categories" | "guides">("all");

  const { data: searchResults, isLoading } = useSearchContent(
    { q: query, type: activeType },
    { query: { enabled: query.length > 2, queryKey: ['search', query, activeType] } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL without full page reload is normally done, but we'll let useSearchContent react to state
  };

  return (
    <Shell>
      <div className="bg-muted/30 border-b border-border py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-8">Search the Platform</h1>
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for articles, guides, experts..." 
                className="pl-12 h-14 text-base bg-background border-primary/20 focus-visible:ring-primary" 
              />
            </div>
            <Button type="submit" className="h-14 w-full sm:w-auto px-8 text-base font-bold bg-primary hover:bg-primary/90 text-white">
              Search
            </Button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            <Button 
              variant={activeType === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveType("all")}
              className={activeType === "all" ? "bg-secondary hover:bg-secondary/90" : ""}
            >
              All Results
            </Button>
            <Button 
              variant={activeType === "articles" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveType("articles")}
              className={activeType === "articles" ? "bg-secondary hover:bg-secondary/90" : ""}
            >
              Articles
            </Button>
            <Button 
              variant={activeType === "categories" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveType("categories")}
              className={activeType === "categories" ? "bg-secondary hover:bg-secondary/90" : ""}
            >
              Categories
            </Button>
            <Button 
              variant={activeType === "guides" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveType("guides")}
              className={activeType === "guides" ? "bg-secondary hover:bg-secondary/90" : ""}
            >
              Technical Guides
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">
        {query.length <= 2 ? (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl text-muted-foreground">Enter a search term to begin.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : searchResults?.results && searchResults.results.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-primary mb-8 pb-4 border-b border-border">
              {searchResults.total} results found for "{query}"
            </h2>
            <div className="space-y-6">
              {searchResults.results.map((result) => {
                const isArticle = result.type === 'articles';
                const isCategory = result.type === 'categories';
                const href = isArticle ? `/articles/${result.slug}` : `/categories/${result.slug}`;
                
                return (
                  <Link 
                    key={`${result.type}-${result.id}`} 
                    href={href}
                    className="group block bg-background border border-border rounded-xl p-6 hover:border-secondary transition-colors"
                  >
                    <div className="flex items-start gap-6">
                      <div className="bg-muted p-3 hidden sm:block">
                        {isArticle ? <FileText className="w-6 h-6 text-muted-foreground" /> : 
                         isCategory ? <Folder className="w-6 h-6 text-muted-foreground" /> : 
                         <BookOpen className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5">
                            {result.type}
                          </span>
                        </div>
                        <h3 className="text-base md:text-xl font-serif font-bold text-primary mb-2 group-hover:text-secondary transition-colors">
                          {result.title}
                        </h3>
                        {result.excerpt && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {result.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="hidden md:flex items-center justify-center pt-4">
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 border border-border rounded-xl">
            <p className="text-xl text-primary font-bold mb-2">No results found</p>
            <p className="text-muted-foreground">We couldn't find any matches for "{query}". Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
