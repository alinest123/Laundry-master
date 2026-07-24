import { Shell } from "@/components/layout/Shell";
import { useRoute, Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCategoryDetail, getGetCategoryDetailQueryKey } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/articles/ArticleCard";

export function CategoryDetail() {
  const [, params] = useRoute("/categories/:slug");
  const slug = params?.slug || "";

  const { data: categoryData, isLoading } = useGetCategoryDetail(slug, {
    query: { enabled: !!slug, queryKey: getGetCategoryDetailQueryKey(slug) }
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-20 animate-pulse">
          <div className="h-40 bg-muted w-full mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted"></div>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (!categoryData?.category) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Category Not Found</h1>
          <Button asChild>
            <Link href="/categories">View All Categories</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const { category, articles, total } = categoryData;

  return (
    <Shell>
      {/* Category Header */}
      <div className="bg-primary text-white py-16 relative overflow-hidden">
        {category.featuredImage && (
          <div className="absolute inset-0 z-0">
            <img src={category.featuredImage} alt={category.name} className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
          </div>
        )}
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-accent/80 text-sm mb-6 font-bold uppercase tracking-wider">
              <Link href="/">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/categories">Categories</Link>
              <ChevronRight className="w-4 h-4" />
              <span>{category.name}</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">{category.name}</h1>
            {category.description && (
              <p className="text-xl text-white/80 font-light leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subcategories (if any) */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="bg-muted/30 border-b border-border py-6">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Sub-disciplines:</span>
              {category.subcategories.map(sub => (
                <Link key={sub.id} href={`/categories/${sub.slug}`} className="text-sm bg-background border border-border px-4 py-1.5 hover:border-secondary hover:text-secondary transition-colors">
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-border">
          <h2 className="text-2xl font-serif font-bold text-primary">Research & Articles</h2>
          <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
            {total} Results
          </div>
        </div>

        {articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/30 border border-border">
            <p className="text-lg text-muted-foreground mb-4">No articles have been published in this category yet.</p>
            <Button asChild variant="outline">
              <Link href="/articles">Browse all articles</Link>
            </Button>
          </div>
        )}
      </div>
    </Shell>
  );
}
