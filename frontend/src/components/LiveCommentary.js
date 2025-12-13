import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Radio } from 'lucide-react';

export const LiveCommentary = ({ commentary, show, onHide }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && commentary) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onHide) onHide();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, commentary, onHide]);

  if (!visible || !commentary) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4 animate-in slide-in-from-bottom-5">
      <Card className="border-2 border-green-400/50 bg-gradient-to-r from-[#4169E1] via-[#5B7FE8] to-[#7494EF] backdrop-blur-lg shadow-2xl">
        <div className="p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center animate-pulse">
            <Radio className="w-5 h-5 text-green-300" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-body font-semibold text-green-300 uppercase tracking-wide mb-1">
              Live Commentary
            </p>
            <p className="text-base font-heading font-medium text-white leading-relaxed">
              {commentary}
            </p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              if (onHide) onHide();
            }}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LiveCommentary;
