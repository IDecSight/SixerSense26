import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Plus, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const CaptainsCall = ({ matchId, onTaskCreated }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const getRecommendation = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/ai/recommend', {
        match_id: matchId,
        time_available: 30
      });
      setRecommendation(response.data);
    } catch (error) {
      toast.error('Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const addTaskFromRecommendation = async () => {
    if (!recommendation) return;
    
    setLoading(true);
    try {
      await apiClient.post('/tasks', {
        title: recommendation.task,
        category: recommendation.category,
        run_value: recommendation.run_value,
        estimated_minutes: 30
      });
      toast.success('Task added to your match!');
      setRecommendation(null);
      onTaskCreated();
    } catch (error) {
      toast.error('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10" data-testid="captains-call">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <CardTitle className="text-xl font-teko uppercase tracking-tight">
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
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        <CardDescription>
          AI-powered task recommendation based on your match situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recommendation ? (
          <Button
            onClick={getRecommendation}
            disabled={loading}
            className="w-full h-12"
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
            <div className="p-4 rounded-lg bg-card border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-md bg-accent/20 text-accent text-xs font-medium uppercase">
                  {recommendation.category}
                </span>
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-mono-score font-bold">
                  {recommendation.run_value} RUNS
                </span>
              </div>
              <h4 className="font-semibold text-lg mb-3" data-testid="recommendation-task">
                {recommendation.task}
              </h4>
              
              {/* Balance Reasoning */}
              {recommendation.balance_reasoning && (
                <div className="mb-3 p-2 rounded bg-accent/10 border border-accent/20">
                  <p className="text-xs font-medium text-accent uppercase mb-1">Life Balance Insight</p>
                  <p className="text-sm text-foreground">{recommendation.balance_reasoning}</p>
                </div>
              )}
              
              <div className="space-y-1.5">
                {recommendation.reasoning?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={addTaskFromRecommendation}
              disabled={loading}
              className="w-full h-12"
              data-testid="add-recommendation-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Match
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
