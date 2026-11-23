import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register offline service worker so the game runs 100% offline once loaded
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
