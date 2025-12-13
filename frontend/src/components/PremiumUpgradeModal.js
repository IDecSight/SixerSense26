import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X, Crown, Sparkles, TrendingUp, Zap, Gift } from 'lucide-react';

export const PremiumUpgradeModal = ({ open, onClose, onUpgrade, loading }) => {
  if (!open) return null;

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Convert Balance to Runs",
      description: "Turn your wallet balance into game runs (₹1 = 10 runs)"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Unlimited AI Recommendations",
      description: "Get personalized task suggestions anytime"
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: "Affiliate Rewards",
      description: "Earn bonus runs from recommended products"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Advanced Analytics",
      description: "Track your productivity insights and trends"
    }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-8 w-full">
        <Card 
          className="w-full max-w-2xl border-yellow-200/30 bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF] shadow-2xl relative overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        
        <CardHeader className="relative z-10 pb-2">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            data-testid="close-modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center shadow-2xl">
              <Crown className="w-10 h-10 text-[#4169E1]" />
            </div>
          </div>

          <CardTitle className="text-3xl font-heading font-bold text-center text-white mb-2 drop-shadow-lg">
            Upgrade to Premium
          </CardTitle>
          <CardDescription className="text-center text-white/90 text-lg font-body">
            Unlock the full power of Sixer Sense
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 pt-4">
          {/* Welcome Bonus Banner */}
          <div className="bg-gradient-to-r from-yellow-400/20 to-green-400/20 rounded-xl p-4 border-2 border-yellow-200/30 shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <Gift className="w-8 h-8 text-yellow-200" />
              <div>
                <p className="text-lg font-heading font-bold text-white">Welcome Bonus!</p>
                <p className="text-sm text-white/90 font-body">Get ₹100 free added to your wallet</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 text-green-200">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-white text-sm mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-white/80 font-body">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
            <p className="text-sm font-body text-white/80 mb-2">One-Time Upgrade</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-4xl font-heading font-bold text-white drop-shadow-lg">FREE</span>
            </div>
            <p className="text-xs text-green-200 font-body">Limited time offer • Lifetime access</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/30"
              data-testid="cancel-upgrade"
            >
              Maybe Later
            </Button>
            <Button
              onClick={onUpgrade}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-[#4169E1] font-heading font-bold shadow-2xl"
              data-testid="confirm-upgrade"
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  Upgrade Now
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-white/60 font-body">
            No payment required • Instant activation • Cancel anytime
          </p>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;
