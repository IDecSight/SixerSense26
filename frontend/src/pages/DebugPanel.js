import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trash2, RefreshCw, Home } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const DebugPanel = () => {
  const navigate = useNavigate();
  const [clearing, setClearing] = useState(false);

  const handleClearMatch = async () => {
    setClearing(true);
    try {
      const response = await apiClient.delete('/matches/today');
      toast.success('Match restarted! 🔄', {
        description: response.data.message || 'You can now select a new format'
      });
    } catch (error) {
      if (error.response?.status === 404) {
        toast.info('No match to clear', {
          description: 'Already ready for a fresh start'
        });
      } else {
        toast.error('Failed to restart match');
        console.error(error);
      }
    } finally {
      setClearing(false);
    }
  };

  const handleTestAutoExpiry = async () => {
    try {
      const response = await apiClient.get('/matches/today');
      if (response.data === null) {
        toast.success('Auto-expiry working! ✅', {
          description: 'No match found - format selector will appear'
        });
      } else {
        toast.info('Match found', {
          description: `Format: ${response.data.format}, Status: ${response.data.status}`
        });
      }
    } catch (error) {
      toast.error('Failed to test auto-expiry');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-white font-heading text-center">
            🛠️ Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={handleTestAutoExpiry}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-heading font-bold"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Test Auto-Expiry
            </Button>

            <Button
              onClick={handleClearMatch}
              disabled={clearing}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-heading font-bold"
              size="lg"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {clearing ? 'Restarting...' : 'Restart Today\'s Match'}
            </Button>

            <Button
              onClick={handleGoToDashboard}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-heading font-bold"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>

            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30 font-heading font-bold"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Button>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/20">
            <h3 className="text-white font-heading font-semibold mb-2">Instructions:</h3>
            <ul className="text-sm text-white/80 space-y-1 font-body">
              <li>1. <strong>Test Auto-Expiry</strong> - Check if old matches expire</li>
              <li>2. <strong>Restart Match</strong> - Clear today's match and start fresh</li>
              <li>3. <strong>Go to Dashboard</strong> - View current match or format selector</li>
              <li>4. <strong>Go to Home</strong> - Navigate to home page</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <p className="text-xs text-green-200 font-body">
              ✅ <strong>Auto Features:</strong> Old matches expire automatically when new day starts. Restart anytime during the day to begin fresh!
            </p>
          </div>

          <div className="text-center text-xs text-white/60 font-body">
            Access this panel anytime at: /debug
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPanel;
