import { useEffect, useState } from "react";
import { Link } from "wouter";
import { API_ORIGIN } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, Microscope } from "lucide-react";

export function VerifyEmailPage() {
  const token = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  ).get("token") ?? "";

  const [state, setState] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No verification token found in the link.");
      return;
    }
    fetch(`${API_ORIGIN}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setState("success");
          setMessage((data as any).message || "Email verified.");
        } else {
          setState("error");
          setMessage((data as any).error || "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-[#1c1c1c] rounded-xl flex items-center justify-center">
            <Microscope className="w-6 h-6 text-[#4a7c59]" />
          </div>
        </div>
        <span className="font-extrabold text-[#1c1c1c] block mb-8">Laundry Master</span>

        {state === "pending" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[#4a7c59] animate-spin" />
            <p className="text-[#555]">Verifying your email…</p>
          </div>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-[#4a7c59] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1c1c1c] mb-2">Email verified!</h1>
            <p className="text-[#666] mb-6">{message}</p>
            <Link href="/login"
              className="inline-block bg-[#1c1c1c] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#333] transition-colors">
              Sign in to your account
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1c1c1c] mb-2">Verification failed</h1>
            <p className="text-[#666] mb-6">{message}</p>
            <div className="flex flex-col items-center gap-3">
              <Link href="/register"
                className="inline-block bg-[#1c1c1c] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#333] transition-colors">
                Re-register
              </Link>
              <Link href="/login" className="text-sm text-[#888] hover:text-[#1c1c1c]">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
