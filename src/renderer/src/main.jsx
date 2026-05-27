import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from './App'
import '../../renderer/src/assets/main.css'
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </HashRouter>
)
