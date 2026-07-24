import { useState, useEffect, FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { API_ORIGIN } from "@/lib/api";
import { Eye, EyeOff, RefreshCw, Microscope } from "lucide-react";

type Captcha = { question: string; token: string };

async function fetchCaptcha(): Promise<Captcha> {
  const res = await fetch(`${API_ORIGIN}/api/auth/captcha`);
  return res.json();
}

export function LoginPage() {
  const { login, user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) setLocation("/dashboard");
  }, [loading, user, setLocation]);

  // Load captcha on mount
  useEffect(() => {
    fetchCaptcha().then(setCaptcha).catch(() => {});
  }, []);

  const refreshCaptcha = () => {
    setCaptchaAnswer("");
    setCaptcha(null);
    fetchCaptcha().then(setCaptcha).catch(() => {});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!captcha) { setError("Captcha not loaded, please refresh"); return; }
    setSubmitting(true);
    try {
      await login(email.trim(), password, { token: captcha.token, answer: captchaAnswer });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Sign in failed");
      // Refresh captcha after failed attempt
      refreshCaptcha();
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
          <h1 className="text-xl font-bold text-[#1c1c1c] mt-3">Welcome back</h1>
          <p className="text-sm text-[#888] mt-1">Sign in to your account</p>
        </div>

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#555]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#4a7c59] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Captcha */}
          <div className="rounded-lg border border-[#e8e8e8] bg-[#f9f9f7] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#555]">Security check</span>
              <button type="button" onClick={refreshCaptcha}
                className="text-[#aaa] hover:text-[#555] transition-colors" title="New question">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            {captcha ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#1c1c1c] flex-1 font-mono bg-white border border-[#e0e0e0] rounded px-2 py-1.5">
                  {captcha.question}
                </span>
                <input
                  type="number" required
                  value={captchaAnswer}
                  onChange={e => setCaptchaAnswer(e.target.value)}
                  className="w-20 px-3 py-1.5 border border-[#e0e0e0] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/30 focus:border-[#4a7c59]"
                  placeholder="?"
                />
              </div>
            ) : (
              <div className="h-8 bg-[#eee] animate-pulse rounded" />
            )}
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
              {error.includes("verify your email") && (
                <div className="mt-1">
                  Didn't receive it?{" "}
                  <Link href="/register" className="underline">Re-register</Link>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={submitting || !captcha}
            className="w-full bg-[#1c1c1c] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-[#888] mt-5">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#1c1c1c] font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
