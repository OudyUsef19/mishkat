import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
          success: { style: { background: '#065f46', color: '#fff' } },
          error:   { style: { background: '#991b1b', color: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
