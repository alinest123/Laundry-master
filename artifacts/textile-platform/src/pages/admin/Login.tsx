import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Microscope, Eye, EyeOff } from "lucide-react";

export function Login() {
  const { login, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in → redirect
  if (!loading && user) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#111] rounded-xl flex items-center justify-center mb-3">
            <Microscope className="w-6 h-6 text-[#4a7c59]" />
          </div>
          <h1 className="text-xl font-bold text-stone-900">Admin Panel</h1>
          <p className="text-sm text-stone-500 mt-1">The Science of Professional Textile Care</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
              placeholder="admin@laundrymaster.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {import.meta.env.DEV && (
          <p className="text-center text-xs text-stone-400 mt-4">
            Dev only — default: admin@laundrymaster.com / changeme123
          </p>
        )}
      </div>
    </div>
  );
}
