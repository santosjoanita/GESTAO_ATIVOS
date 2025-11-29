// src/index/main.jsx (Caminhos Corrigidos)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // O index.css está na mesma pasta (src/index/)
import App from '../App/App.jsx' //

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)