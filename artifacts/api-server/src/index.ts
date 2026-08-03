import app from "./app";
import { logger } from "./lib/logger";
import { verifyTransactionalConnection } from "./services/email/transactional";
import { verifyContactConnection } from "./services/email/contact";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  // Verify both SMTP connections asynchronously — errors are logged but do not crash the server
  verifyTransactionalConnection().catch(() => {});
  verifyContactConnection().catch(() => {});
});
