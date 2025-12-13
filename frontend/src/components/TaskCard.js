import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export const TaskCard = ({ task, onComplete, onDismiss }) => {
  const categoryColors = {
    Health: 'bg-soft-peach/10 border-soft-peach/30 text-soft-peach',
    Career: 'bg-deep-teal/10 border-deep-teal/30 text-deep-teal',
    Finance: 'bg-soft-peach/15 border-soft-peach/40 text-soft-peach',
    Relationships: 'bg-dusty-rose/15 border-dusty-rose/40 text-dusty-rose',
    'Spiritual/Mindset': 'bg-deep-teal/15 border-deep-teal/40 text-deep-teal',
    'Travel/Leisure': 'bg-soft-peach/10 border-soft-peach/30 text-soft-peach',
  };

  const runBadgeColor = {
    1: 'bg-soft-peach/20 text-soft-peach border-soft-peach/40',
    4: 'bg-soft-peach/30 text-soft-peach border-soft-peach/50',
    6: 'bg-soft-peach/40 text-soft-peach border-soft-peach/60',
  };

  const isCompleted = task.status === 'completed';
  const isDismissed = task.status === 'dismissed';

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 bg-calm-beige",
        isCompleted && "border-soft-peach/50 bg-soft-peach/5",
        isDismissed && "border-dusty-rose/50 bg-dusty-rose/5",
        !isCompleted && !isDismissed && "border-deep-teal/20"
      )}
      data-testid="task-card"
    >
      {/* Status Indicator */}
      {isCompleted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-soft-peach to-soft-peach/80"></div>
      )}
      {isDismissed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-dusty-rose to-dusty-rose/80"></div>
      )}

      <div className="p-4 space-y-3">
        {/* Task Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-body font-medium uppercase tracking-wider border",
                  categoryColors[task.category] || 'bg-deep-teal/10 text-deep-teal border-deep-teal/30'
                )}
              >
                {task.category}
              </span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-mono-score font-bold border-2",
                  runBadgeColor[task.run_value] || 'bg-soft-peach/20 text-soft-peach'
                )}
                data-testid="run-value"
              >
                {task.run_value} {task.run_value === 1 ? 'RUN' : 'RUNS'}
              </span>
            </div>
            <h3 className="text-lg font-heading font-semibold leading-tight text-deep-teal" data-testid="task-title">
              {task.title}
            </h3>
            {task.estimated_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-deep-teal/60 font-body">
                <Clock className="w-4 h-4" />
                <span>{task.estimated_minutes} mins</span>
              </div>
            )}
          </div>

          {/* Ball Indicator */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-mono-score text-sm font-bold border-2",
              isCompleted ? "bg-soft-peach/20 text-soft-peach border-soft-peach" :
              isDismissed ? "bg-dusty-rose/20 text-dusty-rose border-dusty-rose" :
              "bg-deep-teal/10 text-deep-teal border-deep-teal/30"
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
              className="flex-1 h-10 font-heading font-medium bg-soft-peach hover:bg-soft-peach/90 text-primary-navy"
              data-testid="complete-task-btn"
            >
              <Check className="w-4 h-4 mr-2" />
              Complete
            </Button>
            <Button
              onClick={() => onDismiss(task.task_id)}
              variant="outline"
              className="h-10 px-4 border-dusty-rose/50 text-dusty-rose hover:bg-dusty-rose/10 bg-calm-beige"
              data-testid="dismiss-task-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm font-heading font-medium text-soft-peach pt-2">
            <Check className="w-4 h-4" />
            <span>Task completed! +{task.run_value} runs</span>
          </div>
        )}
      </div>
    </Card>
  );
};
