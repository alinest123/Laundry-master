import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// API base URL configuration:
//
// On Vercel (production): DO NOT set VITE_API_URL.
//   Leave it unset (or set to an empty string "").
//   The frontend and API live on the same domain — all /api/* requests
//   are routed by Vercel's rewrites to the serverless function automatically.
//   Setting VITE_API_URL to the Replit dev URL will break the production app.
//
// In local development on Replit: also leave VITE_API_URL unset.
//   The Vite dev server proxies /api/* to the API server automatically.
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
setBaseUrl(apiUrl || null);

createRoot(document.getElementById('root')!).render(<App />);
