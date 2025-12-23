import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Users, CheckCircle, Circle, XCircle } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const PlayingXI = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [playingXI, setPlayingXI] = useState([]);

  useEffect(() => {
    fetchMatchData();
  }, []);

  const fetchMatchData = async () => {
    try {
      const response = await apiClient.get('/matches/today');
      setMatch(response.data);
      
      // Create Playing XI from today's tasks (max 11)
      if (response.data?.tasks) {
        const xi = response.data.tasks.slice(0, 11).map((task, index) => ({
          position: index + 1,
          name: task.title,
          category: task.category,
          role: getRoleForCategory(task.category),
          run_value: task.run_value,
          status: task.status,
          balls_consumed: task.balls_consumed || 1
        }));
        setPlayingXI(xi);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load Playing XI');
    } finally {
      setLoading(false);
    }
  };

  const getRoleForCategory = (category) => {
    const roles = {
      'Career': 'Batsman',
      'Finance': 'Batsman',
      'Travel/Leisure': 'Batsman',
      'Health': 'All-Rounder',
      'Relationships': 'All-Rounder',
      'Spiritual/Mindset': 'Bowler'
    };
    return roles[category] || 'All-Rounder';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'dismissed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Circle className="w-5 h-5 text-white/40" />;
    }
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
              Playing XI
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              Today's Playing XI
            </CardTitle>
            <CardDescription className="text-white/80 font-body">
              Your 11 players for today's match (max 11 tasks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playingXI.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {playingXI.map((player) => (
                  <div
                    key={player.position}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="font-heading font-bold text-white">{player.position}</span>
                        </div>
                        <div>
                          <p className="font-heading font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-xs text-white/60 font-body">{player.role}</p>
                        </div>
                      </div>
                      {getStatusIcon(player.status)}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs text-white/60 font-body uppercase">{player.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 text-xs font-mono-score font-bold">
                          {player.run_value} RUNS
                        </span>
                        <span className="text-xs text-white/60 font-body">
                          {player.balls_consumed} {player.balls_consumed === 1 ? 'ball' : 'balls'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/70 font-body mb-4">No tasks added yet</p>
                <Button onClick={() => navigate('/dashboard')} className="bg-white hover:bg-white/90 text-[#4169E1] font-heading">
                  Add Tasks
                </Button>
              </div>
            )}

            {playingXI.length > 0 && playingXI.length < 11 && (
              <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
                <p className="text-sm text-white/80 font-body">
                  💡 You have {11 - playingXI.length} empty slot{11 - playingXI.length === 1 ? '' : 's'} in your Playing XI. Add more tasks to complete your team!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PlayingXI;
