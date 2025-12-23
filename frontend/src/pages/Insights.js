import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, Target, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Insights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryBalance, setCategoryBalance] = useState({});
  const [user, setUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchInsights();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInsights(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchInsights = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const [balanceRes, userRes] = await Promise.all([
        apiClient.get('/ai/balance?days=7'),
        apiClient.get('/auth/me')
      ]);
      setCategoryBalance(balanceRes.data);
      setUser(userRes.data);
      setLastUpdated(new Date());
      
      if (silent) {
        toast.success('Insights updated', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      if (!silent) {
        toast.error('Failed to load insights');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchInsights(true);
  };

  const calculatePercentage = (category) => {
    const total = Object.values(categoryBalance).reduce((sum, cat) => sum + cat.runs, 0);
    if (total === 0) return 0;
    return Math.round((categoryBalance[category]?.runs / total) * 100);
  };

  const getOverplayedCategories = () => {
    return Object.keys(categoryBalance).filter(cat => calculatePercentage(cat) > 35);
  };

  const getUnderplayedCategories = () => {
    return Object.keys(categoryBalance).filter(cat => calculatePercentage(cat) < 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  const overplayed = getOverplayedCategories();
  const underplayed = getUnderplayedCategories();

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
              Insights
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Focus Distribution */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-green-400" />
              Focus Distribution (Last 7 Days)
            </CardTitle>
            <CardDescription className="text-white/80 font-body">
              See how you're allocating your time across life categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBalance).map(([category, data]) => {
                const percentage = calculatePercentage(category);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-heading font-bold text-white">{category}</span>
                      <span className="text-sm text-white/80 font-body">
                        {data.count} tasks • {data.runs} runs • {percentage}%
                      </span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overplayed vs Underplayed */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overplayed */}
          <Card className="border-orange-200/30 bg-orange-500/10 backdrop-blur-lg shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Overplayed ({'>'}35%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overplayed.length > 0 ? (
                <ul className="space-y-2">
                  {overplayed.map(cat => (
                    <li key={cat} className="flex items-center gap-2 text-white font-body">
                      <span className="text-orange-400">•</span>
                      <span>{cat} ({calculatePercentage(cat)}%)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/70 text-sm font-body">No overplayed categories</p>
              )}
            </CardContent>
          </Card>

          {/* Underplayed */}
          <Card className="border-yellow-200/30 bg-yellow-500/10 backdrop-blur-lg shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-yellow-400" />
                Underplayed ({'<'}10%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {underplayed.length > 0 ? (
                <ul className="space-y-2">
                  {underplayed.map(cat => (
                    <li key={cat} className="flex items-center gap-2 text-white font-body">
                      <span className="text-yellow-400">•</span>
                      <span>{cat} ({calculatePercentage(cat)}%)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/70 text-sm font-body">All categories balanced!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendation */}
        <Card className="border-green-200/30 bg-green-500/10 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-400" />
              Captain's Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {underplayed.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="font-heading font-bold text-white mb-2">⚡ Attack:</p>
                  <p className="text-white/80 font-body">
                    Focus on {underplayed.slice(0, 2).join(' and ')} to build a more balanced innings
                  </p>
                </div>
              )}
              {overplayed.length > 0 && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="font-heading font-bold text-white mb-2">🛡️ Defend:</p>
                  <p className="text-white/80 font-body">
                    Maintain your strong performance in {overplayed[0]}, but leave room for other areas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Insights;
