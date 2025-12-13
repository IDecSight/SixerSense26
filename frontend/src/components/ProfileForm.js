import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import apiClient from '../lib/api';
import { toast } from 'sonner';
import { User, Target, Briefcase, Clock } from 'lucide-react';

export const ProfileForm = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState({
    primary_goal: 'Balance',
    profession: '',
    life_stage: 'Working Professional',
    daily_availability: 'Medium',
    preferred_focus_areas: ['Career', 'Health']
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const categories = ['Health', 'Career', 'Finance', 'Relationships', 'Spiritual/Mindset', 'Travel/Leisure'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/profile');
        if (response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchProfile();
  }, []);

  const handleFocusAreaToggle = (category) => {
    setProfile(prev => {
      const current = prev.preferred_focus_areas || [];
      if (current.includes(category)) {
        return {
          ...prev,
          preferred_focus_areas: current.filter(c => c !== category)
        };
      } else if (current.length < 3) {
        return {
          ...prev,
          preferred_focus_areas: [...current, category]
        };
      } else {
        toast.warning('You can select up to 3 focus areas');
        return prev;
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (profile.preferred_focus_areas.length < 2) {
      toast.error('Please select at least 2 focus areas');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/profile', profile);
      toast.success('Profile updated!', {
        description: 'Your recommendations will now be tailored to your preferences'
      });
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="profile-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Your Profile
        </CardTitle>
        <CardDescription>
          Customize your experience and get personalized task recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Goal */}
          <div className="space-y-2">
            <Label htmlFor="primary_goal" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Primary Goal
            </Label>
            <Select
              value={profile.primary_goal}
              onValueChange={(value) => setProfile({ ...profile, primary_goal: value })}
            >
              <SelectTrigger data-testid="primary-goal-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Balance">Overall Life Balance</SelectItem>
                <SelectItem value="Career growth">Career Growth</SelectItem>
                <SelectItem value="Health">Health & Wellness</SelectItem>
                <SelectItem value="Wealth">Wealth Building</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Profession (Optional)
            </Label>
            <Input
              id="profession"
              value={profile.profession || ''}
              onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
              placeholder="e.g., Software Engineer, Student, Entrepreneur"
              data-testid="profession-input"
            />
          </div>

          {/* Life Stage */}
          <div className="space-y-2">
            <Label htmlFor="life_stage">Life Stage</Label>
            <Select
              value={profile.life_stage}
              onValueChange={(value) => setProfile({ ...profile, life_stage: value })}
            >
              <SelectTrigger data-testid="life-stage-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Working Professional">Working Professional</SelectItem>
                <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Availability */}
          <div className="space-y-2">
            <Label htmlFor="daily_availability" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Daily Availability
            </Label>
            <Select
              value={profile.daily_availability}
              onValueChange={(value) => setProfile({ ...profile, daily_availability: value })}
            >
              <SelectTrigger data-testid="availability-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low (1-2 hours)</SelectItem>
                <SelectItem value="Medium">Medium (3-5 hours)</SelectItem>
                <SelectItem value="High">High (6+ hours)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Focus Areas */}
          <div className="space-y-3">
            <Label>Preferred Focus Areas (Select 2-3)</Label>
            <p className="text-sm text-muted-foreground">
              AI will prioritize these categories in recommendations
            </p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const isSelected = profile.preferred_focus_areas?.includes(category);
                return (
                  <div
                    key={category}
                    onClick={() => handleFocusAreaToggle(category)}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                    data-testid={`focus-area-${category.toLowerCase().replace('/', '-')}`}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" data-testid="save-profile-btn">
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
