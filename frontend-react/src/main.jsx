/**
 * =============================================================================
 * Application Entry Point
 * =============================================================================
 * This is the entry point for the React application.
 * It renders the App component into the DOM root element.
 * 
 * Setup:
 * - StrictMode enabled for development warnings
 * - Global styles imported from index.css
 * - Root element: #root in index.html
 * 
 * Author: Zedny Development Team
 * =============================================================================
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
