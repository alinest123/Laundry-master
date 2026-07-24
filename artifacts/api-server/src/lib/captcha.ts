import { randomBytes } from "crypto";

/**
 * Server-side captcha store.
 *
 * The client receives only an opaque nonce (token). The expected answer and
 * expiry are kept exclusively in this server-side map and are never sent to
 * the client. A challenge is single-use: it is deleted immediately on the
 * first verification attempt (whether correct or not) to prevent replay.
 */
interface CaptchaChallenge {
  answer: number;
  expiresAt: number; // Unix ms
}

const store = new Map<string, CaptchaChallenge>();

/** Prune expired entries (runs lazily on generate/verify). */
function prune(): void {
  const now = Date.now();
  for (const [key, ch] of store) {
    if (ch.expiresAt < now) store.delete(key);
  }
}

const TTL_MS = 5 * 60 * 1000; // 5 minutes per challenge

/** Generate a math captcha challenge. Returns `{ question, token }`. */
export function generateCaptcha(): { question: string; token: string } {
  prune();

  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const useAdd = Math.random() < 0.5;
  const [big, small] = a >= b ? [a, b] : [b, a];
  const answer = useAdd ? a + b : big - small;
  const question = useAdd
    ? `What is ${a} + ${b}?`
    : `What is ${big} − ${small}?`;

  // Token is a random 128-bit nonce — carries no answer information
  const token = randomBytes(16).toString("hex");
  store.set(token, { answer, expiresAt: Date.now() + TTL_MS });

  return { question, token };
}

/**
 * Verify a captcha response.
 * Single-use: the entry is deleted on first call regardless of outcome.
 * Returns `true` only when token exists, has not expired, and answer matches.
 */
export function verifyCaptcha(token: string, answer: string): boolean {
  prune();
  const challenge = store.get(token);
  // Delete immediately — prevents replay even on correct answers
  store.delete(token);

  if (!challenge) return false;
  if (challenge.expiresAt < Date.now()) return false;

  const submitted = parseInt(answer.trim(), 10);
  return !isNaN(submitted) && submitted === challenge.answer;
}
