import React from 'react'
import ReactDOM from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import {AuthProvider} from './hooks/useAuth'
import App from './App'
import './styles/global.css'

const savedTheme=localStorage.getItem('job-radar-theme')||'system'
const prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.dataset.theme=savedTheme==='dark'||(savedTheme==='system'&&prefersDark)?'dark':'light'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App/>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
