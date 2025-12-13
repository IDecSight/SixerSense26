import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const TaskCard = ({ task, onComplete, onDismiss }) => {
  const categoryColors = {
    Health: 'bg-green-500/10 border-green-500/30 text-green-600',
    Career: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
    Finance: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
    Relationships: 'bg-pink-500/10 border-pink-500/30 text-pink-600',
    'Spiritual/Mindset': 'bg-purple-500/10 border-purple-500/30 text-purple-600',
    'Travel/Leisure': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600',
  };

  const runBadgeColor = {
    1: 'bg-secondary/20 text-secondary border-secondary/30',
    4: 'bg-primary/20 text-primary border-primary/30',
    6: 'bg-accent/20 text-accent border-accent/30',
  };

  const isCompleted = task.status === 'completed';
  const isDismissed = task.status === 'dismissed';

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isCompleted && "opacity-60 border-primary/40",
        isDismissed && "opacity-40 border-destructive/40"
      )}
      data-testid="task-card"
    >
      {/* Status Indicator */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
      )}
      {isDismissed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive"></div>
      )}

      <div className="p-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider border",
                  categoryColors[task.category] || 'bg-muted text-muted-foreground'
                )}
              >
                {task.category}
              </span>
              <span
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-mono-score font-bold border",
                  runBadgeColor[task.run_value] || 'bg-muted text-muted-foreground'
                )}
                data-testid="run-value"
              >
                {task.run_value} {task.run_value === 1 ? 'RUN' : 'RUNS'}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-tight" data-testid="task-title">
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
              "w-10 h-10 rounded-full flex items-center justify-center font-mono-score text-sm font-bold",
              isCompleted ? "bg-primary/20 text-primary" :
              isDismissed ? "bg-destructive/20 text-destructive" :
              "bg-muted text-muted-foreground"
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
              className="flex-1 h-10 font-medium"
              data-testid="complete-task-btn"
            >
              <Check className="w-4 h-4 mr-2" />
              Hit
            </Button>
            <Button
              onClick={() => onDismiss(task.task_id)}
              variant="outline"
              className="h-10 px-4"
              data-testid="dismiss-task-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary pt-2">
            <Check className="w-4 h-4" />
            <span>Task completed! +{task.run_value} runs</span>
          </div>
        )}
      </div>
    </Card>
  );
};
