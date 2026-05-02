import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Point d'entrée principal de l'application React
createRoot(document.getElementById('root')!).render(
  // StrictMode aide à détecter les problèmes potentiels dans l'application
  <StrictMode>
    <App />
  </StrictMode>,
);
