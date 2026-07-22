import { Link } from "wouter";
import { Clock, User } from "lucide-react";
import { ArticleSummary } from "@workspace/api-client-react";

interface ArticleCardProps {
  article: ArticleSummary;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const isDarkImage = featured; // Feature cards might have a dark overlay
  const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' }) : "";
  
  if (featured) {
    return (
      <Link href={`/articles/${article.slug}`} className="group relative block h-[400px] overflow-hidden bg-muted">
        {article.featuredImage ? (
          <img 
            src={article.featuredImage} 
            alt={article.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary w-full h-full transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
          <div className="flex gap-2 mb-4 flex-wrap">
            {article.categories?.slice(0, 2).map(cat => (
              <span key={cat.id} className="text-[10px] uppercase tracking-wider font-bold bg-white/20 backdrop-blur-sm px-2 py-1">
                {cat.name}
              </span>
            ))}
          </div>
          <h3 className="font-serif text-3xl font-bold mb-3 leading-tight group-hover:text-accent transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-white/80 line-clamp-2 mb-6 max-w-2xl">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-white/70 font-medium">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.readingTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full bg-card hover:bg-accent/30 transition-colors border border-border/50">
      {article.featuredImage ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted relative">
          <img 
            src={article.featuredImage} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] overflow-hidden bg-secondary/10 relative flex items-center justify-center">
          <span className="font-serif text-2xl text-muted-foreground/30 font-bold">TSPTC</span>
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold text-secondary uppercase tracking-wider">
          {article.categories?.[0]?.name || "Article"}
          <span className="text-muted-foreground font-normal tracking-normal mx-1">•</span>
          <span className="text-muted-foreground font-normal tracking-normal">{date}</span>
        </div>
        <h3 className="font-serif text-xl font-bold mb-3 leading-snug group-hover:text-secondary transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-6 flex-1">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            {article.author?.avatar ? (
              <img src={article.author.avatar} alt={article.author.name} className="w-6 h-6 rounded-none grayscale" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>{article.author?.name}</span>
          </div>
          <span>{article.readingTime} min</span>
        </div>
      </div>
    </Link>
  );
}
