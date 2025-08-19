import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { UserProvider } from '@/contexts/UserContext'

// Initialize real data from playbook
import { initializeRealData } from '@/api/realData'
initializeRealData();

ReactDOM.createRoot(document.getElementById('root')).render(
  <UserProvider>
    <App />
  </UserProvider>
) 