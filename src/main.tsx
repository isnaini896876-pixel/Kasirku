import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Service worker registration for PWA installability and offline caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration warning:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
