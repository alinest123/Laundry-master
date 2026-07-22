import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { useGetKnowledgeHub } from "@workspace/api-client-react";
import { BookOpen, FileText, FlaskConical, Map, ArrowRight } from "lucide-react";

export function KnowledgeHub() {
  const { data: hubData, isLoading } = useGetKnowledgeHub();

  const sections = [
    {
      id: "guides",
      title: "Technical Guides",
      description: "Comprehensive, step-by-step documentation on core textile care processes.",
      icon: <BookOpen className="w-8 h-8 text-secondary" />,
      items: hubData?.guides || []
    },
    {
      id: "research",
      title: "Scientific Research",
      description: "Peer-reviewed studies, chemical analyses, and fabric performance data.",
      icon: <FlaskConical className="w-8 h-8 text-secondary" />,
      items: hubData?.research || []
    },
    {
      id: "case-studies",
      title: "Case Studies",
      description: "Real-world application of science in commercial operations.",
      icon: <FileText className="w-8 h-8 text-secondary" />,
      items: hubData?.caseStudies || []
    },
    {
      id: "learning-paths",
      title: "Learning Paths",
      description: "Structured curriculums designed to take you from fundamentals to mastery.",
      icon: <Map className="w-8 h-8 text-secondary" />,
      items: hubData?.learningPaths || []
    }
  ];

  return (
    <Shell>
      <div className="bg-primary text-white py-20">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">The Knowledge Hub</h1>
          <p className="text-xl text-white/80 font-light leading-relaxed">
            The central repository for all professional guides, research papers, and structured learning resources.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-20">
        {isLoading ? (
          <div className="space-y-16">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted w-48 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-32 bg-muted"></div>
                  <div className="h-32 bg-muted"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-24">
            {sections.map(section => (
              <section key={section.id}>
                <div className="flex items-start gap-6 mb-10 pb-4 border-b border-border">
                  <div className="bg-muted p-4">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-primary mb-2">{section.title}</h2>
                    <p className="text-muted-foreground text-lg">{section.description}</p>
                  </div>
                </div>

                {section.items && section.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.items.map(item => (
                      <Link 
                        key={item.slug} 
                        href={`/articles?category=${item.slug}`}
                        className="group bg-background border border-border p-8 hover:border-secondary transition-all flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{item.title}</h3>
                          <p className="text-muted-foreground text-sm mb-6">{item.description}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <span className="text-xs font-bold text-primary uppercase tracking-widest">
                            {item.count} Resources
                          </span>
                          <span className="text-secondary group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-muted/30 border border-border text-center text-muted-foreground">
                    Resources in this section are currently being updated.
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
