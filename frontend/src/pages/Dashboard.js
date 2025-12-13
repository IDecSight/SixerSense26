import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, History, Wallet, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Scoreboard } from '../components/Scoreboard';
import { TaskCard } from '../components/TaskCard';
import { CaptainsCall } from '../components/CaptainsCall';
import { AddTaskModal } from '../components/AddTaskModal';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  const fetchMatch = async () => {
    try {
      const response = await apiClient.get('/matches/today');
      setMatch(response.data);
    } catch (error) {
      console.error('Error fetching match:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchMatch();
  }, []);

  const handleFormatChange = async (format) => {
    try {
      const response = await apiClient.post('/matches/update-format', {
        match_id: match.match_id,
        format: format
      });
      toast.success('Match format updated!', {
        description: `Target set to ${response.data.target_score} runs`
      });
      fetchMatch();
    } catch (error) {
      toast.error('Failed to update format');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await apiClient.patch(`/tasks/${taskId}/complete`);
      
      if (response.data.bonus_runs > 0) {
        toast.success('🎉 Match Won!', {
          description: `+${response.data.runs_earned} runs + ${response.data.bonus_runs} bonus runs!`
        });
      } else {
        toast.success(response.data.message, {
          description: `+${response.data.runs_earned} runs earned!`
        });
      }
      fetchMatch();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDismissTask = async (taskId) => {
    try {
      const response = await apiClient.patch(`/tasks/${taskId}/distraction`);
      toast.error('Wicket lost!', {
        description: `${10 - response.data.total_wickets} wickets remaining`
      });
      fetchMatch();
    } catch (error) {
      toast.error('Failed to dismiss task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg font-medium">Loading your match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Failed to load match</p>
          <Button onClick={fetchMatch} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const pendingTasks = match.tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress') || [];
  const completedTasks = match.tasks?.filter(t => t.status === 'completed') || [];
  const dismissedTasks = match.tasks?.filter(t => t.status === 'dismissed') || [];

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-teko font-bold tracking-tight">
                <span className="text-primary">SIXER</span>
                <span className="text-accent ml-1">SENSE</span>
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                data-testid="history-btn"
              >
                <History className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">History</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/wallet')}
                data-testid="wallet-btn"
              >
                <Wallet className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Wallet</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                data-testid="settings-btn"
              >
                <SettingsIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Scoreboard & AI */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Format Selector */}
            {match && match.status === 'in_progress' && match.completed_tasks === 0 && (
              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Match Format</p>
                      <p className="text-xs text-muted-foreground">Choose your format before starting</p>
                    </div>
                    <Select 
                      value={match.format} 
                      onValueChange={(value) => {
                        if (value !== match.format) {
                          handleFormatChange(value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]" data-testid="format-selector">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T20">T20 (20 overs, Target: 60)</SelectItem>
                        <SelectItem value="ODI">ODI (50 overs, Target: 150)</SelectItem>
                        <SelectItem value="Test">Test Match (Target: 100)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Scoreboard match={match} />
            
            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-teko font-bold uppercase tracking-tight">
                  Today's Balls
                </h2>
                <Button
                  onClick={() => setShowAddTask(true)}
                  size="sm"
                  data-testid="add-task-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {match.tasks?.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">No tasks yet. Start your innings!</p>
                  <Button onClick={() => setShowAddTask(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="space-y-3">
                      {pendingTasks.map((task) => (
                        <TaskCard
                          key={task.task_id}
                          task={task}
                          onComplete={handleCompleteTask}
                          onDismiss={handleDismissTask}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks.length > 0 && (
                    <details className="group" open={completedTasks.length < 5}>
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2">
                        Completed Tasks ({completedTasks.length})
                      </summary>
                      <div className="space-y-3 mt-2">
                        {completedTasks.map((task) => (
                          <TaskCard
                            key={task.task_id}
                            task={task}
                            onComplete={handleCompleteTask}
                            onDismiss={handleDismissTask}
                          />
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Dismissed Tasks */}
                  {dismissedTasks.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2">
                        Dismissed Tasks ({dismissedTasks.length})
                      </summary>
                      <div className="space-y-3 mt-2">
                        {dismissedTasks.map((task) => (
                          <TaskCard
                            key={task.task_id}
                            task={task}
                            onComplete={handleCompleteTask}
                            onDismiss={handleDismissTask}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Captain's Call */}
          <div className="space-y-6">
            <CaptainsCall matchId={match.match_id} onTaskCreated={fetchMatch} />
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAddTask}
        onOpenChange={setShowAddTask}
        onTaskAdded={fetchMatch}
      />
    </div>
  );
};

export default Dashboard;
