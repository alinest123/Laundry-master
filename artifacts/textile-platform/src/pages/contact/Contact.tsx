import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { PageSeo } from "@/components/seo/PageSeo";
import { Mail, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePageContent } from "@/lib/usePageContent";
import { apiPost } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  country: string;
  subject: string;
  message: string;
}

const EMPTY: ContactForm = {
  firstName: "", lastName: "", email: "",
  company: "", phone: "", country: "",
  subject: "General Support", message: "",
};

export function Contact() {
  const { c } = usePageContent("contact");
  const { toast } = useToast();
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const addressLines = c(
    "address",
    "100 Science Parkway, Suite 400\nBoston, MA 02110\nUnited States"
  ).split("\n");
  const generalEmail   = c("general_email",   "info@textilescience.org");
  const editorialEmail = c("editorial_email", "editorial@textilescience.org");

  const set = (k: keyof ContactForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = (): Partial<ContactForm> => {
    const e: Partial<ContactForm> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim())     e.email     = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim())   e.message   = "Required";
    else if (form.message.trim().length < 10) e.message = "Message is too short";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await apiPost("/api/contact", {
        name:    `${form.firstName.trim()} ${form.lastName.trim()}`,
        email:   form.email.trim(),
        company: form.company.trim() || undefined,
        phone:   form.phone.trim()   || undefined,
        country: form.country.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm(EMPTY);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message ?? "Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <PageSeo
        title="Contact"
        description={c("contact_description", "Get in touch with the Laundry Master team for editorial inquiries, expert contributions, or professional textile care questions.")}
      />
      <div className="container mx-auto px-4 md:px-8 py-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Left: contact info */}
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

          {/* Right: form */}
          <div className="bg-muted/30 border border-border rounded-xl p-5 md:p-10">
            <h2 className="text-2xl font-serif font-bold text-primary mb-6">
              {c("form_heading", "Send a Message")}
            </h2>

            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <CheckCircle className="w-14 h-14 text-[#4a7c59]" />
                <h3 className="text-xl font-serif font-bold text-primary">Message Sent</h3>
                <p className="text-muted-foreground max-w-xs leading-relaxed">
                  Thank you for reaching out. We've sent a confirmation to your email and
                  our team will be in touch shortly.
                </p>
                <Button variant="outline" className="mt-2" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-primary">First Name <span className="text-red-500">*</span></label>
                    <Input value={form.firstName} onChange={set("firstName")} placeholder="Jane"
                      className={`bg-background border-border h-12 ${errors.firstName ? "border-red-400" : ""}`} />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-primary">Last Name <span className="text-red-500">*</span></label>
                    <Input value={form.lastName} onChange={set("lastName")} placeholder="Smith"
                      className={`bg-background border-border h-12 ${errors.lastName ? "border-red-400" : ""}`} />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-primary">Email Address <span className="text-red-500">*</span></label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com"
                    className={`bg-background border-border h-12 ${errors.email ? "border-red-400" : ""}`} />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-primary">Company</label>
                    <Input value={form.company} onChange={set("company")} placeholder="Optional"
                      className="bg-background border-border h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-primary">Phone</label>
                    <Input value={form.phone} onChange={set("phone")} placeholder="Optional"
                      className="bg-background border-border h-12" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-primary">Country</label>
                  <Input value={form.country} onChange={set("country")} placeholder="Optional"
                    className="bg-background border-border h-12" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-primary">Subject</label>
                  <select value={form.subject} onChange={set("subject")}
                    className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option>General Support</option>
                    <option>Corporate Accounts</option>
                    <option>Expert Application</option>
                    <option>Editorial Submission</option>
                    <option>Partnership &amp; Business</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-primary">Message <span className="text-red-500">*</span></label>
                  <Textarea value={form.message} onChange={set("message")}
                    placeholder="How can we help you?"
                    className={`min-h-[140px] bg-background border-border ${errors.message ? "border-red-400" : ""}`} />
                  {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Submit Message"}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </Shell>
  );
}
