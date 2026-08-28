import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker: hace que abra sin internet y que el navegador la trate como
// app instalada, que es lo que protege las recetas de un borrado automático.
// No corre adentro de un iframe (la versión publicada como Artifact) ni en http.
const enIframe = window.top !== window.self
const seguro = location.protocol === 'https:' || location.hostname === 'localhost'

if ('serviceWorker' in navigator && seguro && !enIframe) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Si no se puede registrar, la app anda igual: solo pierde el modo offline.
    })
  })
}
