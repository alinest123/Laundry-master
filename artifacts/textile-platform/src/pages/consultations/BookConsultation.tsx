import { useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Link } from "wouter";
import { ChevronRight, Shield, Clock, Star } from "lucide-react";

const CAL_LINK = "laundry-master";

export function BookConsultation() {
  useEffect(() => {
    // Load the Cal.com embed script
    (function (C: any, A: string, L: string) {
      let p = function (a: any, ar: any) { a.q.push(ar); };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    const Cal = (window as any).Cal;
    Cal("init", { origin: "https://cal.com" });

    Cal("inline", {
      elementOrSelector: "#cal-booking-embed",
      calLink: CAL_LINK,
      layout: "month_view",
    });

    Cal("ui", {
      styles: { branding: { brandColor: "#1a2e1a" } },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, []);

  return (
    <Shell>
      {/* Hero */}
      <div className="bg-[#1a2e1a] text-white pt-20 pb-14">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-8 font-medium uppercase tracking-wider">
            <Link href="/consultations" className="hover:text-white/80 transition-colors">
              Consultations
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">Book a Session</span>
          </nav>

          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
              Book an Expert Consultation
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Select a time that works for you. You'll receive a confirmation
              with meeting details immediately after booking.
            </p>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Shield className="w-4 h-4 text-[#7ab648]" />
              <span>Verified textile science experts</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Clock className="w-4 h-4 text-[#7ab648]" />
              <span>30 &amp; 60 minute sessions available</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Star className="w-4 h-4 text-[#7ab648]" />
              <span>4.9/5 average rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cal.com embed */}
      <div className="bg-[#f8f8f6] min-h-[700px] py-10">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <div
            id="cal-booking-embed"
            style={{ width: "100%", minHeight: "600px", borderRadius: "16px", overflow: "hidden" }}
          />
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-white border-t border-[#eaeaea] py-8">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
          <p className="text-sm text-[#999]">
            Need help?{" "}
            <Link href="/contact" className="text-[#4a7c59] hover:underline">
              Contact us
            </Link>{" "}
            · Cancellations and reschedules can be made directly from your confirmation email.
          </p>
        </div>
      </div>
    </Shell>
  );
}
