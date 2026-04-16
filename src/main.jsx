import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext.jsx'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

// ===== MOBILE KEYBOARD FIX =====
// Prevent the page from scrolling up when the virtual keyboard opens
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    // Force scroll to top so the header never moves off-screen
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
  window.visualViewport.addEventListener('scroll', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
