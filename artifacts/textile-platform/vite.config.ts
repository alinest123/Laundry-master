import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ command }) => {
  // PORT is only needed when running the dev server, not during `vite build`
  const rawPort = process.env.PORT;
  let port: number | undefined;

  if (command === 'serve') {
    if (!rawPort) {
      throw new Error('PORT environment variable is required for the dev server.');
    }
    port = Number(rawPort);
    if (Number.isNaN(port) || port <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
  }

  // BASE_PATH defaults to '/' — correct for Vercel (root deployment)
  // On Replit it is set to the artifact's sub-path (e.g. '/textile-platform')
  const basePath = process.env.BASE_PATH ?? '/';

  const isReplit =
    process.env.REPL_ID !== undefined && process.env.NODE_ENV !== 'production';

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      // Runtime error overlay — Replit dev only
      ...(isReplit ? [runtimeErrorOverlay()] : []),
      ...(isReplit
        ? [
            await import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, '..'),
              }),
            ),
            await import('@replit/vite-plugin-dev-banner').then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(
          import.meta.dirname,
          '..',
          '..',
          'attached_assets',
        ),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist/public'),
      emptyOutDir: true,
      // Raise warning limit — vendor chunk is large but permanently cached
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // Keep framer-motion separate — large, rarely changes
            if (id.includes('framer-motion')) return 'vendor-motion';
            // Keep tanstack-query separate — medium, rarely changes
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            // Everything else (react, radix, lucide, etc.) in one vendor chunk
            // to avoid circular dependency warnings from cross-package imports
            return 'vendor';
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
    },
  };
});
