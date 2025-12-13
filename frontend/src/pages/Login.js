import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const Login = () => {
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #4169e1 0%, hsl(225, 73%, 40%) 100%)'
    }}>
      <Card className="w-full max-w-md border-2 border-border backdrop-blur-sm bg-card/95 shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="text-6xl font-teko font-bold tracking-tight">
              <span className="runs-color">SIXER</span>
              <span className="text-accent ml-2">SENSE</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-teko uppercase tracking-tight text-white">
            Turn Tasks into Runs
          </CardTitle>
          <CardDescription className="text-base text-white/80">
            Every task is a ball. Every completion scores runs. Beat your target before losing 10 wickets!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            className="w-full h-12 text-lg font-medium bg-white text-background hover:bg-white/90"
            size="lg"
            data-testid="google-login-btn"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          
          <div className="text-center text-sm text-white/70 space-y-2 pt-4 border-t border-white/20">
            <p className="flex items-center justify-center gap-2">
              <span className="text-green-400">🏆</span>
              Track daily productivity as cricket matches
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-yellow-400">⚡</span>
              AI-powered task recommendations
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-blue-400">💰</span>
              Premium features with wallet integration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
