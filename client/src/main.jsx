import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
// LiveKit base styles (we layer our own Tailwind styling on top of these).
import '@livekit/components-styles';

// Note: intentionally NOT using React.StrictMode — its dev-only double effect
// invocation causes duplicate socket connections and LiveKit reconnect churn.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
