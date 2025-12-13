import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/', { replace: true });
          return;
        }

        // Call backend to process session
        const response = await apiClient.post('/auth/session', { session_id: sessionId });
        
        // Store token and user
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to dashboard
        navigate('/dashboard', { 
          replace: true,
          state: { user: response.data.user } 
        });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/', { replace: true });
      }
    };

    processAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg font-medium">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
