import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Trophy, Target, Shield } from 'lucide-react';
import apiClient from '../lib/api';

export const MatchHistory = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/matches/history?limit=14');
        setMatches(response.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getMatchBadge = (match) => {
    if (match.status === 'won') return { label: 'WON', color: 'bg-green-500/30 text-green-200 border border-green-300/50' };
    if (match.status === 'lost') return { label: 'LOST', color: 'bg-red-500/30 text-red-200 border border-red-300/50' };
    return { label: 'IN PROGRESS', color: 'bg-white/20 text-white border border-white/30' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]" data-testid="match-history">
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-white hover:text-yellow-200 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg">
              Match History
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {matches.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-200" />
              <p className="text-lg text-white/90 font-body">No match history yet</p>
              <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-white hover:bg-white/90 text-[#4169E1] font-heading shadow-lg">
                Start Your First Match
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const badge = getMatchBadge(match);
              const strikeRate = match.completed_tasks > 0 
                ? ((match.total_runs / match.completed_tasks) * 100).toFixed(0) 
                : '0';

              return (
                <Card key={match.match_id} className="hover:shadow-2xl transition-shadow bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-heading uppercase tracking-tight text-white drop-shadow-md">
                          {new Date(match.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardTitle>
                        <p className="text-sm text-white/80 mt-1 font-body">
                          {match.format} Format
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2 text-muted-foreground">
                          <Target className="w-4 h-4" />
                          <span className="text-xs uppercase font-medium">Runs</span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-mono-score text-2xl font-bold text-primary">
                            {match.total_runs}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            / {match.target_score}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2 text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs uppercase font-medium">Wickets</span>
                        </div>
                        <div className="font-mono-score text-2xl font-bold text-destructive">
                          {match.total_wickets}/10
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-2 text-muted-foreground">
                          <Trophy className="w-4 h-4" />
                          <span className="text-xs uppercase font-medium">Strike Rate</span>
                        </div>
                        <div className="font-mono-score text-2xl font-bold">
                          {strikeRate}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchHistory;
