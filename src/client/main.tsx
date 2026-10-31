import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './styles/tokens.css';
import './styles/base.css';
import './styles/firstrun.css';
import './styles/surfaces.css';
import './styles/polish.css';
import './styles/forms.css';
import './styles/finish.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Offline app shell (web only; the Android app ships its files inside the APK).
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol === 'https:') {
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
