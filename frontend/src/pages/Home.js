import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Wallet, User, History, Target, LogOut, Zap, Crown } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasMatchToday, setHasMatchToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, matchRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/matches/today')
      ]);
      setUser(userRes.data);
      setHasMatchToday(matchRes.data !== null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    {
      icon: Trophy,
      title: "Today's Match",
      description: hasMatchToday ? "Continue your match" : "Select format & start",
      color: "from-green-500 to-emerald-600",
      path: "/dashboard",
      emoji: "🏏"
    },
    {
      icon: Wallet,
      title: "Wallet",
      description: "Manage balance & buy runs",
      color: "from-yellow-500 to-orange-600",
      path: "/wallet",
      emoji: "💰"
    },
    {
      icon: User,
      title: "Profile",
      description: "Update goals & preferences",
      color: "from-blue-500 to-cyan-600",
      path: "/settings",
      emoji: "👤"
    },
    {
      icon: History,
      title: "Match History",
      description: "View past matches & stats",
      color: "from-purple-500 to-pink-600",
      path: "/history",
      emoji: "📊"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-lg font-medium text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]">
      {/* Header */}
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-yellow-200" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                <span className="text-white">SIXER</span>
                <span className="text-yellow-200 ml-1">SENSE</span>
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-200 hover:text-red-100 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-lg border-2 border-white/30">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          <h2 className="text-4xl font-heading font-bold text-white mb-2 drop-shadow-lg">
            Welcome back, {user?.name?.split(' ')[0] || 'Player'}! 👋
          </h2>
          <p className="text-white/90 text-lg font-body drop-shadow-md">
            Ready to win today?
          </p>
          {user?.is_premium && (
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border-2 border-yellow-200/30">
              <Crown className="w-4 h-4 text-yellow-200" />
              <span className="text-sm font-heading font-bold text-yellow-200 uppercase">Premium Member</span>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className="group relative overflow-hidden rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all hover:scale-105 hover:border-white/40 shadow-xl hover:shadow-2xl"
            >
              <div className="p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-4xl">{item.emoji}</div>
                <h3 className="text-xl font-heading font-bold text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-white/80 font-body">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white font-heading flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-200" />
              Quick Stats
            </CardTitle>
            <CardDescription className="text-white/80 font-body">
              Your productivity at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-3xl font-mono-score font-bold text-green-200 mb-1">
                  {user?.win_streak || 0}
                </p>
                <p className="text-xs text-white/70 font-body uppercase">Win Streak</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-3xl font-mono-score font-bold text-yellow-200 mb-1">
                  {user?.total_bonus_runs || 0}
                </p>
                <p className="text-xs text-white/70 font-body uppercase">Bonus Runs</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-3xl font-mono-score font-bold text-blue-200 mb-1">
                  {user?.next_target || 60}
                </p>
                <p className="text-xs text-white/70 font-body uppercase">Next Target</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-3xl font-mono-score font-bold text-purple-200 mb-1">
                  ₹{user?.wallet_balance?.toFixed(0) || 0}
                </p>
                <p className="text-xs text-white/70 font-body uppercase">Wallet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="bg-white hover:bg-white/90 text-[#4169E1] font-heading font-bold px-10 py-6 text-lg h-auto shadow-2xl"
          >
            <Trophy className="w-5 h-5 mr-2" />
            {hasMatchToday ? "Continue Today's Match" : "Start Today's Match"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Home;
