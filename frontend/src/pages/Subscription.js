import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRazorpay } from 'react-razorpay';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Crown, Check, Sparkles, Zap, TrendingUp, Gift, Target } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Subscription = () => {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const loadUserStatus = async () => {
      try {
        const response = await apiClient.get('/users/me');
        setIsPremium(response.data.is_premium);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load subscription status');
      } finally {
        setLoading(false);
      }
    };
    loadUserStatus();
  }, []);

  const { Razorpay } = useRazorpay();

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      // Step 1: Create Razorpay order
      const orderResponse = await apiClient.post('/payment/create-order', {
        plan: selectedPlan
      });

      const { order_id, amount, currency, key_id } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "Sixer Sense",
        description: `${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: order_id,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await apiClient.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: selectedPlan
            });

            toast.success('🎉 ' + verifyResponse.data.message, {
              description: `Your ${selectedPlan} subscription is now active!`
            });
            
            setIsPremium(true);
            
            // Refresh page to show premium status
            setTimeout(() => window.location.reload(), 2000);
            
          } catch (verifyError) {
            toast.error('Payment verification failed', {
              description: verifyError.response?.data?.detail || 'Please contact support'
            });
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com"
        },
        theme: {
          color: "#4169E1"
        },
        modal: {
          ondismiss: () => {
            setSubscribing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const razorpayInstance = new Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to initiate payment', {
        description: error.response?.data?.detail || 'Please try again'
      });
      setSubscribing(false);
    }
  };

  const premiumFeatures = [
    {
      icon: <Sparkles className="w-5 h-5 text-yellow-200" />,
      title: "AI Captain Recommendations",
      description: "Get personalized task suggestions based on your goals"
    },
    {
      icon: <Target className="w-5 h-5 text-yellow-200" />,
      title: "Profile & Goal Setting",
      description: "Create custom profiles and track life balance"
    },
    {
      icon: <Gift className="w-5 h-5 text-yellow-200" />,
      title: "Affiliate Rewards",
      description: "Earn bonus runs from recommended products"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-yellow-200" />,
      title: "Advanced Analytics",
      description: "Track productivity insights across 6 life categories"
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-200" />,
      title: "Default Task Generation",
      description: "AI generates balanced daily tasks for you"
    },
    {
      icon: <Crown className="w-5 h-5 text-yellow-200" />,
      title: "Priority Support",
      description: "Get help faster with premium support"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]">
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/home')} 
              className="text-white hover:text-yellow-200 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg">
              Subscription
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {isPremium ? (
          /* Premium User - Already Subscribed */
          <Card className="border-green-200/30 bg-white/10 backdrop-blur-lg shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center shadow-2xl">
                  <Crown className="w-10 h-10 text-[#4169E1]" />
                </div>
              </div>
              <CardTitle className="text-3xl font-heading font-bold text-white">
                Premium Member
              </CardTitle>
              <CardDescription className="text-white/80 text-lg">
                You're unlocking the full power of Sixer Sense!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {premiumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <p className="font-heading font-bold text-white">{feature.title}</p>
                      <p className="text-sm text-white/70 font-body">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center pt-4">
                <p className="text-sm text-white/60 font-body">
                  Need help? Contact support at support@sixersense.app
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Free User - Show Plans */
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-heading font-bold text-white drop-shadow-lg">
                Choose Your Plan
              </h2>
              <p className="text-lg text-white/80 font-body">
                Unlock AI-powered productivity and life balance
              </p>
            </div>

            {/* Plan Selection */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Monthly Plan */}
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedPlan === 'monthly' 
                    ? 'border-yellow-200 bg-white/20 shadow-2xl scale-105' 
                    : 'border-white/20 bg-white/10 hover:bg-white/15'
                } backdrop-blur-lg`}
                onClick={() => setSelectedPlan('monthly')}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-heading font-bold text-white">
                        Monthly
                      </CardTitle>
                      <CardDescription className="text-white/80 font-body">
                        Perfect for trying it out
                      </CardDescription>
                    </div>
                    {selectedPlan === 'monthly' && (
                      <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-heading font-bold text-white">₹99</span>
                      <span className="text-white/60 font-body">/month</span>
                    </div>
                    <p className="text-sm text-white/60 font-body mt-1">Billed monthly</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/90 font-body text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      All premium features
                    </li>
                    <li className="flex items-center gap-2 text-white/90 font-body text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      Cancel anytime
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card 
                className={`cursor-pointer transition-all relative ${
                  selectedPlan === 'yearly' 
                    ? 'border-yellow-200 bg-white/20 shadow-2xl scale-105' 
                    : 'border-white/20 bg-white/10 hover:bg-white/15'
                } backdrop-blur-lg`}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className="absolute top-0 right-0 bg-green-400 text-white text-xs font-heading font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  SAVE 41%
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-heading font-bold text-white">
                        Yearly
                      </CardTitle>
                      <CardDescription className="text-white/80 font-body">
                        Best value for serious users
                      </CardDescription>
                    </div>
                    {selectedPlan === 'yearly' && (
                      <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-heading font-bold text-white">₹699</span>
                      <span className="text-white/60 font-body">/year</span>
                    </div>
                    <p className="text-sm text-green-200 font-body mt-1">
                      Just ₹58/month • Save ₹489/year
                    </p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/90 font-body text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      All premium features
                    </li>
                    <li className="flex items-center gap-2 text-white/90 font-body text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      2 months free
                    </li>
                    <li className="flex items-center gap-2 text-white/90 font-body text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      Priority support
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Features List */}
            <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-xl max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-heading font-bold text-white text-center">
                  What You Get with Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-white/5">
                      <div className="flex-shrink-0">{feature.icon}</div>
                      <div>
                        <p className="font-heading font-bold text-white">{feature.title}</p>
                        <p className="text-sm text-white/70 font-body">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subscribe Button */}
            <div className="text-center space-y-4 max-w-md mx-auto">
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-[#4169E1] font-heading font-bold text-lg py-6 shadow-2xl"
              >
                {subscribing ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5 mr-2" />
                    Subscribe to {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} - ₹{selectedPlan === 'monthly' ? '99' : '699'}
                  </>
                )}
              </Button>
              <p className="text-xs text-white/60 font-body">
                Secure payment via Razorpay • Cancel anytime
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
