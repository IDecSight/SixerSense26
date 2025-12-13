import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const TaskCard = ({ task, onComplete, onDismiss }) => {
  const categoryColors = {
    Health: 'bg-green-500/20 border-green-500/50 text-green-300',
    Career: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    Finance: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
    Relationships: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
    'Spiritual/Mindset': 'bg-purple-500/20 border-purple-500/50 text-purple-300',
    'Travel/Leisure': 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
  };

  const runBadgeColor = {
    1: 'bg-secondary/30 text-secondary-foreground border-secondary/50',
    4: 'bg-green-600/30 text-green-300 border-green-500/50',
    6: 'bg-green-600/40 text-green-200 border-green-400/60',
  };

  const isCompleted = task.status === 'completed';
  const isDismissed = task.status === 'dismissed';

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
        isCompleted && "border-green-500/50 bg-green-900/20",
        isDismissed && "border-red-500/50 bg-red-900/20",
        !isCompleted && !isDismissed && "border-border bg-card"
      )}
      data-testid="task-card"
    >
      {/* Status Indicator */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-green-500"></div>
      )}
      {isDismissed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-500"></div>
      )}

      <div className="p-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider border",
                  categoryColors[task.category] || 'bg-muted/30 text-muted-foreground'
                )}
              >
                {task.category}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-mono-score font-bold border-2",
                  runBadgeColor[task.run_value] || 'bg-muted/30 text-muted-foreground'
                )}
                data-testid="run-value"
              >
                {task.run_value} {task.run_value === 1 ? 'RUN' : 'RUNS'}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-tight text-white" data-testid="task-title">
              {task.title}
            </h3>
            {task.estimated_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{task.estimated_minutes} mins</span>
              </div>
            )}
          </div>

          {/* Ball Indicator */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-mono-score text-sm font-bold border-2",
              isCompleted ? "bg-green-600/30 text-green-300 border-green-500" :
              isDismissed ? "bg-red-600/30 text-red-300 border-red-500" :
              "bg-muted/30 text-muted-foreground border-muted"
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
              className="flex-1 h-10 font-medium bg-green-600 hover:bg-green-700 text-white"
              data-testid="complete-task-btn"
            >
              <Check className="w-4 h-4 mr-2" />
              Hit
            </Button>
            <Button
              onClick={() => onDismiss(task.task_id)}
              variant="outline"
              className="h-10 px-4 border-red-500/50 text-red-300 hover:bg-red-900/20"
              data-testid="dismiss-task-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-400 pt-2">
            <Check className="w-4 h-4" />
            <span>Task completed! +{task.run_value} runs</span>
          </div>
        )}
      </div>
    </Card>
  );
};
