import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Target, Zap, TrendingUp, Heart, Briefcase, DollarSign, Users, Brain, Plane, CheckCircle2, ArrowRight } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const response = await apiClient.post(endpoint, payload);
      
      localStorage.setItem('token', response.data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { icon: Heart, name: 'Health', description: 'Exercise, nutrition, wellness' },
    { icon: Briefcase, name: 'Career', description: 'Work, learning, growth' },
    { icon: DollarSign, name: 'Finance', description: 'Budget, investments, wealth' },
    { icon: Users, name: 'Relationships', description: 'Family, friends, connections' },
    { icon: Brain, name: 'Mindset', description: 'Meditation, reflection, growth' },
    { icon: Plane, name: 'Travel & Leisure', description: 'Hobbies, fun, exploration' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4169e1] via-[#3152b8] to-[#1e3a8a]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        {/* Header with CTA */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <Target className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-teko font-bold text-white tracking-tight uppercase">Sixer Sense</h1>
          </div>
          <Button 
            onClick={() => setShowAuth(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6"
          >
            Start Free
          </Button>
        </div>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <div className="inline-block mb-6">
            <span className="text-6xl sm:text-7xl lg:text-8xl font-teko font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-yellow-400 tracking-tight uppercase leading-none">
              Sixer Sense
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Turn Every Day Into a Win.
          </h2>
          <p className="text-xl sm:text-2xl text-white/90 mb-4 font-light">
            You don't need more motivation.<br />
            You need a system that makes progress unavoidable.
          </p>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Sixer Sense is an AI-powered productivity system that turns your daily tasks into a game — so you finally finish what you start.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            size="lg"
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-6 text-lg h-auto"
          >
            <Zap className="w-5 h-5 mr-2" />
            Start Your First Match
          </Button>
        </div>

        {/* The Problem Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                You Know This Feeling, Don't You?
              </h3>
              <div className="space-y-4 text-white/90 text-lg">
                <p>You start the day with good intentions.</p>
                <p>You make a list.</p>
                <p>You promise yourself "Today will be different."</p>
                <p className="font-semibold text-xl text-white pt-4">And then…</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-2 text-red-300">
                    <span>•</span> The day gets busy
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <span>•</span> Priorities blur
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <span>•</span> Tasks spill into tomorrow
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <span>•</span> You feel tired, not accomplished
                  </div>
                </div>
                <p className="text-center pt-6 text-xl font-semibold text-green-400">
                  You're not lazy.<br />
                  You're just operating without a system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The Real Problem Section */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-8">
            The Real Problem Isn't You
          </h3>
          <h4 className="text-2xl font-semibold text-white/90 mb-10">
            It's How Productivity Is Designed
          </h4>
          
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <Card className="bg-red-900/30 backdrop-blur-sm border-red-500/30">
              <CardContent className="p-6">
                <h5 className="text-lg font-bold text-red-300 mb-4">Most Tools Assume:</h5>
                <ul className="space-y-3 text-white/80 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>You'll always know what to do next</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>You'll stay motivated without feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>Progress doesn't need to be visible</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-900/30 backdrop-blur-sm border-green-500/30">
              <CardContent className="p-6">
                <h5 className="text-lg font-bold text-green-300 mb-4">Humans Need:</h5>
                <ul className="space-y-3 text-white/80 text-left">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clear goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Immediate feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>A sense of winning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-2xl text-green-400 font-bold">
            That's why games work.
          </p>
        </div>

        {/* How Games Work Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Productivity Works Best When It Feels Like a Game
          </h3>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <div className="space-y-4">
                <p className="text-lg text-white/90">In games:</p>
                <div className="grid gap-3">
                  {[
                    'Every action matters',
                    'Progress is visible',
                    'Winning feels clear',
                    'Losing creates urgency'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-white text-lg">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-lg text-green-400 font-semibold pt-4">
                  Sixer Sense applies the same logic to your daily life.
                </p>
                <p className="text-white/80 text-center pt-2">
                  No pressure. No guilt. Just clarity and momentum.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Introducing Sixer Sense */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Introducing Sixer Sense
          </h3>
          <p className="text-xl text-white/90 mb-10">
            Sixer Sense turns your day into a cricket-style match.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { text: 'Your tasks become plays', icon: '🎯' },
              { text: 'Your effort earns runs', icon: '🏃' },
              { text: 'Distractions cost wickets', icon: '❌' },
              { text: 'The day has a clear target', icon: '🎪' },
              { text: 'AI acts as your captain', icon: '🤖' }
            ].map((item, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-green-400/50 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="text-white font-medium">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xl text-white/90">
            At the end of the day, you don't guess if you were productive.
          </p>
          <p className="text-2xl text-green-400 font-bold mt-2">
            You know.
          </p>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            How Sixer Sense Works <span className="text-white/60">(Simple)</span>
          </h3>
          
          <div className="grid gap-6">
            {[
              { step: 1, text: 'Log in and start today's match', color: 'green' },
              { step: 2, text: 'Complete tasks to score runs', color: 'blue' },
              { step: 3, text: 'Follow AI recommendations when you're unsure', color: 'purple' },
              { step: 4, text: 'Beat the target and win the day', color: 'yellow' }
            ].map((item) => (
              <Card key={item.step} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-${item.color}-500/30 border-2 border-${item.color}-400 flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <p className="text-lg text-white">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-white/90 mt-10 text-lg">
            That's it.<br />
            <span className="text-white/70">No complex systems. No endless planning.</span><br />
            <span className="text-green-400 font-semibold">Just play — and progress happens.</span>
          </p>
        </div>

        {/* Why This Works */}
        <div className="max-w-3xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            Why This Actually Works
          </h3>
          <p className="text-xl text-white/80 mb-8 text-center">
            This isn't motivation. It's mechanics.
          </p>
          
          <div className="grid gap-4">
            {[
              { icon: TrendingUp, text: 'Visible progress keeps you engaged' },
              { icon: Brain, text: 'AI guidance removes decision fatigue' },
              { icon: Target, text: 'Daily closure builds consistency' },
              { icon: Zap, text: 'Gamification makes effort rewarding' }
            ].map((item, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 flex items-center gap-4">
                  <item.icon className="w-8 h-8 text-green-400 flex-shrink-0" />
                  <p className="text-white text-lg">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-green-400 font-semibold mt-8 text-xl">
            Small wins compound.<br />
            That's how real change happens.
          </p>
        </div>

        {/* Balanced Life Categories */}
        <div className="max-w-5xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            Built for a Balanced Life
          </h3>
          <p className="text-xl text-white/80 mb-10 text-center">
            Sixer Sense doesn't just push work.<br />
            It balances your life across:
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {categories.map((category, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-green-400/50 transition-all">
                <CardContent className="p-6 text-center">
                  <category.icon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-2">{category.name}</h4>
                  <p className="text-sm text-white/70">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-white/90 text-lg">
            If one area is ignored, the system corrects it.
          </p>
          <p className="text-center text-green-400 font-semibold mt-2 text-xl">
            Because success isn't about grinding harder.<br />
            It's about playing smarter.
          </p>
        </div>

        {/* Who This Is For */}
        <div className="max-w-4xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            Who This Is For
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-green-900/30 backdrop-blur-sm border-green-500/30">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold text-green-300 mb-6">This is for you if:</h4>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>You want structure, not hacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>You value consistency over intensity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>You want to see your progress daily</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-red-900/30 backdrop-blur-sm border-red-500/30">
              <CardContent className="p-8">
                <h4 className="text-xl font-bold text-red-300 mb-6">This is not for you if:</h4>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>You want shortcuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>You don't like accountability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">✗</span>
                    <span>You avoid finishing what you start</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-white/70 mt-6 italic">
            Clarity attracts the right people.
          </p>
        </div>

        {/* Pricing Teaser */}
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Free to Start. Powerful When You Upgrade.
          </h3>
          <p className="text-lg text-white/90 mb-8">
            You can start free — no pressure.
          </p>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardContent className="p-8">
              <p className="text-white/90 mb-4">When you're ready:</p>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Unlock advanced AI guidance</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Earn and use runs</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Upgrade your daily game</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-white/80 text-lg">
            You decide how far you want to play.
          </p>
        </div>

        {/* Final CTA */}
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            One Simple Question Before You Leave
          </h3>
          <p className="text-2xl text-green-400 font-semibold mb-8 leading-relaxed">
            What would your life look like<br />
            if you won most of your days?
          </p>
          <p className="text-lg text-white/80 mb-4">
            Not perfectly. Just consistently.
          </p>
          <p className="text-white/90 mb-10">
            Sixer Sense doesn't promise miracles.<br />
            It gives you a system.<br />
            <span className="text-green-400 font-semibold">And systems scale.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowAuth(true)}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-6 text-lg h-auto"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Your First Match
            </Button>
            <Button 
              onClick={() => setShowAuth(true)}
              size="lg"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold px-10 py-6 text-lg h-auto backdrop-blur-sm"
            >
              Get Early Access
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-[#1e3a8a] border-white/20">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Start Your Journey'}
                </h3>
                <p className="text-white/70">
                  {isLogin ? 'Log in to continue your match' : 'Create your free account'}
                </p>
              </div>

              <Button
                onClick={handleGoogleAuth}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold mb-6"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1e3a8a] text-white/60">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!isLogin}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </div>

              <button
                onClick={() => setShowAuth(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
