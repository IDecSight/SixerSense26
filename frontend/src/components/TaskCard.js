import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const TaskCard = ({ task, onComplete, onDismiss }) => {
  const categoryColors = {
    Health: 'bg-green-500/20 border-green-300/30 text-green-200',
    Career: 'bg-blue-500/20 border-blue-300/30 text-blue-200',
    Finance: 'bg-yellow-500/20 border-yellow-300/30 text-yellow-200',
    Relationships: 'bg-pink-500/20 border-pink-300/30 text-pink-200',
    'Spiritual/Mindset': 'bg-purple-500/20 border-purple-300/30 text-purple-200',
    'Travel/Leisure': 'bg-cyan-500/20 border-cyan-300/30 text-cyan-200',
  };

  const runBadgeColor = {
    1: 'bg-green-500/20 text-green-200 border-green-300/40',
    4: 'bg-green-500/30 text-green-200 border-green-300/50',
    6: 'bg-green-500/40 text-green-200 border-green-300/60',
  };

  const isCompleted = task.status === 'completed';
  const isDismissed = task.status === 'dismissed';

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-2xl border-2 bg-white/10 backdrop-blur-lg",
        isCompleted && "border-green-300/50 bg-green-500/10",
        isDismissed && "border-red-300/50 bg-red-500/10",
        !isCompleted && !isDismissed && "border-white/20"
      )}
      data-testid="task-card"
    >
      {/* Status Indicator */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-300"></div>
      )}
      {isDismissed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-300"></div>
      )}

      <div className="p-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-body font-medium uppercase tracking-wider border",
                  categoryColors[task.category] || 'bg-white/10 text-white border-white/30'
                )}
              >
                {task.category}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-mono-score font-bold border-2",
                  runBadgeColor[task.run_value] || 'bg-green-500/20 text-green-200'
                )}
                data-testid="run-value"
              >
                {task.run_value} {task.run_value === 1 ? 'RUN' : 'RUNS'}
              </span>
            </div>
            <h3 className="text-lg font-heading font-semibold leading-tight text-white drop-shadow-md" data-testid="task-title">
              {task.title}
            </h3>
            {task.estimated_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-white/80 font-body">
                <Clock className="w-4 h-4" />
                <span>{task.estimated_minutes} mins</span>
              </div>
            )}
          </div>

          {/* Ball Indicator */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-mono-score text-sm font-bold border-2",
              isCompleted ? "bg-green-500/20 text-green-200 border-green-300" :
              isDismissed ? "bg-red-500/20 text-red-200 border-red-300" :
              "bg-white/10 text-white border-white/30"
            )}>
              {isCompleted ? <Check className="w-5 h-5" /> :
               isDismissed ? <X className="w-5 h-5" /> : '•'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isCompleted && !isDismissed && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onComplete(task.task_id)}
              className="flex-1 h-10 font-heading font-medium bg-white hover:bg-white/90 text-[#4169E1] shadow-lg"
              data-testid="complete-task-btn"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete
            </Button>
            <Button
              onClick={() => onDismiss(task.task_id)}
              variant="outline"
              className="h-10 px-4 border-red-300/50 text-red-200 hover:bg-red-500/10 bg-white/5"
              data-testid="dismiss-task-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm font-heading font-medium text-green-200 pt-2">
            <Check className="w-4 h-4" />
            <span>Task completed! +{task.run_value} runs</span>
          </div>
        )}
      </div>
    </Card>
  );
};
