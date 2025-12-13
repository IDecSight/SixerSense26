import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Trophy, Clock, Target } from 'lucide-react';

export const FormatSelector = ({ onSelectFormat, loading }) => {
  const [selectedFormat, setSelectedFormat] = useState('T20');

  const formats = [
    {
      id: 'T20',
      name: 'T20 Match',
      icon: '⚡',
      description: 'Quick & Intense',
      details: '20 overs • Fast-paced',
      recommended: 'For busy days',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'ODI',
      name: '50-Over Match',
      icon: '🎯',
      description: 'Balanced Challenge',
      details: '50 overs • Steady pace',
      recommended: 'For productive days',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'Test',
      name: 'Test Match',
      icon: '🏆',
      description: 'Epic Marathon',
      details: 'Unlimited overs • All-day grind',
      recommended: 'For focused days',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const handleStart = () => {
    onSelectFormat(selectedFormat);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-white mb-2 drop-shadow-lg">
            Choose Your Match Format
          </CardTitle>
          <CardDescription className="text-white/80 text-lg font-body">
            Select the match type for today's productivity game
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {formats.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all transform hover:scale-105 ${
                  selectedFormat === format.id
                    ? 'border-white bg-white/20 shadow-2xl ring-4 ring-white/30'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
                data-testid={`format-${format.id}`}
              >
                <div className="p-6 text-center space-y-3">
                  <div className="text-5xl mb-2">{format.icon}</div>
                  <h3 className="text-xl font-heading font-bold text-white">
                    {format.name}
                  </h3>
                  <p className="text-sm font-body text-green-200 font-semibold">
                    {format.description}
                  </p>
                  <div className="space-y-1 text-sm text-white/80 font-body">
                    <p className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format.details}
                    </p>
                    <p className="flex items-center justify-center gap-2 text-yellow-200">
                      <Target className="w-4 h-4" />
                      {format.recommended}
                    </p>
                  </div>
                  
                  {selectedFormat === format.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/20">
            <h4 className="text-sm font-heading font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-yellow-200">💡</span>
              Quick Guide
            </h4>
            <ul className="space-y-1 text-xs text-white/80 font-body">
              <li>• <strong className="text-white">6 tasks = 1 over</strong></li>
              <li>• <strong className="text-white">Complete tasks</strong> to score runs</li>
              <li>• <strong className="text-white">Avoid distractions</strong> to save wickets</li>
              <li>• <strong className="text-white">Beat the target</strong> to win bonus runs</li>
            </ul>
          </div>

          <Button
            onClick={handleStart}
            disabled={loading}
            size="lg"
            className="w-full bg-white hover:bg-white/90 text-[#4169E1] font-heading font-bold text-lg py-6 shadow-2xl"
            data-testid="start-match-btn"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 mr-2 animate-spin" />
                Starting Match...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Start {formats.find(f => f.id === selectedFormat)?.name}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormatSelector;
