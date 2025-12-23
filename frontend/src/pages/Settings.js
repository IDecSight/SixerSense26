import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, User, Bell, Calendar, CheckCircle, XCircle, Crown, Link as LinkIcon } from 'lucide-react';
import { ProfileForm } from '../components/ProfileForm';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Settings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calendarStatus, setCalendarStatus] = useState({ connected: false, is_premium: false });
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  const fetchUser = async () => {
    try {
      const [userRes, calendarRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/auth/google/calendar/status')
      ]);
      setUser(userRes.data);
      setCalendarStatus(calendarRes.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    
    // Check for calendar connection callback
    const calendarConnected = searchParams.get('calendar_connected');
    const calendarError = searchParams.get('calendar_error');
    
    if (calendarConnected === 'true') {
      toast.success('Google Calendar connected successfully! 🎉');
      navigate('/settings', { replace: true });
    } else if (calendarError) {
      // Show specific error messages
      const errorMessages = {
        'invalid_client': 'OAuth configuration error: Invalid Client ID or Secret. Please contact support.',
        'redirect_mismatch': 'OAuth configuration error: Redirect URI mismatch. Please contact support.',
        'missing_credentials': 'Google Calendar not configured. Please contact support to set up OAuth credentials.',
        'token_exchange': 'Failed to exchange authorization code. Please try again.',
        'user_info': 'Failed to retrieve user information. Please try again.',
        'user_not_found': 'User account not found. Please try logging in again.'
      };
      
      const errorMsg = errorMessages[calendarError] || 'Failed to connect Google Calendar. Please try again.';
      toast.error('Calendar Connection Failed', {
        description: errorMsg,
        duration: 6000
      });
      navigate('/settings', { replace: true });
    }
  }, [searchParams]);

  const handleProfileUpdated = () => {
    // Prevent infinite loops by not re-fetching immediately
    setTimeout(() => {
      fetchUser();
    }, 100);
  };

  const handleConnectCalendar = async () => {
    if (!calendarStatus.is_premium) {
      toast.error('Premium membership required', {
        description: 'Upgrade to Premium to connect Google Calendar'
      });
      navigate('/subscription');
      return;
    }

    setConnectingCalendar(true);
    try {
      const response = await apiClient.get('/auth/google/calendar/connect');
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Calendar connection error:', error);
      if (error.response?.status === 503) {
        toast.error('Calendar integration not configured', {
          description: 'Please add Google OAuth credentials'
        });
      } else {
        toast.error('Failed to connect calendar');
      }
      setConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      return;
    }

    try {
      await apiClient.delete('/auth/google/calendar/disconnect');
      toast.success('Google Calendar disconnected');
      setCalendarStatus({ ...calendarStatus, connected: false });
    } catch (error) {
      toast.error('Failed to disconnect calendar');
    }
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-heading text-white">
                    <Calendar className="w-5 h-5 text-yellow-200" />
                    Google Calendar Sync
                  </CardTitle>
                  <CardDescription className="text-white/80 font-body mt-1">
                    Sync your tasks with Google Calendar automatically
                  </CardDescription>
                </div>
                {!calendarStatus.is_premium && (
                  <span className="px-3 py-1 text-xs font-bold bg-yellow-400/90 text-[#4169E1] rounded-full">
                    PREMIUM ONLY
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {calendarStatus.connected ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="font-heading font-bold text-white">Connected</p>
                        <p className="text-sm text-white/70 font-body">Your calendar is synced</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-white/40" />
                      <div>
                        <p className="font-heading font-bold text-white">Not Connected</p>
                        <p className="text-sm text-white/70 font-body">
                          {calendarStatus.is_premium 
                            ? 'Connect to sync tasks automatically' 
                            : 'Upgrade to Premium to connect'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {calendarStatus.connected ? (
                  <Button
                    onClick={handleDisconnectCalendar}
                    variant="outline"
                    className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30 font-heading"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectCalendar}
                    disabled={connectingCalendar || !calendarStatus.is_premium}
                    className="bg-white hover:bg-white/90 text-[#4169E1] font-heading font-bold shadow-lg"
                  >
                    {connectingCalendar ? (
                      'Connecting...'
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect Calendar
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* How it works */}
              {!calendarStatus.connected && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm font-heading font-bold text-white mb-2">How it works:</p>
                  <ul className="space-y-2 text-sm text-white/80 font-body">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>When creating a task, toggle "Add to Google Calendar"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>Task appears in your Google Calendar with cricket emoji 🏏</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>Dismissing a task removes it from your calendar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">•</span>
                      <span>Note: One-way sync only (app → calendar)</span>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Premium Upgrade CTA (if not premium) */}
          {!user?.is_premium && (
            <Card className="border-yellow-200/30 bg-gradient-to-br from-yellow-400/10 to-green-400/10 backdrop-blur-lg shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-white mb-2">
                      Unlock Premium Features
                    </h3>
                    <p className="text-white/80 font-body">
                      Get Google Calendar sync, AI recommendations, and more!
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/subscription')}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-[#4169E1] font-heading font-bold shadow-2xl"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
