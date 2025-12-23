import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const CricketGround = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groundData, setGroundData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchGroundData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchGroundData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchGroundData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await apiClient.get('/ai/balance?days=7');
      
      // Map categories to zones
      const zones = {
        'Cover Drive': { category: 'Career', ...response.data['Career'] },
        'Straight Drive': { category: 'Finance', ...response.data['Finance'] },
        'Square Leg': { category: 'Health', ...response.data['Health'] },
        'Fine Leg': { category: 'Relationships', ...response.data['Relationships'] },
        'Long On': { category: 'Spiritual/Mindset', ...response.data['Spiritual/Mindset'] },
        'Long Off': { category: 'Travel/Leisure', ...response.data['Travel/Leisure'] }
      };
      
      setGroundData(zones);
      setLastUpdated(new Date());
      
      if (silent) {
        toast.success('Cricket Ground updated', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error fetching ground data:', error);
      if (!silent) {
        toast.error('Failed to load cricket ground');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchGroundData(true);
  };

  const getIntensityColor = (runs) => {
    if (runs === 0) return 'bg-white/5';
    if (runs < 10) return 'bg-green-400/20';
    if (runs < 30) return 'bg-green-400/40';
    if (runs < 50) return 'bg-green-400/60';
    return 'bg-green-400/80';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]">
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="text-white hover:text-yellow-200 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg">
              Cricket Ground
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-400" />
              Six Scoring Zones
            </CardTitle>
            <CardDescription className="text-white/80 font-body">
              Visual representation of your productivity across life categories (Last 7 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Ground Visualization */}
              <div className="relative aspect-square max-w-2xl mx-auto bg-gradient-to-br from-green-900/20 to-green-700/20 rounded-full border-4 border-white/20 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-8">
                  {/* Pitch in center */}
                  <div className="col-start-2 row-start-2 bg-yellow-600/30 rounded-lg flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-sm">PITCH</span>
                  </div>
                </div>
              </div>

              {/* Zone Details */}
              <div className="grid md:grid-cols-2 gap-4 mt-8">
                {Object.entries(groundData).map(([zone, data]) => (
                  <div
                    key={zone}
                    className={`p-4 rounded-lg border border-white/10 ${getIntensityColor(data.runs)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading font-bold text-white">{zone}</h3>
                      <span className="text-xs text-white/60 font-body uppercase">{data.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-white/60 font-body text-xs">Runs</p>
                        <p className="font-mono-score font-bold text-white">{data.runs || 0}</p>
                      </div>
                      <div>
                        <p className="text-white/60 font-body text-xs">Tasks</p>
                        <p className="font-heading font-bold text-white">{data.count || 0}</p>
                      </div>
                      <div>
                        <p className="text-white/60 font-body text-xs">Minutes</p>
                        <p className="font-body font-bold text-white">{data.minutes || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-heading font-bold text-white mb-2">Color Intensity:</p>
                <div className="flex items-center gap-2 text-xs text-white/70 font-body">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-white/5"></div>
                    <span>Empty</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-green-400/20"></div>
                    <span>Light</span>
                  </div>
                  <span>→</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-green-400/80"></div>
                    <span>Intense</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CricketGround;
