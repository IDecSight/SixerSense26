import React from 'react';
import { Card } from './ui/card';
import { Target, Zap, Shield } from 'lucide-react';
import { formatOvers } from '../lib/utils';

export const Scoreboard = ({ match }) => {
  const progressPercent = (match.total_runs / match.target_score) * 100;
  const wicketsRemaining = 10 - match.total_wickets;

  return (
    <Card 
      className="relative overflow-hidden border-2 border-border bg-card shadow-xl"
      data-testid="scoreboard"
    >
      {/* Scoreboard Header */}
      <div className="relative px-6 py-4 bg-card border-b-2 border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Today's Match</p>
            <h2 className="text-3xl font-teko font-bold uppercase tracking-tight" data-testid="match-format">
              {match.format} Format
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary/20 border-2 border-secondary/40">
            <Zap className="w-5 h-5 text-secondary" />
            <span className="text-lg font-bold uppercase tracking-wide">
              {match.status === 'won' ? 'WON!' : match.status === 'lost' ? 'LOST' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Display - Cricket Style */}
      <div className="relative px-6 py-8 bg-gradient-to-b from-card to-card/80">
        {/* Score Display - Cricket Scoreboard Format */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Runs / Wickets */}
          <div className="text-center">
            <div className="font-mono-score text-7xl md:text-8xl font-bold leading-none" data-testid="score-display">
              <span className="runs-color">{match.total_runs}</span>
              <span className="text-white mx-3">/</span>
              <span className="wickets-color">{match.total_wickets}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 uppercase tracking-wider">
              Runs / Wickets
            </p>
          </div>
        </div>

        {/* Target & Overs Info */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target</p>
            <p className="font-mono-score text-2xl font-bold">{match.target_score}</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overs</p>
            <p className="font-mono-score text-2xl font-bold" data-testid="overs">{match.overs.toFixed(1)}</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Strike Rate</p>
            <p className="font-mono-score text-2xl font-bold">
              {match.completed_tasks > 0 ? ((match.total_runs / match.completed_tasks) * 100).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground uppercase tracking-wider">Progress to Target</span>
            <span className="font-bold font-mono-score">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-muted/30 rounded-full overflow-hidden border border-border/50">
            <div 
              className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-900/30 border border-green-600/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-300 uppercase tracking-wider">Runs Needed</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-green-400">
              {Math.max(0, match.target_score - match.total_runs)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-600/30">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-300 uppercase tracking-wider">Wickets Left</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-red-400">
              {wicketsRemaining}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
