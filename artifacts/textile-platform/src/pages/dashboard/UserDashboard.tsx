import { Shell } from "@/components/layout/Shell";
import { useListAppointments } from "@workspace/api-client-react";
import { Calendar, Video, Clock, FileText, Bookmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UserDashboard() {
  const { data: appointments, isLoading } = useListAppointments();

  return (
    <Shell>
      <div className="bg-muted/30 border-b border-border py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-serif font-bold">
              JD
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary mb-1">Welcome back, John</h1>
              <p className="text-muted-foreground">Professional Member since 2023</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12">
        <Tabs defaultValue="consultations" className="w-full">
          <TabsList className="mb-8 w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent space-x-8">
            <TabsTrigger 
              value="consultations" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4 px-0 font-bold text-base"
            >
              Consultations
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4 px-0 font-bold text-base"
            >
              Saved Research
            </TabsTrigger>
            <TabsTrigger 
              value="downloads" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4 px-0 font-bold text-base"
            >
              Downloads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-primary">Upcoming Sessions</h2>
              <Button variant="outline" size="sm" asChild>
                <a href="/consultations/book">Book New Session</a>
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse"></div>
                ))}
              </div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-6">
                {appointments.map(apt => (
                  <div key={apt.id} className="bg-background border border-border p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex items-start gap-6">
                      <div className="bg-muted p-4 text-center min-w-[100px]">
                        <div className="text-sm font-bold text-primary uppercase">{new Date(apt.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}</div>
                        <div className="text-3xl font-serif font-bold text-primary">{new Date(apt.scheduledAt).getDate()}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${
                            apt.status === 'confirmed' ? 'bg-secondary/10 text-secondary' : 
                            apt.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-lg text-primary mb-1">{apt.service.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">with {apt.expert.name}</p>
                        <div className="flex items-center gap-4 text-sm font-medium text-primary">
                          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {apt.service.duration} mins</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto">
                      {apt.status === 'confirmed' && apt.zoomLink ? (
                        <Button className="w-full md:w-auto bg-primary text-white gap-2" asChild>
                          <a href={apt.zoomLink} target="_blank" rel="noopener noreferrer">
                            <Video className="w-4 h-4" /> Join Video Call
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full md:w-auto" disabled>
                          Awaiting Link
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-primary font-bold mb-2">No upcoming consultations</p>
                <p className="text-muted-foreground mb-6">Schedule a 1-on-1 session with our industry experts.</p>
                <Button asChild>
                  <a href="/consultations/book">Browse Experts</a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <div className="text-center py-16 bg-muted/30 border border-border mt-6">
              <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-primary font-bold mb-2">No saved research</p>
              <p className="text-muted-foreground mb-6">Articles and guides you bookmark will appear here.</p>
              <Button variant="outline" asChild>
                <a href="/articles">Explore Knowledge Hub</a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="downloads">
            <div className="text-center py-16 bg-muted/30 border border-border mt-6">
              <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-primary font-bold mb-2">No downloads yet</p>
              <p className="text-muted-foreground mb-6">Technical sheets and PDFs from consultations will appear here.</p>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </Shell>
  );
}
