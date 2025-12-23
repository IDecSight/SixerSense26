import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Lock } from 'lucide-react';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const AddTaskModal = ({ open, onOpenChange, onTaskAdded }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Career',
    run_value: 1,
    estimated_minutes: 30,
    sync_to_calendar: false
  });
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const categories = [
    'Health',
    'Career',
    'Finance',
    'Relationships',
    'Spiritual/Mindset',
    'Travel/Leisure'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/tasks', {
        title: formData.title,
        category: formData.category,
        run_value: parseInt(formData.run_value),
        estimated_minutes: parseInt(formData.estimated_minutes)
      });
      toast.success('Task added successfully!');
      setFormData({
        title: '',
        category: 'Career',
        run_value: 1,
        estimated_minutes: 30
      });
      onTaskAdded();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/10 backdrop-blur-lg border-white/20 text-white shadow-2xl" data-testid="add-task-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading uppercase tracking-tight text-white drop-shadow-md">
            Add New Task (Ball)
          </DialogTitle>
          <DialogDescription className="text-white/80 font-body">
            Every task is one ball. Complete it to score runs!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white font-body">Task Description</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete morning workout"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-body"
              data-testid="task-title-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-white font-body">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#4169E1] border-white/20 text-white">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="run_value" className="text-white font-body">Run Value</Label>
              <Select
                value={formData.run_value.toString()}
                onValueChange={(value) => setFormData({ ...formData, run_value: parseInt(value) })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="run-value-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#4169E1] border-white/20 text-white">
                  <SelectItem value="1" className="text-white hover:bg-white/10">1 Run (Low effort)</SelectItem>
                  <SelectItem value="4" className="text-white hover:bg-white/10">4 Runs (Medium)</SelectItem>
                  <SelectItem value="6" className="text-white hover:bg-white/10">6 Runs (High impact)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_minutes" className="text-white font-body">Time (mins)</Label>
              <Input
                id="estimated_minutes"
                type="number"
                min="5"
                max="180"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value })}
                className="bg-white/10 border-white/20 text-white font-body"
                data-testid="time-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-heading"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-white hover:bg-white/90 text-[#4169E1] font-heading shadow-lg" data-testid="submit-task-btn">
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
