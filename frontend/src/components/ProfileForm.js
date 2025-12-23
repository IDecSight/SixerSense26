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
    preferred_focus_areas: ['Career', 'Health'],
    playing_style: 'Balanced'
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
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl" data-testid="profile-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-heading">
          <User className="w-5 h-5 text-green-200" />
          Your Profile
        </CardTitle>
        <CardDescription className="text-white/80 font-body">
          Customize your experience and get personalized task recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Goal */}
          <div className="space-y-2">
            <Label htmlFor="primary_goal" className="flex items-center gap-2 text-white font-body">
              <Target className="w-4 h-4 text-green-200" />
              Primary Goal
            </Label>
            <Select
              value={profile.primary_goal}
              onValueChange={(value) => setProfile({ ...profile, primary_goal: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="primary-goal-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4169E1] border-white/20 text-white">
                <SelectItem value="Balance" className="text-white hover:bg-white/10">Overall Life Balance</SelectItem>
                <SelectItem value="Career growth" className="text-white hover:bg-white/10">Career Growth</SelectItem>
                <SelectItem value="Health" className="text-white hover:bg-white/10">Health & Wellness</SelectItem>
                <SelectItem value="Wealth" className="text-white hover:bg-white/10">Wealth Building</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profession */}
          <div className="space-y-2">
            <Label htmlFor="profession" className="flex items-center gap-2 text-white font-body">
              <Briefcase className="w-4 h-4 text-green-200" />
              Profession (Optional)
            </Label>
            <Input
              id="profession"
              value={profile.profession || ''}
              onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
              placeholder="e.g., Software Engineer, Student, Entrepreneur"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-body"
              data-testid="profession-input"
            />
          </div>

          {/* Life Stage */}
          <div className="space-y-2">
            <Label htmlFor="life_stage" className="text-white font-body">Life Stage</Label>
            <Select
              value={profile.life_stage}
              onValueChange={(value) => setProfile({ ...profile, life_stage: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="life-stage-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4169E1] border-white/20 text-white">
                <SelectItem value="Student" className="text-white hover:bg-white/10">Student</SelectItem>
                <SelectItem value="Working Professional" className="text-white hover:bg-white/10">Working Professional</SelectItem>
                <SelectItem value="Entrepreneur" className="text-white hover:bg-white/10">Entrepreneur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Availability */}
          <div className="space-y-2">
            <Label htmlFor="daily_availability" className="flex items-center gap-2 text-white font-body">
              <Clock className="w-4 h-4 text-green-200" />
              Daily Availability
            </Label>
            <Select
              value={profile.daily_availability}
              onValueChange={(value) => setProfile({ ...profile, daily_availability: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="availability-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4169E1] border-white/20 text-white">
                <SelectItem value="Low" className="text-white hover:bg-white/10">Low (1-2 hours)</SelectItem>
                <SelectItem value="Medium" className="text-white hover:bg-white/10">Medium (2-4 hours)</SelectItem>
                <SelectItem value="High" className="text-white hover:bg-white/10">High (4+ hours)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Focus Areas */}
          <div className="space-y-3">
            <Label className="text-white font-body">Preferred Focus Areas (Choose 2-3)</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center space-x-2"
                  data-testid={`focus-area-${category.toLowerCase().replace('/', '-')}`}
                >
                  <Checkbox
                    id={category}
                    checked={profile.preferred_focus_areas?.includes(category)}
                    onCheckedChange={() => handleFocusAreaToggle(category)}
                    className="border-white/30 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-body text-white cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/70 font-body">
              Selected: {profile.preferred_focus_areas?.length || 0} / 3
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-white/90 text-[#4169E1] font-heading shadow-lg"
            data-testid="save-profile-btn"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
