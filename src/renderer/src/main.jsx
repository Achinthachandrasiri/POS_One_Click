import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from './App'
import '../../renderer/src/assets/main.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
)
