import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Target, Sparkles, Loader2 } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const GoalPromptModal = ({ open, onClose, onGoalsSet }) => {
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [captainMessage, setCaptainMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!goalText.trim()) {
      toast.error('Please enter your goals');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Parse goals
      const parseResponse = await apiClient.post('/goals/parse', {
        goal_text: goalText
      });
      
      toast.success('Goals analyzed successfully!');
      
      // Step 2: Generate tasks
      const tasksResponse = await apiClient.post('/goals/generate-tasks');
      
      setCaptainMessage(tasksResponse.data.captain_message);
      
      // Show success message
      setTimeout(() => {
        toast.success('Playing XI ready!', {
          description: `${tasksResponse.data.tasks.length} tasks created for today's match`
        });
        
        // Close modal and refresh
        setTimeout(() => {
          onGoalsSet();
          handleClose();
        }, 2000);
      }, 500);
      
    } catch (error) {
      console.error('Goal processing error:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to process goals';
      toast.error('Goal Processing Failed', {
        description: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGoalText('');
    setCaptainMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-[#4169E1] to-[#5B7FE8] border-white/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-yellow-200" />
            <DialogTitle className="text-2xl font-heading font-bold text-white">
              🏏 Set Your Goals – Create Your Game Plan
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/90 font-body text-base">
            Describe your goals freely. You can write short, medium, and long-term goals across life areas (Health, Career, Finance, Relationships, Spiritual, Travel).
            No format required. Just write honestly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Example:
I want to become a director in my career, build an AI product, stay fit, spend quality time with my son, become financially free, and travel more…"
              className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50 font-body focus:border-yellow-200 resize-none"
              disabled={loading}
            />
            <p className="text-xs text-white/60 font-body">
              💡 Be specific about what you want to achieve. The AI will break down your goals into daily tasks.
            </p>
          </div>

          {/* Captain's Response */}
          {captainMessage && (
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-200 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading font-bold text-white mb-1">Captain's Message:</p>
                  <p className="text-white/90 font-body text-sm">{captainMessage}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-heading"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !goalText.trim()}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-[#4169E1] font-heading font-bold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  🎯 Set My Game Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
