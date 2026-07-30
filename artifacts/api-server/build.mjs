import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

/** Shared esbuild options for both bundles */
function sharedOptions(distDir) {
  return {
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
    external: [
      "*.node", "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt",
      "argon2", "fsevents", "re2", "farmhash", "xxhash-addon", "bufferutil",
      "utf-8-validate", "ssh2", "cpu-features", "dtrace-provider",
      "isolated-vm", "lightningcss", "pg-native", "oracledb",
      "mongodb-client-encryption", "nodemailer", "handlebars", "knex",
      "typeorm", "protobufjs", "onnxruntime-node", "@tensorflow/*",
      "@prisma/client", "@mikro-orm/*", "@grpc/*", "@swc/*", "@aws-sdk/*",
      "@azure/*", "@opentelemetry/*", "@google-cloud/*", "@google/*",
      "googleapis", "firebase-admin", "@parcel/watcher",
      "@sentry/profiling-node", "@tree-sitter/*", "aws-sdk", "classic-level",
      "dd-trace", "ffi-napi", "grpc", "hiredis", "kerberos", "leveldown",
      "miniflare", "mysql2", "newrelic", "odbc", "piscina", "realm",
      "ref-napi", "rocksdb", "sass-embedded", "sequelize", "serialport",
      "snappy", "tinypool", "usb", "workerd", "wrangler", "zeromq",
      "zeromq-prebuilt", "playwright", "puppeteer", "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
  };
}

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // ── Bundle 1: full server (Replit dev / production process) ──────────────────
  // Includes app.listen() — run directly with `node dist/index.mjs`
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    logLevel: "info",
    ...sharedOptions(distDir),
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
  });

  // ── Bundle 2: app only (Vercel serverless function — CommonJS) ───────────────
  // Vercel's @vercel/node runtime compiles api/index.ts to CJS. Node.js CJS
  // cannot require() a .mjs (ESM) file, so the Vercel bundle MUST be CJS.
  //
  // pino and its transports are externalised: Vercel installs them from
  // node_modules so no pino worker files need to ship with the bundle.
  // In production pino logs JSON to stdout — no pretty-printing needed.
  const pinoExternals = [
    "pino", "pino-http", "pino-pretty", "pino-std-serializers",
    "thread-stream", "sonic-boom", "on-exit-leak-free",
  ];
  const { external: sharedExternals, plugins: _plugins, banner: _banner, ...restOpts } = sharedOptions(distDir);
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/app.ts")],
    logLevel: "info",
    platform: "node",
    bundle: true,
    format: "cjs",            // CJS — required for Vercel @vercel/node compatibility
    outfile: path.resolve(distDir, "app.cjs"),
    sourcemap: false,          // skip sourcemap — reduces deployed function size
    external: [...sharedExternals, ...pinoExternals],
    // No banner: CJS doesn't need the ESM require() shim
    // No pino plugin: pino is external, installed from node_modules on Vercel
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
