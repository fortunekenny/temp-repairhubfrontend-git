import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            // Clear the 4rem sticky header, and never let a long message widen a phone screen.
            containerStyle={{ top: 72 }}
            toastOptions={{
              style: { fontSize: '14px', maxWidth: 'calc(100vw - 2rem)' },
              success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
