import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './TicTacToe.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
