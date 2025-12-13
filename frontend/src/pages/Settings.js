import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, User, Bell, Calendar } from 'lucide-react';
import { ProfileForm } from '../components/ProfileForm';
import apiClient from '../lib/api';

export const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleProfileUpdated = () => {
    // Prevent infinite loops by not re-fetching immediately
    setTimeout(() => {
      fetchUser();
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]" data-testid="settings-page">
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="text-white hover:text-yellow-200 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Account Info */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-white">
                <User className="w-5 h-5 text-green-200" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-16 h-16 rounded-full border-2 border-green-300"
                  />
                )}
                <div>
                  <p className="font-heading font-semibold text-lg text-white">{user?.name}</p>
                  <p className="text-sm text-white/80 font-body">{user?.email}</p>
                  {user?.is_premium && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 text-xs font-heading font-bold uppercase">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <ProfileForm onProfileUpdated={handleProfileUpdated} />

          {/* Notifications */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-white">
                <Bell className="w-5 h-5 text-yellow-200" />
                Notifications
              </CardTitle>
              <CardDescription className="text-white/80 font-body">Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/70 font-body">Notification settings coming soon</p>
            </CardContent>
          </Card>

          {/* Calendar Sync */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-white">
                <Calendar className="w-5 h-5 text-yellow-200" />
                Google Calendar Sync
              </CardTitle>
              <CardDescription className="text-white/80 font-body">Sync your tasks with Google Calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/70 mb-4 font-body">Calendar sync coming soon</p>
              <Button variant="secondary" disabled className="bg-white/10 text-white font-heading border-white/20">
                Connect Calendar
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
