import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MapPin } from 'lucide-react';
import apiClient from '../lib/api';

export const CricketGroundSection = ({ match, refreshTrigger }) => {
  const [groundData, setGroundData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroundData();
  }, [match, refreshTrigger]);

  const fetchGroundData = async () => {
    if (!match) {
      setLoading(false);
      return;
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
    } catch (error) {
      console.error('Error fetching ground data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (runs) => {
    if (runs === 0 || runs === undefined) return 'bg-white/5';
    if (runs < 10) return 'bg-green-400/20';
    if (runs < 30) return 'bg-green-400/40';
    if (runs < 50) return 'bg-green-400/60';
    return 'bg-green-400/80';
  };

  if (!match || loading) {
    return null;
  }

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-400" />
          Cricket Ground - 6 Scoring Zones
        </CardTitle>
        <CardDescription className="text-white/80 font-body">
          Visual performance across life categories (Last 7 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Zone Details */}
          <div className="grid md:grid-cols-2 gap-4">
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
  );
};
