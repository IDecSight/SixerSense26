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
      await apiClient.delete('/matches/today');
      toast.success('Match cleared successfully!', {
        description: 'You can now select a new format'
      });
    } catch (error) {
      toast.error('Failed to clear match');
      console.error(error);
    } finally {
      setClearing(false);
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
              onClick={handleClearMatch}
              disabled={clearing}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-heading font-bold"
              size="lg"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              {clearing ? 'Clearing...' : 'Clear Today\'s Match'}
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
              <li>1. Click "Clear Today's Match" to reset</li>
              <li>2. Click "Go to Dashboard"</li>
              <li>3. Format selector will appear</li>
              <li>4. Select your format and start!</li>
            </ul>
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
