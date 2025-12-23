import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Plus, History, Crown, Settings as SettingsIcon, LogOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { Scoreboard } from '../components/Scoreboard';
import { TaskCard } from '../components/TaskCard';
import { CaptainsCall } from '../components/CaptainsCall';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskTimeline } from '../components/TaskTimeline';
import { FormatSelector } from '../components/FormatSelector';
import { LiveCommentary } from '../components/LiveCommentary';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [startingMatch, setStartingMatch] = useState(false);
  const [commentary, setCommentary] = useState(null);
  const [showCommentary, setShowCommentary] = useState(false);

  const fetchMatch = async () => {
    try {
      const response = await apiClient.get('/matches/today');
      if (response.data === null) {
        // No match exists - show format selector
        setShowFormatSelector(true);
      } else {
        setMatch(response.data);
        setShowFormatSelector(false);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      if (error.response?.status === 401) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async (format) => {
    setStartingMatch(true);
    try {
      console.log('Starting match with format:', format);
      const response = await apiClient.post('/matches/start', { format });
      console.log('Match started successfully:', response.data);
      setMatch(response.data);
      setShowFormatSelector(false);
      toast.success(`${format} match started!`, {
        description: `Target: ${response.data.target_score} runs`
      });
    } catch (error) {
      console.error('Error starting match:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      toast.error('Failed to start match', {
        description: errorMsg
      });
    } finally {
      setStartingMatch(false);
    }
  };

  const handleChangeFormat = async () => {
    try {
      const message = match 
        ? `🔄 Restart Match?\n\nCurrent Progress:\n• Runs: ${match.total_runs || 0}/${match.target_score || 0}\n• Wickets: ${match.total_wickets || 0}/10\n• Tasks: ${match.completed_tasks || 0}\n\nThis will archive your current match and let you start fresh with a new format.\n\nContinue?`
        : "No active match. Select a format to start!";
      
      const confirmed = window.confirm(message);
      
      if (!confirmed) return;
      
      setLoading(true);
      try {
        await apiClient.delete('/matches/today');
        toast.success('Match Restarted Successfully! 🎉', {
          description: 'Choose your format and start fresh'
        });
        setMatch(null);
        setShowFormatSelector(true);
      } catch (error) {
        console.error('Error restarting match:', error);
        if (error.response?.status === 404) {
          // No match exists, just show format selector
          toast.info('Ready to start!', {
            description: 'Select your format to begin'
          });
          setMatch(null);
          setShowFormatSelector(true);
        } else {
          toast.error('Failed to restart match', {
            description: 'Please try again'
          });
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in handleChangeFormat:', error);
      toast.error('Failed to restart match', {
        description: error.message
      });
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

  const generateCommentary = async (eventType, taskData = {}) => {
    try {
      const response = await apiClient.post('/commentary/generate', {
        event_type: eventType,
        task_name: taskData.title,
        category: taskData.category,
        run_value: taskData.run_value,
        current_runs: match.total_runs + (taskData.run_value || 0),
        current_wickets: match.total_wickets,
        match_format: match.format,
        target_score: match.target_score
      });
      setCommentary(response.data.commentary);
      setShowCommentary(true);
    } catch (error) {
      console.error('Failed to generate commentary:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const task = match.tasks.find(t => t.task_id === taskId);
      const response = await apiClient.patch(`/tasks/${taskId}/complete`);
      
      if (response.data.bonus_runs > 0) {
        toast.success('🎉 Match Won!', {
          description: `+${response.data.runs_earned} runs + ${response.data.bonus_runs} bonus runs!`
        });
        // Generate match won commentary
        await generateCommentary('match_won', {});
      } else {
        toast.success(response.data.message, {
          description: `+${response.data.runs_earned} runs earned!`
        });
        // Generate task completion commentary
        if (task) {
          await generateCommentary('task_completed', task);
        }
      }
      
      await fetchMatch();
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
      <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="text-lg font-medium text-white">Loading your match...</p>
        </div>
      </div>
    );
  }

  if (showFormatSelector || (!loading && !match)) {
    return (
      <FormatSelector 
        onSelectFormat={handleStartMatch}
        loading={startingMatch}
      />
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white">Failed to load match</p>
          <Button onClick={fetchMatch} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const pendingTasks = match.tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress') || [];
  const completedTasks = match.tasks?.filter(t => t.status === 'completed') || [];
  const dismissedTasks = match.tasks?.filter(t => t.status === 'dismissed') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]" data-testid="dashboard">
      {/* Header - Glossy Blue Style */}
      <header className="sticky top-0 z-50 border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/home')}
                className="text-white hover:text-green-400 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
                <span className="text-green-400">SIXER</span>
                <span className="text-white ml-1">SENSE</span>
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangeFormat}
                title="Restart Match - Start Fresh"
                className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 border border-yellow-400/30"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                <span className="text-xs font-body">Restart Match</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                data-testid="history-btn"
                className="text-white hover:text-green-400 hover:bg-white/10"
              >
                <History className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline font-body">History</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/subscription')}
                data-testid="subscription-btn"
                className="text-white hover:text-yellow-200 hover:bg-white/10"
              >
                <Crown className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline font-body">Premium</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                data-testid="settings-btn"
                className="text-white hover:text-green-400 hover:bg-white/10"
              >
                <SettingsIcon className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline font-body">Settings</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="logout-btn"
                className="text-red-200 hover:text-red-100 hover:bg-red-500/10"
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
          {/* Left Column - Scoreboard & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <Scoreboard match={match} onChangeFormat={handleChangeFormat} />
            
            {/* Timeline View - Always show */}
            <TaskTimeline tasks={match.tasks || []} match={match} />
            
            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-md">
                  Today's Tasks
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
                <div className="text-center py-12 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                  <p className="text-white/80 mb-4 font-body">No tasks yet. Start your innings!</p>
                  <Button onClick={() => setShowAddTask(true)} className="bg-white hover:bg-white/90 text-[#4169E1] font-heading shadow-lg">
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
                      <summary className="cursor-pointer text-sm font-heading font-medium text-white/80 hover:text-white transition-colors p-2">
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
                      <summary className="cursor-pointer text-sm font-heading font-medium text-white/80 hover:text-white transition-colors p-2">
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
            {/* Captain's Call */}
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

      {/* Live Commentary */}
      <LiveCommentary
        commentary={commentary}
        show={showCommentary}
        onHide={() => setShowCommentary(false)}
      />
    </div>
  );
};

export default Dashboard;
