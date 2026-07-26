import { Construction, Clock, Mail } from "lucide-react";

export function MaintenancePage({ siteName = "Laundry Master" }: { siteName?: string }) {
  return (
    <div className="min-h-screen bg-[#f5f5f2] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 bg-[#1c1c1c] rounded-sm flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span className="font-extrabold text-[1.1rem] tracking-tight text-[#1c1c1c]">{siteName}</span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm w-full max-w-md p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 rounded-full border border-amber-200 mx-auto">
          <Construction className="w-7 h-7 text-amber-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-stone-900">We'll be back soon</h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            {siteName} is currently undergoing scheduled maintenance. We're working hard to improve your experience and will be back online shortly.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-stone-50 rounded-xl px-4 py-3 text-left">
          <Clock className="w-4 h-4 text-stone-400 shrink-0" />
          <p className="text-xs text-stone-500">
            <span className="font-semibold text-stone-700">Scheduled maintenance</span> — we apologise for any inconvenience.
          </p>
        </div>

        <div className="pt-2 border-t border-stone-100">
          <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Questions?{" "}
            <a href="mailto:support@laundrymaster.com" className="text-[#4a7c59] hover:underline font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-stone-400">
        &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
      </p>
    </div>
  );
}
