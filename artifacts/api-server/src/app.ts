import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import { sessionMiddleware } from "./middleware/session";
import router from "./routes";
import authRouter from "./routes/auth";
import calWebhookRouter from "./routes/webhooks/cal";
import { logger } from "./lib/logger";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

// ── Trust Vercel / reverse-proxy headers ──────────────────────────────────────
// Required so Express sees the real client IP (for rate limiting) and the
// connection as HTTPS (for secure session cookies) when running behind
// Vercel's load balancer or any other reverse proxy.
app.set("trust proxy", 1);

// ── Remove fingerprint ────────────────────────────────────────────────────────
app.disable("x-powered-by");

// ── Security headers (Helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    // CSP: tight in production, off in dev (Vite HMR uses eval)
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.cal.com", "https://*.supabase.co"],
            frameSrc: ["'self'", "https://cal.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    // Allow embedded iframes (Cal.com booking widget)
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // HSTS: production only
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    frameguard: { action: "sameorigin" },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  })
);

// ── Permissions-Policy ────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  next();
});

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: isProd
      ? (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowedOrigins.some((o) => origin === o || origin.startsWith(o)))
            return cb(null, true);
          cb(new Error(`Origin "${origin}" not allowed by CORS policy`));
        }
      : true,
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
/** Strict limiter for auth endpoints — protects against brute-force */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => !isProd,
});

/** General limiter for all other API endpoints */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skip: () => !isProd,
});

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── Cal.com webhook (raw body for HMAC) — BEFORE express.json() ───────────────
app.use("/api/webhooks/cal", express.raw({ type: "application/json" }), calWebhookRouter);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(sessionMiddleware);

// ── Apply strict rate limit to auth endpoints ─────────────────────────────────
// Auth routes live at /api/login, /api/register, etc. (not /api/auth/*)
app.use(
  ["/api/login", "/api/register", "/api/forgot-password", "/api/reset-password"],
  authLimiter
);

// ── Auth routes ───────────────────────────────────────────────────────────────
app.use("/api", authRouter);

// ── All other API routes (general rate limit) ─────────────────────────────────
app.use("/api", apiLimiter, router);

export default app;
