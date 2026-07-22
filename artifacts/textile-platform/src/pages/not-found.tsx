import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Microscope } from "lucide-react";

export default function NotFound() {
  return (
    <Shell>
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-24 h-24 bg-muted text-secondary rounded-full flex items-center justify-center mb-8">
          <Microscope className="w-12 h-12" />
        </div>
        <h1 className="text-6xl font-serif font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-serif font-bold text-primary mb-6">Page Not Found</h2>
        <p className="text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
          The research paper, guide, or page you are looking for does not exist or has been moved to our archives.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/">Return to Homepage</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/search">Search Platform</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
