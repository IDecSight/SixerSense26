import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Plus, RefreshCw, Clock, Lock } from 'lucide-react';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const CaptainsCall = ({ matchId, onTaskCreated }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);

  useEffect(() => {
    const checkUserPremiumStatus = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setIsPremium(response.data.is_premium || false);
      } catch (error) {
        console.error('Error fetching user status:', error);
      } finally {
        setCheckingPremium(false);
      }
    };
    checkUserPremiumStatus();
  }, []);

  const getRecommendation = async () => {
    // Check if user is premium first
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/ai/recommend', {
        match_id: matchId,
        time_available: 30
      });
      setRecommendation(response.data);
      setSelectedTask(null);
    } catch (error) {
      if (error.response?.status === 403) {
        // Premium required
        toast.error('Premium Feature', {
          description: 'Upgrade to unlock AI recommendations'
        });
        setShowUpgradeModal(true);
      } else {
        toast.error('Failed to get recommendation');
      }
    } finally {
      setLoading(false);
    }
  };

  const addTaskFromRecommendation = async (taskToAdd) => {
    if (!recommendation) return;
    
    setLoading(true);
    try {
      await apiClient.post('/tasks', {
        title: taskToAdd.title,
        category: recommendation.category,
        run_value: taskToAdd.run_value,
        estimated_minutes: taskToAdd.estimated_minutes || 30
      });
      toast.success('Task added to your match!');
      setRecommendation(null);
      setSelectedTask(null);
      onTaskCreated();
    } catch (error) {
      toast.error('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl" data-testid="captains-call">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-200" />
            <CardTitle className="text-xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-md">
              Captain's Call
            </CardTitle>
          </div>
          {recommendation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={getRecommendation}
              disabled={loading}
              data-testid="recalculate-btn"
              className="text-white hover:text-yellow-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription className="text-white/80 font-body">
          AI-powered recommendations based on your available time and life balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recommendation ? (
          <Button
            onClick={getRecommendation}
            disabled={loading}
            className="w-full h-12 bg-white hover:bg-white/90 text-[#4169E1] font-heading font-medium shadow-lg"
            data-testid="get-recommendation-btn"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing your day...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                What should I do next?
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/20">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-200 text-xs font-body font-medium uppercase border border-green-400/30">
                  {recommendation.category}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-green-500/30 text-green-200 text-xs font-mono-score font-bold border border-green-400/40">
                  {recommendation.run_value} RUNS
                </span>
                {recommendation.estimated_minutes && (
                  <span className="px-2 py-1 rounded-md bg-white/10 text-white/90 text-xs font-body flex items-center gap-1 border border-white/20">
                    <Clock className="w-3 h-3" />
                    {recommendation.estimated_minutes} mins
                  </span>
                )}
              </div>
              <h4 className="font-heading font-semibold text-lg mb-3 text-white drop-shadow-md leading-tight" data-testid="recommendation-task">
                {recommendation.task}
              </h4>
              
              {/* Balance Reasoning */}
              {recommendation.balance_reasoning && (
                <div className="mb-3 p-2 rounded bg-green-500/10 border border-green-400/20">
                  <p className="text-xs font-body font-medium text-green-200 uppercase mb-1">Life Balance Insight</p>
                  <p className="text-sm font-body text-white/90">{recommendation.balance_reasoning}</p>
                </div>
              )}
              
              <div className="space-y-1.5 mb-3">
                {recommendation.reasoning?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-white/80 font-body">
                    <span className="text-green-200 mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Task Options - 3 recommendations with INDIVIDUAL affiliate products */}
              {recommendation.task_options && recommendation.task_options.length > 0 && (
                <div className="mb-4 space-y-3">
                  <p className="text-xs font-body font-medium text-green-200 uppercase mb-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Choose Your Task (1 of 3) - Each with recommended tool
                  </p>
                  {recommendation.task_options.map((task, idx) => (
                    <div key={idx} className={`rounded-lg border transition-all ${
                      selectedTask?.run_value === task.run_value
                        ? 'border-green-300 bg-green-500/20 ring-2 ring-green-300/30'
                        : 'border-white/20 bg-white/5'
                    }`}>
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="w-full text-left p-3 hover:bg-white/5 transition-colors"
                        data-testid={`task-option-${task.run_value}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-heading font-semibold text-sm text-white leading-tight flex-1">
                            {task.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 text-xs font-mono-score font-bold border border-green-400/30 flex-shrink-0">
                            {task.run_value} RUNS
                          </span>
                        </div>
                        <p className="text-xs text-white/70 font-body leading-relaxed mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/10 border border-white/20 w-fit">
                          <Clock className="w-3 h-3 text-green-300" />
                          <span className="text-xs font-body font-medium text-white">
                            ~{task.estimated_minutes} minutes
                          </span>
                        </div>
                      </button>
                      
                      {/* Individual Affiliate Product for THIS specific task */}
                      {task.affiliate_product && (
                        <div className="px-3 pb-3 pt-2 border-t border-white/10 bg-white/5">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/30 flex items-center justify-center">
                                <span className="text-xs">🎁</span>
                              </div>
                              <p className="text-xs font-body font-medium text-green-200">Recommended Tool</p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm font-heading font-semibold text-white leading-tight">
                                {task.affiliate_product.name}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono-score font-bold text-green-300">
                                    {task.affiliate_product.price}
                                  </span>
                                  <span className="text-xs text-white/40">•</span>
                                  <span className="text-xs text-green-200 font-body">
                                    +{task.affiliate_product.run_reward} bonus runs
                                  </span>
                                </div>
                              </div>
                              
                              <a
                                href={task.affiliate_product.affiliate_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-md bg-white hover:bg-white/90 text-[#4169E1] text-xs font-heading font-semibold transition-all shadow-md hover:shadow-lg"
                              >
                                View Product
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => addTaskFromRecommendation(selectedTask || recommendation.task_options?.[0] || { title: recommendation.task, run_value: recommendation.run_value })}
              disabled={loading || (recommendation.task_options && !selectedTask)}
              className="w-full h-12 bg-white hover:bg-white/90 text-[#4169E1] font-heading font-medium shadow-lg"
              data-testid="add-recommendation-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              {selectedTask ? `Add ${selectedTask.run_value}-Run Task (${selectedTask.estimated_minutes}min)` : 'Select a Task First'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
