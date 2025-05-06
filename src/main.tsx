
import React from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Força reinício do servidor
console.log("Reiniciando servidor...", new Date().toISOString());

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={200}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TooltipProvider>
  </React.StrictMode>
);
