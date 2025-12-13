import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Plus, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const CaptainsCall = ({ matchId, onTaskCreated }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const getRecommendation = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/ai/recommend', {
        match_id: matchId,
        time_available: 30
      });
      setRecommendation(response.data);
      setSelectedTask(null);
    } catch (error) {
      toast.error('Failed to get recommendation');
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
    <Card className="border-deep-teal/20 bg-calm-beige shadow-lg" data-testid="captains-call">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-soft-peach" />
            <CardTitle className="text-xl font-heading font-bold uppercase tracking-tight text-deep-teal">
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
              className="text-deep-teal hover:text-soft-peach"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription className="text-deep-teal/60 font-body">
          AI-powered task recommendation based on your match situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recommendation ? (
          <Button
            onClick={getRecommendation}
            disabled={loading}
            className="w-full h-12 bg-soft-peach hover:bg-soft-peach/90 text-primary-navy font-heading font-medium"
            data-testid="get-recommendation-btn"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
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
            <div className="p-4 rounded-lg bg-white/50 border border-deep-teal/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-md bg-soft-peach/20 text-soft-peach text-xs font-body font-medium uppercase">
                  {recommendation.category}
                </span>
                <span className="px-2 py-1 rounded-full bg-soft-peach/30 text-soft-peach text-xs font-mono-score font-bold">
                  {recommendation.run_value} RUNS
                </span>
              </div>
              <h4 className="font-heading font-semibold text-lg mb-3 text-deep-teal" data-testid="recommendation-task">
                {recommendation.task}
              </h4>
              
              {/* Balance Reasoning */}
              {recommendation.balance_reasoning && (
                <div className="mb-3 p-2 rounded bg-soft-peach/10 border border-soft-peach/20">
                  <p className="text-xs font-body font-medium text-soft-peach uppercase mb-1">Life Balance Insight</p>
                  <p className="text-sm font-body text-deep-teal">{recommendation.balance_reasoning}</p>
                </div>
              )}
              
              <div className="space-y-1.5 mb-3">
                {recommendation.reasoning?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-deep-teal/70 font-body">
                    <span className="text-soft-peach mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Task Options - 3 recommendations */}
              {recommendation.task_options && recommendation.task_options.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-body font-medium text-soft-peach uppercase mb-2">Choose Your Task (Choose 1 of 3)</p>
                  {recommendation.task_options.map((task, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTask(task)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedTask?.run_value === task.run_value
                          ? 'border-soft-peach bg-soft-peach/10 ring-2 ring-soft-peach/30'
                          : 'border-deep-teal/20 bg-white/30 hover:border-soft-peach/40'
                      }`}
                      data-testid={`task-option-${task.run_value}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-heading font-semibold text-sm text-deep-teal">{task.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-soft-peach/20 text-soft-peach text-xs font-mono-score font-bold">
                          {task.run_value} RUNS
                        </span>
                      </div>
                      <p className="text-xs text-deep-teal/60 font-body">{task.description}</p>
                      <p className="text-xs text-soft-peach/60 mt-1 font-body">~{task.estimated_minutes} mins</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Affiliate Product - Elegant Styling */}
              {recommendation.affiliate_product && (
                <div className="mt-4 p-3 rounded-lg bg-soft-peach/5 border border-soft-peach/20">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-soft-peach/20 flex items-center justify-center">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-xs font-body font-medium text-soft-peach uppercase mb-1">Recommended Tool</p>
                        <h5 className="font-heading font-semibold text-sm text-deep-teal">{recommendation.affiliate_product.name}</h5>
                        <p className="text-xs text-deep-teal/60 font-body mt-1">{recommendation.affiliate_product.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono-score font-bold text-soft-peach">{recommendation.affiliate_product.price}</span>
                        <span className="text-xs text-deep-teal/40">•</span>
                        <span className="text-xs text-soft-peach font-body">Earn {recommendation.affiliate_product.run_reward} bonus runs</span>
                      </div>

                      <a
                        href={recommendation.affiliate_product.affiliate_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-soft-peach hover:bg-soft-peach/90 text-primary-navy text-xs font-heading font-medium transition-colors"
                        data-testid="affiliate-link"
                      >
                        View Product
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {recommendation.affiliate_product.action_tasks && recommendation.affiliate_product.action_tasks.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-soft-peach cursor-pointer hover:text-soft-peach/80 font-body">
                            Earn bonus runs after purchase ({recommendation.affiliate_product.action_tasks.length} actions)
                          </summary>
                          <ul className="mt-2 space-y-1 pl-4">
                            {recommendation.affiliate_product.action_tasks.map((action, idx) => (
                              <li key={idx} className="text-xs text-deep-teal/60 flex items-start gap-1 font-body">
                                <span className="text-soft-peach mt-0.5">✓</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={() => addTaskFromRecommendation(selectedTask || recommendation.task_options?.[0] || { title: recommendation.task, run_value: recommendation.run_value })}
              disabled={loading || (recommendation.task_options && !selectedTask)}
              className="w-full h-12 bg-soft-peach hover:bg-soft-peach/90 text-primary-navy font-heading font-medium"
              data-testid="add-recommendation-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              {selectedTask ? `Add ${selectedTask.run_value}-Run Task` : 'Select a Task First'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
