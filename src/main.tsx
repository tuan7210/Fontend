import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ReloadProvider } from './context/ReloadContext';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ReloadProvider>
        <App />
      </ReloadProvider>
    </BrowserRouter>
  </StrictMode>
);
