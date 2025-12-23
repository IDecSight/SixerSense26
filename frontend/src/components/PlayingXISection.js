import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, CheckCircle, Circle, XCircle } from 'lucide-react';

// Helper function - defined outside component
const getRoleForCategory = (category) => {
  const roles = {
    'Career': 'Batsman',
    'Finance': 'Batsman',
    'Travel/Leisure': 'Batsman',
    'Health': 'All-Rounder',
    'Relationships': 'All-Rounder',
    'Spiritual/Mindset': 'Bowler'
  };
  return roles[category] || 'All-Rounder';
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case 'dismissed':
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Circle className="w-5 h-5 text-white/40" />;
  }
};

export const PlayingXISection = ({ match }) => {
  if (!match || !match.tasks) {
    return null;
  }

  // Get up to 11 tasks for Playing XI
  const playingXI = match.tasks.slice(0, 11).map((task, index) => ({
    position: index + 1,
    name: task.title,
    category: task.category,
    role: getRoleForCategory(task.category),
    run_value: task.run_value,
    status: task.status,
    balls_consumed: task.balls_consumed || 1
  }));

  if (playingXI.length === 0) {
    return null;
  }

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-green-400" />
          Playing XI
        </CardTitle>
        <CardDescription className="text-white/80 font-body">
          Today's 11-player lineup (max 11 tasks)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {playingXI.map((player) => (
            <div
              key={player.position}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-heading font-bold text-white">{player.position}</span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-white leading-tight">{player.name}</p>
                    <p className="text-xs text-white/60 font-body">{player.role}</p>
                  </div>
                </div>
                {getStatusIcon(player.status)}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <span className="text-xs text-white/60 font-body uppercase">{player.category}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 text-xs font-mono-score font-bold">
                    {player.run_value} RUNS
                  </span>
                  <span className="text-xs text-white/60 font-body">
                    {player.balls_consumed} {player.balls_consumed === 1 ? 'ball' : 'balls'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {playingXI.length < 11 && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-400/30">
            <p className="text-sm text-white/80 font-body">
              💡 You have {11 - playingXI.length} empty slot{11 - playingXI.length === 1 ? '' : 's'} in your Playing XI. Add more tasks to complete your team!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
