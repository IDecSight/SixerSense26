import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const AddTaskModal = ({ open, onOpenChange, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Career',
    run_value: 1,
    estimated_minutes: 30
  });
  const [loading, setLoading] = useState(false);

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
      <DialogContent data-testid="add-task-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-teko uppercase tracking-tight">
            Add New Task (Ball)
          </DialogTitle>
          <DialogDescription>
            Every task is one ball. Complete it to score runs!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Description</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete morning workout"
              data-testid="task-title-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger data-testid="category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="run_value">Run Value</Label>
              <Select
                value={formData.run_value.toString()}
                onValueChange={(value) => setFormData({ ...formData, run_value: parseInt(value) })}
              >
                <SelectTrigger data-testid="run-value-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Run (Low effort)</SelectItem>
                  <SelectItem value="4">4 Runs (Medium)</SelectItem>
                  <SelectItem value="6">6 Runs (High impact)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_minutes">Time (mins)</Label>
              <Input
                id="estimated_minutes"
                type="number"
                min="5"
                max="180"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value })}
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} data-testid="submit-task-btn">
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
