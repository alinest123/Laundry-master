import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Point the generated API client at the backend.
// In production (Vercel) set VITE_API_URL=https://<your-api-server>.
// In development the API is served on the same host, so no prefix is needed.
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
setBaseUrl(apiUrl || null);

createRoot(document.getElementById('root')!).render(<App />);
