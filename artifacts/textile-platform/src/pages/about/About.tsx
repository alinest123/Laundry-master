import { Shell } from "@/components/layout/Shell";
import { BookOpen, Users, Globe, ShieldCheck } from "lucide-react";
import aboutHero from "@assets/generated_images/about_hero.jpg";
import { usePageContent } from "@/lib/usePageContent";

export function About() {
  const { c } = usePageContent("about");

  return (
    <Shell>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={aboutHero} alt="Institution facade" className="w-full h-full object-cover opacity-40 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 mb-8 text-sm font-medium tracking-wide">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>{c("hero_badge", "INDEPENDENT AUTHORITY")}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6">
              {c("hero_headline", "Advancing the Science of Textile Care")}
            </h1>
            
            <p className="text-xl text-white/80 font-light leading-relaxed">
              {c("hero_subheadline", "We are an independent, science-first institution dedicated to standardizing and elevating the global practices of commercial laundry, dry cleaning, and fabric science.")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-6">
                {c("mission_heading", "Our Mission")}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {c("mission_body1", "For too long, the professional textile care industry has relied on anecdotal knowledge passed down through generations. Our mission is to replace guesswork with empirical science.")}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {c("mission_body2", "By aggregating rigorous research, standardizing operational procedures, and providing direct access to leading experts, we empower facilities worldwide to improve quality, efficiency, and sustainability.")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-muted p-5 sm:p-8 text-center border border-border rounded-xl">
                <BookOpen className="w-8 h-8 mx-auto text-secondary mb-4" />
                <div className="text-3xl font-serif font-bold text-primary mb-2">{c("stat1_value", "500+")}</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{c("stat1_label", "Research Papers")}</div>
              </div>
              <div className="bg-muted p-5 sm:p-8 text-center border border-border rounded-xl sm:mt-8">
                <Users className="w-8 h-8 mx-auto text-secondary mb-4" />
                <div className="text-3xl font-serif font-bold text-primary mb-2">{c("stat2_value", "25")}</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{c("stat2_label", "Global Experts")}</div>
              </div>
              <div className="bg-muted p-5 sm:p-8 text-center border border-border rounded-xl">
                <Globe className="w-8 h-8 mx-auto text-secondary mb-4" />
                <div className="text-3xl font-serif font-bold text-primary mb-2">{c("stat3_value", "40")}</div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">{c("stat3_label", "Countries Reached")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Standards */}
      <section className="py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
          <h2 className="text-3xl font-serif font-bold text-primary mb-6">
            {c("editorial_heading", "Our Editorial Standards")}
          </h2>
          <p className="text-xl text-muted-foreground font-light mb-16 leading-relaxed">
            {c("editorial_body", "Every piece of content published on our platform undergoes rigorous peer review by active industry professionals and scientists. We do not accept sponsored content, native advertising, or paid endorsements of chemical products or machinery. Our allegiance is strictly to the science and to our readers.")}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-background p-8 border border-border rounded-xl">
              <h3 className="font-serif font-bold text-xl text-primary mb-4">{c("editorial_card1_title", "Empirical Focus")}</h3>
              <p className="text-muted-foreground text-sm">{c("editorial_card1_body", "We prioritize data, chemical analysis, and measured outcomes over anecdotal claims.")}</p>
            </div>
            <div className="bg-background p-8 border border-border rounded-xl">
              <h3 className="font-serif font-bold text-xl text-primary mb-4">{c("editorial_card2_title", "Independence")}</h3>
              <p className="text-muted-foreground text-sm">{c("editorial_card2_body", "We operate independently of any chemical manufacturer or equipment brand.")}</p>
            </div>
            <div className="bg-background p-8 border border-border rounded-xl">
              <h3 className="font-serif font-bold text-xl text-primary mb-4">{c("editorial_card3_title", "Practicality")}</h3>
              <p className="text-muted-foreground text-sm">{c("editorial_card3_body", "Our scientific insights must translate into actionable procedures for plant operations.")}</p>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
