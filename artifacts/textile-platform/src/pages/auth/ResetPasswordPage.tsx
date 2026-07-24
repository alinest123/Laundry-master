import { useState, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { API_ORIGIN } from "@/lib/api";
import { Eye, EyeOff, CheckCircle, Microscope } from "lucide-react";

export function ResetPasswordPage() {
  const [location] = useLocation();
  const token = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  ).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any).error || "Reset failed");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#666] mb-4">Invalid reset link.</p>
          <Link href="/forgot-password" className="text-[#1c1c1c] font-semibold hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-[#1c1c1c] mt-3">Set new password</h1>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6 text-center">
            <CheckCircle className="w-10 h-10 text-[#4a7c59] mx-auto mb-3" />
            <p className="text-sm text-[#444] mb-4">Your password has been updated.</p>
            <Link href="/login"
              className="inline-block bg-[#1c1c1c] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#333] transition-colors">
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e8e8e8] shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} required autoFocus
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#555] mb-1.5">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"} required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button type="submit" disabled={submitting}
              className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
