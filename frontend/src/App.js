import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import MatchHistory from './pages/MatchHistory';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();
  
  // Check for session_id in URL fragment (synchronously during render)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <MatchHistory />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/wallet" 
        element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
