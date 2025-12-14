import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const TaskTimeline = ({ tasks = [], match }) => {
  // Organize tasks by time periods based on actual timing
  const timeSlots = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    const slots = [
      { name: 'Morning', range: '6 AM - 12 PM', hours: [6, 7, 8, 9, 10, 11], icon: '🌅', tasks: [] },
      { name: 'Afternoon', range: '12 PM - 5 PM', hours: [12, 13, 14, 15, 16], icon: '☀️', tasks: [] },
      { name: 'Evening', range: '5 PM - 9 PM', hours: [17, 18, 19, 20], icon: '🌆', tasks: [] },
      { name: 'Night', range: '9 PM - 12 AM', hours: [21, 22, 23], icon: '🌙', tasks: [] }
    ];
    
    // Safety check for tasks array
    if (!tasks || tasks.length === 0) {
      return slots;
    }

    // Sort tasks by their actual/scheduled start time (sequential order)
    const sortedTasks = [...tasks].sort((a, b) => {
      // Priority: completed_at > started_at > scheduled_start > created_at
      const timeA = a.completed_at || a.started_at || a.scheduled_start || a.created_at || new Date();
      const timeB = b.completed_at || b.started_at || b.scheduled_start || b.created_at || new Date();
      return new Date(timeA) - new Date(timeB);
    });

    // Distribute tasks across time slots based on their timing
    sortedTasks.forEach((task, index) => {
      // Use the most relevant time for placing the task
      let taskTime;
      if (task.status === 'completed' && task.completed_at) {
        taskTime = task.completed_at; // Completed tasks use completion time
      } else if (task.started_at) {
        taskTime = task.started_at; // Started tasks use start time
      } else if (task.scheduled_start) {
        taskTime = task.scheduled_start; // Pending tasks use scheduled time
      } else {
        taskTime = task.created_at; // Fallback to creation time
      }
      
      const taskHour = new Date(taskTime).getHours();
      
      // Find appropriate slot
      const slot = slots.find(s => s.hours.includes(taskHour));
      if (slot) {
        slot.tasks.push(task);
      } else {
        // If hour is before 6 AM or after 11 PM, add to nearest slot
        if (taskHour < 6) slots[0].tasks.push(task);
        else slots[3].tasks.push(task);
      }
    });

    return slots;
  }, [tasks]);

  const getTaskTime = (task) => {
    let time;
    let prefix = '';
    
    if (task.status === 'completed' && task.completed_at) {
      time = task.completed_at;
      prefix = '✓ ';
    } else if (task.started_at) {
      time = task.started_at;
      prefix = '▶ ';
    } else if (task.scheduled_start) {
      time = task.scheduled_start;
      prefix = '⏰ ';
    } else {
      time = task.created_at || new Date();
      prefix = '';
    }
    
    try {
      const timeStr = new Date(time).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return prefix + timeStr;
    } catch (error) {
      console.error('Error formatting task time:', error, task);
      return 'Time N/A';
    }
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return 'text-green-200 border-green-300';
    if (status === 'dismissed') return 'text-red-200 border-red-300';
    return 'text-yellow-200 border-yellow-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'dismissed') return <AlertCircle className="w-4 h-4" />;
    return <Circle className="w-4 h-4" />;
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const dismissedCount = tasks.filter(t => t.status === 'dismissed').length;

  return (
    <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white font-heading">
            <Clock className="w-5 h-5 text-yellow-200" />
            Today's Timeline
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-200" />
              <span className="text-white/90 font-body">{completedCount} Done</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="w-4 h-4 text-yellow-200" />
              <span className="text-white/90 font-body">{pendingCount} Pending</span>
            </div>
            {dismissedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-200" />
                <span className="text-white/90 font-body">{dismissedCount} Dismissed</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <p className="text-white/60 font-body text-lg">No tasks yet</p>
            <p className="text-white/40 font-body text-sm mt-2">Add tasks to see your timeline</p>
          </div>
        ) : (
          <div className="space-y-6">
          {timeSlots.map((slot, slotIndex) => (
            <div key={slot.name} className="relative">
              {/* Time Slot Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                  <span className="text-xl">{slot.icon}</span>
                  <div className="text-left">
                    <h3 className="text-sm font-heading font-bold text-white">{slot.name}</h3>
                    <p className="text-xs text-white/70 font-body">{slot.range}</p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-xs text-white/60 font-body px-2">
                  {slot.tasks.length} task{slot.tasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Tasks in this time slot */}
              {slot.tasks.length > 0 ? (
                <div className="space-y-3 pl-4 border-l-2 border-white/20">
                  {slot.tasks.map((task, taskIndex) => (
                    <div
                      key={task.task_id}
                      className={cn(
                        "relative pl-6 pb-3",
                        taskIndex === slot.tasks.length - 1 && "pb-0"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-0 top-1 -ml-[9px] w-4 h-4 rounded-full border-2 flex items-center justify-center bg-[#4169E1]",
                        getStatusColor(task.status)
                      )}>
                        {task.status === 'completed' && (
                          <div className="w-2 h-2 rounded-full bg-green-300"></div>
                        )}
                      </div>

                      {/* Task card */}
                      <div className={cn(
                        "rounded-lg p-3 border transition-all",
                        task.status === 'completed' 
                          ? "bg-green-500/10 border-green-300/30"
                          : task.status === 'dismissed'
                          ? "bg-red-500/10 border-red-300/30"
                          : "bg-white/5 border-white/20 hover:bg-white/10"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-body font-medium uppercase",
                                task.status === 'completed'
                                  ? "bg-green-500/20 text-green-200"
                                  : task.status === 'dismissed'
                                  ? "bg-red-500/20 text-red-200"
                                  : "bg-yellow-500/20 text-yellow-200"
                              )}>
                                {task.category}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-mono-score font-bold">
                                {task.run_value} {task.run_value === 1 ? 'Run' : 'Runs'}
                              </span>
                            </div>
                            <h4 className={cn(
                              "font-heading font-semibold leading-tight mb-1",
                              task.status === 'completed' ? "text-white line-through" : "text-white"
                            )}>
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-white/70 font-body">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{getTaskTime(task)}</span>
                              </div>
                              {task.estimated_minutes && (
                                <span>• {task.estimated_minutes} mins</span>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-body font-medium",
                            task.status === 'completed'
                              ? "bg-green-500/20 text-green-200"
                              : task.status === 'dismissed'
                              ? "bg-red-500/20 text-red-200"
                              : "bg-yellow-500/20 text-yellow-200"
                          )}>
                            {getStatusIcon(task.status)}
                            <span className="capitalize">{task.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pl-4 py-6 text-center border-l-2 border-white/10">
                  <p className="text-sm text-white/50 font-body italic">No tasks in this time slot</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary at bottom */}
        {tasks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-300/30">
                <p className="text-2xl font-mono-score font-bold text-green-200">{completedCount}</p>
                <p className="text-xs text-white/80 font-body mt-1">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-300/30">
                <p className="text-2xl font-mono-score font-bold text-yellow-200">{pendingCount}</p>
                <p className="text-xs text-white/80 font-body mt-1">Pending</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5 border border-white/20">
                <p className="text-2xl font-mono-score font-bold text-white">{tasks.length}</p>
                <p className="text-xs text-white/80 font-body mt-1">Total Tasks</p>
              </div>
            </div>
          </div>
        )}
        </div>
        )}
      </CardContent>
    </Card>
  );
};
