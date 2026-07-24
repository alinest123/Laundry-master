import { useState, FormEvent } from "react";
import { Link } from "wouter";
import { API_ORIGIN } from "@/lib/api";
import { CheckCircle, Microscope } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Request failed");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#1c1c1c] rounded-xl flex items-center justify-center mb-3">
              <Microscope className="w-6 h-6 text-[#4a7c59]" />
            </div>
            <span className="font-extrabold text-[#1c1c1c]">Laundry Master</span>
          </Link>
          <h1 className="text-xl font-bold text-[#1c1c1c] mt-3">Forgot password?</h1>
          <p className="text-sm text-[#888] mt-1 text-center">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6 text-center">
            <CheckCircle className="w-10 h-10 text-[#4a7c59] mx-auto mb-3" />
            <p className="text-sm text-[#444] mb-4">
              If an account exists for <strong>{email}</strong>, you'll receive a reset link
              shortly. Check your spam folder too.
            </p>
            <Link href="/login" className="text-sm font-semibold text-[#1c1c1c] hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">Email address</label>
              <input
                type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                placeholder="jane@example.com"
              />
            </div>
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#888] mt-5">
          <Link href="/login" className="text-[#1c1c1c] font-semibold hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
