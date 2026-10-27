import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Schriften lokal statt von Google Fonts (keine IP-Übertragung an Google, DSGVO)
import '@fontsource-variable/archivo'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App.tsx'
import {  BrowserRouter } from 'react-router-dom'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
