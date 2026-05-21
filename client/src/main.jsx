import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/config' // validates VITE_API_URL at startup, throws clear error if missing
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
