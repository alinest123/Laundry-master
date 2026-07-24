import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { useListCategories } from "@workspace/api-client-react";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

import cat1 from "@assets/generated_images/category_laundry.jpg";
import cat2 from "@assets/generated_images/category_drycleaning.jpg";
import cat3 from "@assets/generated_images/category_fabric.jpg";
import cat4 from "@assets/generated_images/category_stains.jpg";
import cat5 from "@assets/generated_images/category_sustainability.jpg";

const staticImages = [cat1, cat2, cat3, cat4, cat5];

export function CategoryList() {
  const { data: categories, isLoading } = useListCategories();

  // Group categories into parent/child if needed, or just display flat
  const topLevel = categories?.filter(c => !c.parentId) || [];

  return (
    <Shell>
      <div className="bg-primary text-white py-20 border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <Layers className="w-12 h-12 mx-auto text-accent mb-6" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Disciplines & Categories</h1>
          <p className="text-xl text-white/80 font-light">
            Navigate our comprehensive library by specific scientific and operational disciplines.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse border border-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topLevel.map((category, index) => {
              const image = staticImages[index % staticImages.length];
              return (
                <Link key={category.id} href={`/categories/${category.slug}`} className="group flex flex-col bg-background border border-border hover:border-secondary transition-colors h-full">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img 
                      src={category.featuredImage || image} 
                      alt={category.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                  <div className="p-5 md:p-8 flex flex-col flex-1">
                    <h2 className="text-2xl font-serif font-bold text-primary mb-4 group-hover:text-secondary transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-8 flex-1 leading-relaxed">
                      {category.description || `Explore our comprehensive research, guides, and articles focusing on the science and practice of ${category.name.toLowerCase()}.`}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest bg-muted px-3 py-1">
                        {category.articleCount} Articles
                      </span>
                      <span className="text-secondary group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-24 text-center">
          <div className="inline-flex flex-col items-center justify-center p-10 bg-muted/30 border border-border max-w-2xl mx-auto">
            <BookOpen className="w-10 h-10 text-secondary mb-4" />
            <h3 className="text-2xl font-serif font-bold text-primary mb-3">Looking for specific answers?</h3>
            <p className="text-muted-foreground mb-6">Our entire knowledge base is fully searchable.</p>
            <Button asChild>
              <Link href="/search">Search the Knowledge Hub</Link>
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
