import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Sunrise, Trophy } from 'lucide-react';

export const DailyRefreshNotice = ({ onStartMatch }) => {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-green-400/50 bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] shadow-2xl">
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center">
              <Sunrise className="w-10 h-10 text-green-300" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Fresh Start! 🌅
            </h2>
            <p className="text-white/90 font-body">
              A new day, a new match. Yesterday is archived. Time to select your format and play!
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-3 border border-white/20">
            <p className="text-sm text-white/80 font-body">
              Every day starts fresh. No carryovers. No baggage. Just pure productivity.
            </p>
          </div>

          <Button
            onClick={() => {
              setShow(false);
              if (onStartMatch) onStartMatch();
            }}
            size="lg"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-heading font-bold"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Start Today's Match
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DailyRefreshNotice;
