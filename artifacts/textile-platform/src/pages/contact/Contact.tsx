import { Shell } from "@/components/layout/Shell";
import { Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePageContent } from "@/lib/usePageContent";

export function Contact() {
  const { c } = usePageContent("contact");

  // Render address lines (supports \n separator saved from admin textarea)
  const addressLines = c(
    "address",
    "100 Science Parkway, Suite 400\nBoston, MA 02110\nUnited States"
  ).split("\n");

  const generalEmail = c("general_email", "info@textilescience.org");
  const editorialEmail = c("editorial_email", "editorial@textilescience.org");

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-8 py-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-6">
              {c("heading", "Contact Us")}
            </h1>
            <p className="text-xl text-muted-foreground font-light mb-10 leading-relaxed">
              {c("subheading", "Whether you are looking to contribute research, inquire about corporate access, or need support with an existing consultation.")}
            </p>

            <div className="space-y-8 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">General Inquiries</h3>
                  <a href={`mailto:${generalEmail}`} className="text-secondary hover:underline">{generalEmail}</a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">Editorial Submissions</h3>
                  <a href={`mailto:${editorialEmail}`} className="text-secondary hover:underline">{editorialEmail}</a>
                  <p className="text-sm text-muted-foreground mt-1">Please review our editorial guidelines before submitting.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-primary mb-1">Headquarters</h3>
                  <p className="text-muted-foreground">
                    {addressLines.map((line, i) => (
                      <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border border-border p-5 md:p-10">
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">
              {c("form_heading", "Send a Message")}
            </h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary">First Name</label>
                  <Input placeholder="Jane" className="bg-background border-border h-12" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-primary">Last Name</label>
                  <Input placeholder="Smith" className="bg-background border-border h-12" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-primary">Email Address</label>
                <Input type="email" placeholder="jane@example.com" className="bg-background border-border h-12" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-primary">Inquiry Type</label>
                <select className="flex h-12 w-full border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>General Support</option>
                  <option>Corporate Accounts</option>
                  <option>Expert Application</option>
                  <option>Editorial Submission</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-primary">Message</label>
                <Textarea placeholder="How can we help you?" className="min-h-[150px] bg-background border-border" />
              </div>

              <Button type="submit" size="lg" className="w-full">
                Submit Message
              </Button>
            </form>
          </div>

        </div>
      </div>
    </Shell>
  );
}
