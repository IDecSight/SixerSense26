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
    <div className="min-h-screen bg-background" data-testid="settings-page">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-teko font-bold uppercase tracking-tight">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-16 h-16 rounded-full border-2 border-primary"
                  />
                )}
                <div>
                  <p className="font-semibold text-lg">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.is_premium && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Notification settings coming soon</p>
            </CardContent>
          </Card>

          {/* Calendar Sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Google Calendar Sync
              </CardTitle>
              <CardDescription>Sync your tasks with Google Calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Calendar sync coming soon</p>
              <Button variant="secondary" disabled>
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
