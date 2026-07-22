import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { useListServices, useListExperts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Star, Clock, User, CheckCircle2, ChevronRight, Microscope } from "lucide-react";

import expert1 from "@assets/generated_images/expert_1.jpg";
import expert2 from "@assets/generated_images/expert_2.jpg";
import expert3 from "@assets/generated_images/expert_3.jpg";

export function ConsultationsList() {
  const { data: services, isLoading: isLoadingServices } = useListServices();
  const { data: experts, isLoading: isLoadingExperts } = useListExperts();

  const expertImages = [expert1, expert2, expert3];

  return (
    <Shell>
      {/* Hero */}
      <section className="bg-primary text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMCAzMGg0ME0xMCAwdjQwTTMwIDB2NDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')] mix-blend-overlay"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Expert Consultations</h1>
            <p className="text-xl text-white/80 font-light leading-relaxed mb-10">
              Access the world's leading minds in textile science, commercial laundry operations, and fabric care. Direct 1-on-1 guidance for your most complex challenges.
            </p>
            <Button size="lg" className="bg-accent text-primary hover:bg-white text-base font-bold h-14 px-10" asChild>
              <Link href="/consultations/book">Book a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Consultation Services</h2>
            <p className="text-muted-foreground text-lg">Targeted advisory sessions tailored to specific operational and scientific needs.</p>
          </div>

          {isLoadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.map(service => (
                <div key={service.id} className="bg-muted/30 border border-border p-8 flex flex-col hover:border-primary transition-colors">
                  <div className="w-12 h-12 bg-primary text-white flex items-center justify-center mb-6">
                    <Microscope className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-primary mb-3">{service.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6 flex-1">{service.description}</p>
                  
                  <div className="pt-6 border-t border-border flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <Clock className="w-4 h-4 text-secondary" />
                      {service.duration} mins
                    </div>
                    <div className="text-lg font-serif font-bold text-primary">
                      {service.currency === 'USD' ? '$' : service.currency}{service.price}
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full hover:bg-primary hover:text-white" asChild>
                    <Link href={`/consultations/book?service=${service.id}`}>Select Service</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">How It Works</h2>
            <p className="text-white/80 text-lg">A clinical, straightforward process to get the answers you need.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Select a Discipline</h3>
              <p className="text-white/70 text-sm">Choose the specific area of expertise you need, from chemical formulation to plant operations.</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">Choose an Expert</h3>
              <p className="text-white/70 text-sm">Review credentials and select an authority that matches your specific operational context.</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Secure Video Session</h3>
              <p className="text-white/70 text-sm">Meet via secure video link. Sessions are recorded and summary documentation is provided.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Experts */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Global Authorities</h2>
              <p className="text-muted-foreground text-lg">The scientists and operators leading the industry forward.</p>
            </div>
          </div>

          {isLoadingExperts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] bg-muted animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {experts?.map((expert, idx) => (
                <div key={expert.id} className="group border border-border hover:border-secondary transition-colors">
                  <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                    <img 
                      src={expert.avatar || expertImages[idx % expertImages.length]} 
                      alt={expert.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-80" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-serif font-bold mb-1">{expert.name}</h3>
                      <p className="text-secondary font-bold text-sm mb-4">{expert.title}</p>
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span>{expert.rating} Rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-accent" />
                          <span>{expert.sessionCount}+ Sessions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-background">
                    <div className="mb-4">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Specializations</div>
                      <div className="flex flex-wrap gap-2">
                        {expert.specializations?.slice(0, 3).map(spec => (
                          <span key={spec} className="text-xs bg-muted text-primary px-2 py-1">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="link" className="px-0 text-secondary hover:text-primary font-bold w-full justify-between" asChild>
                      <Link href={`/consultations/book?expert=${expert.id}`}>
                        Book with {expert.name.split(' ')[0]} <ChevronRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
