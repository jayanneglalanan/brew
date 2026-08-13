import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/router';
import ResponsiveRoot from './app/ResponsiveRoot';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ResponsiveRoot>
      <App />
    </ResponsiveRoot>
  </React.StrictMode>,
);
