import React from 'react';
import { Card } from './ui/card';
import { Target, Zap, Shield, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { formatOvers } from '../lib/utils';

export const Scoreboard = ({ match, onChangeFormat }) => {
  const progressPercent = (match.total_runs / match.target_score) * 100;
  const wicketsRemaining = 10 - match.total_wickets;
  const canChangeFormat = match.completed_tasks === 0 && match.total_runs === 0;
  const canRestart = true; // Always allow restart

  return (
    <Card 
      className="relative overflow-hidden border-2 border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl"
      data-testid="scoreboard"
    >
      {/* Scoreboard Header */}
      <div className="relative px-6 py-4 bg-white/5 border-b-2 border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-widest font-body">Today's Match</p>
              <h2 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg" data-testid="match-format">
                {match.format} Format
              </h2>
            </div>
            {onChangeFormat && canRestart && (
              <Button
                onClick={onChangeFormat}
                size="sm"
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 hover:text-yellow-100 text-xs border border-yellow-400/40 font-heading font-semibold"
                title="Restart match - Start fresh with new format"
                data-testid="restart-match-btn"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Restart Match
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500/20 border-2 border-green-300/40">
            <Zap className="w-5 h-5 text-green-200" />
            <span className="text-lg font-heading font-bold uppercase tracking-wide text-white">
              {match.status === 'won' ? 'WON!' : match.status === 'lost' ? 'LOST' : 'LIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Scoreboard Display */}
      <div className="relative px-6 py-8">
        {/* Score Display */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="font-mono-score text-7xl md:text-8xl font-bold leading-none drop-shadow-2xl" data-testid="score-display">
              <span className="text-green-300">{match.total_runs}</span>
              <span className="text-white mx-3">/</span>
              <span className="text-red-300">{match.total_wickets}</span>
            </div>
            <p className="text-sm text-white/70 mt-3 uppercase tracking-wider font-body">
              Runs / Wickets
            </p>
          </div>
        </div>

        {/* Target & Overs Info */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20 backdrop-blur-sm">
            <p className="text-xs text-white/70 uppercase tracking-wider mb-1 font-body">Target</p>
            <p className="font-mono-score text-2xl font-bold text-white">{match.target_score}</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20 backdrop-blur-sm">
            <p className="text-xs text-white/70 uppercase tracking-wider mb-1 font-body">Overs</p>
            <p className="font-mono-score text-2xl font-bold text-white" data-testid="overs">{match.overs.toFixed(1)}</p>
          </div>

          <div className="text-center p-4 rounded-lg bg-white/5 border border-white/20 backdrop-blur-sm">
            <p className="text-xs text-white/70 uppercase tracking-wider mb-1 font-body">Strike Rate</p>
            <p className="font-mono-score text-2xl font-bold text-white">
              {match.completed_tasks > 0 ? ((match.total_runs / match.completed_tasks) * 100).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/70 uppercase tracking-wider font-body">Progress to Target</span>
            <span className="font-bold font-mono-score text-green-200">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-200" />
              <span className="text-xs text-white/80 uppercase tracking-wider font-body">Runs Needed</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-green-200">
              {Math.max(0, match.target_score - match.total_runs)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-red-200" />
              <span className="text-xs text-white/80 uppercase tracking-wider font-body">Wickets Left</span>
            </div>
            <p className="font-mono-score text-2xl font-bold text-red-200">
              {wicketsRemaining}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
