import { Shell } from "@/components/layout/Shell";
import { useRoute, Link } from "wouter";
import { ChevronRight, Clock, User, Share2, BookmarkPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";
import { ArticleCard } from "@/components/articles/ArticleCard";

export function ArticleDetail() {
  const [, params] = useRoute("/articles/:slug");
  const slug = params?.slug || "";

  const { data: article, isLoading } = useGetArticle(slug, {
    query: { enabled: !!slug, queryKey: getGetArticleQueryKey(slug) }
  });

  if (isLoading) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-20 animate-pulse">
          <div className="h-8 bg-muted w-32 mb-8"></div>
          <div className="h-16 bg-muted w-3/4 mb-6"></div>
          <div className="h-6 bg-muted w-1/2 mb-12"></div>
          <div className="aspect-[21/9] bg-muted w-full mb-12"></div>
        </div>
      </Shell>
    );
  }

  if (!article) {
    return (
      <Shell>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Article Not Found</h1>
          <Button asChild>
            <Link href="/articles">Back to Knowledge Hub</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <article className="bg-background">
        {/* Header */}
        <header className="pt-16 pb-12 border-b border-border">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider mb-8">
              <Link href="/articles" className="hover:text-primary transition-colors">Knowledge Hub</Link>
              <ChevronRight className="w-3 h-3" />
              {article.categories?.[0] && (
                <>
                  <Link href={`/categories/${article.categories[0].slug}`} className="hover:text-primary transition-colors">
                    {article.categories[0].name}
                  </Link>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-primary truncate">Article</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary leading-[1.1] mb-6">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed mb-10">
                {article.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-border">
              <div className="flex items-center gap-4">
                {article.author?.avatar ? (
                  <img src={article.author.avatar} alt={article.author.name} className="w-12 h-12 grayscale" />
                ) : (
                  <div className="w-12 h-12 bg-secondary/10 flex items-center justify-center text-secondary">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-primary">{article.author?.name}</div>
                  <div className="text-sm text-muted-foreground">{article.author?.role}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-widest text-xs font-bold">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <BookmarkPlus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
            <img 
              src={article.featuredImage} 
              alt={article.title} 
              className="w-full aspect-[21/9] object-cover bg-muted"
            />
          </div>
        )}

        {/* Content & Sidebar */}
        <div className="container mx-auto px-4 md:px-8 max-w-6xl py-12">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Table of Contents - Sticky Sidebar */}
            <aside className="lg:w-1/4 order-2 lg:order-1">
              <div className="sticky top-24">
                <h3 className="font-serif font-bold text-lg mb-6 text-primary border-b border-border pb-2">Contents</h3>
                {article.tableOfContents && article.tableOfContents.length > 0 ? (
                  <ul className="space-y-3">
                    {article.tableOfContents.map((item) => (
                      <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
                        <a href={`#${item.id}`} className="text-sm text-muted-foreground hover:text-secondary transition-colors block">
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No index available.</p>
                )}
                
                <div className="mt-12 bg-muted/30 p-6 border border-border">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-primary mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags?.map(tag => (
                      <span key={tag.id} className="text-xs bg-white px-2 py-1 text-muted-foreground border border-border">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:w-3/4 order-1 lg:order-2">
              <div 
                className="prose prose-lg prose-slate max-w-none 
                           prose-headings:font-serif prose-headings:text-primary prose-headings:font-bold
                           prose-a:text-secondary prose-a:no-underline hover:prose-a:underline
                           prose-img:bg-muted"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              
              {/* Author Bio Box */}
              <div className="mt-20 p-8 bg-muted/30 border border-border flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {article.author?.avatar ? (
                  <img src={article.author.avatar} alt={article.author.name} className="w-24 h-24 grayscale" />
                ) : (
                  <div className="w-24 h-24 bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <User className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <h3 className="font-serif font-bold text-xl text-primary mb-1">Written by {article.author?.name}</h3>
                  <p className="text-sm text-secondary font-bold mb-3">{article.author?.role}</p>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {article.author?.bio || "Expert contributor to The Science of Professional Textile Care."}
                  </p>
                  <Button variant="link" className="p-0 h-auto text-primary" asChild>
                    <Link href={`/search?q=${article.author?.name}`}>View all {article.author?.articleCount} articles →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="bg-muted/30 py-20 border-t border-border mt-12">
            <div className="container mx-auto px-4 md:px-8">
              <h2 className="text-3xl font-serif font-bold text-primary mb-10 text-center">Related Research</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {article.relatedArticles.map(related => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </Shell>
  );
}
