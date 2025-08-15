import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Initialize mock data for development
import { initializeData } from '@/api/mockData'
initializeData();

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 