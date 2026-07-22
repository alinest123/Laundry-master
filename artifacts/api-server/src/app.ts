import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { sessionMiddleware } from "./middleware/session";
import router from "./routes";
import authRouter from "./routes/auth";
import { logger } from "./lib/logger";

const app: Express = express();

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
  }),
);

// CORS — in production restrict to explicitly configured origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.some((o) => origin === o || origin.startsWith(o)))
              return cb(null, true);
            cb(new Error(`Origin "${origin}" not allowed by CORS policy`));
          }
        : true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session must come after body parsers
app.use(sessionMiddleware);

// Auth routes (no requireAuth guard — login/logout/me are public-ish)
app.use("/api", authRouter);

// All other routes (admin ones are guarded inside admin/index.ts)
app.use("/api", router);

export default app;
