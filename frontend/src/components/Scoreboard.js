import React from 'react';
import { Card } from './ui/card';
import { Target, Zap, Shield } from 'lucide-react';
import { formatOvers } from '../lib/utils';

export const Scoreboard = ({ match }) => {
  const progressPercent = (match.total_runs / match.target_score) * 100;
  const wicketsRemaining = 10 - match.total_wickets;

  return (
    <Card 
      className="relative overflow-hidden border-primary/30 backdrop-blur-sm bg-gradient-to-br from-card/95 to-card/80"
      data-testid="scoreboard"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      <div className="relative p-6 space-y-6">
        {/* Match Format & Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Today's Match</p>
            <h2 className="text-2xl font-teko font-bold uppercase tracking-tight" data-testid="match-format">
              {match.format} Format
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium uppercase tracking-wide">
              {match.status === 'won' ? 'Won!' : match.status === 'lost' ? 'Lost' : 'Live'}
            </span>
          </div>
        </div>

        {/* Main Score Display */}
        <div className="grid grid-cols-2 gap-6">
          {/* Runs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Runs</span>
            </div>
            <div className="font-mono-score text-5xl md:text-6xl font-bold text-primary" data-testid="total-runs">
              {match.total_runs}
            </div>
            <div className="text-sm text-muted-foreground">
              Target: <span className="font-semibold">{match.target_score}</span>
            </div>
          </div>

          {/* Wickets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Wickets</span>
            </div>
            <div className="font-mono-score text-5xl md:text-6xl font-bold text-destructive" data-testid="total-wickets">
              {match.total_wickets}/10
            </div>
            <div className="text-sm text-muted-foreground">
              Remaining: <span className="font-semibold">{wicketsRemaining}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold font-mono-score">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Overs & Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overs</p>
            <p className="font-mono-score text-xl font-bold" data-testid="overs">{match.overs.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Balls</p>
            <p className="font-mono-score text-xl font-bold">{match.completed_tasks}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Strike Rate</p>
            <p className="font-mono-score text-xl font-bold">
              {match.completed_tasks > 0 ? ((match.total_runs / match.completed_tasks) * 100).toFixed(0) : '0'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
