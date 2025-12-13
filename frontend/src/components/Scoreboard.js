import React from 'react';
import { Card } from './ui/card';
import { Target, Zap, Shield } from 'lucide-react';
import { formatOvers } from '../lib/utils';

export const Scoreboard = ({ match }) => {
  const progressPercent = (match.total_runs / match.target_score) * 100;
  const wicketsRemaining = 10 - match.total_wickets;

  return (
    <Card 
      className="relative overflow-hidden border-2 border-deep-teal/30 bg-primary-navy shadow-2xl"
      data-testid="scoreboard"
    >
      {/* Scoreboard Header */}
      <div className="relative px-6 py-4 bg-primary-navy border-b-2 border-deep-teal/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-calm-beige/60 uppercase tracking-widest font-body">Today's Match</p>
            <h2 className="text-3xl font-heading font-bold uppercase tracking-tight text-calm-beige" data-testid="match-format">
              {match.format} Format
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-soft-peach/20 border-2 border-soft-peach/40">
            <Zap className="w-5 h-5 text-soft-peach" />
            <span className="text-lg font-heading font-bold uppercase tracking-wide text-calm-beige">
              {match.status === 'won' ? 'WON!' : match.status === 'lost' ? 'LOST' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Display - Elegant Strategic Style */}
      <div className="relative px-6 py-8 bg-gradient-to-b from-primary-navy to-primary-navy/95">
        {/* Score Display - Clean & Professional */}
        <div className="flex items-center justify-center gap-8 mb-6">
          {/* Runs / Wickets */}
          <div className="text-center">
            <div className="font-mono-score text-7xl md:text-8xl font-bold leading-none" data-testid="score-display">
              <span className="runs-color">{match.total_runs}</span>
              <span className="text-calm-beige mx-3">/</span>
              <span className="wickets-color">{match.total_wickets}</span>
            </div>
            <p className="text-sm text-calm-beige/60 mt-3 uppercase tracking-wider font-body">
              Runs / Wickets
            </p>
          </div>
        </div>

        {/* Target & Overs Info - Calm Beige Cards */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-calm-beige/10 border border-deep-teal/30 backdrop-blur-sm">
            <p className="text-xs text-calm-beige/60 uppercase tracking-wider mb-1 font-body">Target</p>
            <p className="font-mono-score text-2xl font-bold text-calm-beige">{match.target_score}</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-calm-beige/10 border border-deep-teal/30 backdrop-blur-sm">
            <p className="text-xs text-calm-beige/60 uppercase tracking-wider mb-1 font-body">Overs</p>
            <p className="font-mono-score text-2xl font-bold text-calm-beige" data-testid="overs">{match.overs.toFixed(1)}</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-calm-beige/10 border border-deep-teal/30 backdrop-blur-sm">
            <p className="text-xs text-calm-beige/60 uppercase tracking-wider mb-1 font-body">Strike Rate</p>
            <p className="font-mono-score text-2xl font-bold text-calm-beige">
              {match.completed_tasks > 0 ? ((match.total_runs / match.completed_tasks) * 100).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* Progress Bar - Soft Peach */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-calm-beige/60 uppercase tracking-wider font-body">Progress to Target</span>
            <span className="font-bold font-mono-score text-soft-peach">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-calm-beige/10 rounded-full overflow-hidden border border-deep-teal/30">
            <div 
              className="h-full bg-gradient-to-r from-soft-peach to-soft-peach/80 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Additional Stats - Soft Colors */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-soft-peach/10 border border-soft-peach/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-soft-peach" />
              <span className="text-xs text-calm-beige/70 uppercase tracking-wider font-body">Runs Needed</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-soft-peach">
              {Math.max(0, match.target_score - match.total_runs)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-dusty-rose/10 border border-dusty-rose/30">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-dusty-rose" />
              <span className="text-xs text-calm-beige/70 uppercase tracking-wider font-body">Wickets Left</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-dusty-rose">
              {wicketsRemaining}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
