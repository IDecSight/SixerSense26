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
              
              <div className="space-y-1.5 mb-3">
                {recommendation.reasoning?.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-accent mt-0.5">•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Affiliate Product */}
              {recommendation.affiliate_product && (
                <div className="mt-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/30 flex items-center justify-center">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-green-400 uppercase mb-1">Recommended Tool</p>
                        <h5 className="font-semibold text-sm text-white">{recommendation.affiliate_product.name}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{recommendation.affiliate_product.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-400">{recommendation.affiliate_product.price}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-green-400">Earn {recommendation.affiliate_product.run_reward} bonus runs</span>
                      </div>

                      <a
                        href={recommendation.affiliate_product.affiliate_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
                        data-testid="affiliate-link"
                      >
                        View Product
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {recommendation.affiliate_product.action_tasks && recommendation.affiliate_product.action_tasks.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-green-400 cursor-pointer hover:text-green-300">
                            Earn bonus runs after purchase ({recommendation.affiliate_product.action_tasks.length} actions)
                          </summary>
                          <ul className="mt-2 space-y-1 pl-4">
                            {recommendation.affiliate_product.action_tasks.map((action, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">✓</span>
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
