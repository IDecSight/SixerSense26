import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Wallet as WalletIcon, CreditCard, TrendingUp, Zap } from 'lucide-react';
import apiClient from '../lib/api';
import { toast } from 'sonner';

export const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const [balanceRes, transactionsRes] = await Promise.all([
          apiClient.get('/wallet/balance'),
          apiClient.get('/wallet/transactions')
        ]);
        setBalance(balanceRes.data.balance);
        setIsPremium(balanceRes.data.is_premium);
        setTransactions(transactionsRes.data);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const [buyAmount, setBuyAmount] = useState('');
  const [buyingRuns, setBuyingRuns] = useState(false);

  const handleAddFunds = () => {
    toast.info('Payment integration coming soon!', {
      description: 'Dodo Payments will be integrated shortly'
    });
  };

  const handleBuyRuns = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(buyAmount);
    if (amount > balance) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setBuyingRuns(true);
    try {
      const response = await apiClient.post('/wallet/buy-runs', { amount });
      toast.success('Runs purchased!', {
        description: `+${response.data.runs_added} runs added to today's match`
      });
      setBuyAmount('');
      // Refresh wallet data
      const [balanceRes, transactionsRes] = await Promise.all([
        apiClient.get('/wallet/balance'),
        apiClient.get('/wallet/transactions')
      ]);
      setBalance(balanceRes.data.balance);
      setTransactions(transactionsRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Premium membership required', {
          description: 'Upgrade to premium to buy runs'
        });
      } else {
        toast.error('Failed to purchase runs');
      }
    } finally {
      setBuyingRuns(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4169E1] via-[#5B7FE8] to-[#7494EF]" data-testid="wallet-page">
      <header className="border-b border-white/20 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-white hover:text-yellow-200 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white drop-shadow-lg">
              Wallet
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
            <CardHeader>
              <CardDescription className="text-white/80 font-body">Available Balance</CardDescription>
              <CardTitle className="text-4xl font-mono-score font-bold text-green-200 drop-shadow-lg" data-testid="wallet-balance">
                ${balance.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {isPremium ? (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-200 text-xs font-heading font-bold uppercase">
                    Premium Member
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-heading font-bold uppercase">
                    Free Tier
                  </span>
                )}
              </div>
              <Button onClick={handleAddFunds} className="w-full bg-white hover:bg-white/90 text-[#4169E1] font-heading shadow-lg" data-testid="add-funds-btn">
                <CreditCard className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </CardContent>
          </Card>

          {/* Buy Runs (Premium Only) */}
          {isPremium && (
            <Card className="border-white/20 bg-white/10 backdrop-blur-lg shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-white">
                  <Zap className="w-5 h-5 text-green-200" />
                  Buy Runs
                </CardTitle>
                <CardDescription className="text-white/80 font-body">
                  Convert your wallet balance to game runs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                  <p className="text-sm font-medium text-green-300 mb-1">Exchange Rate</p>
                  <p className="text-2xl font-mono-score font-bold text-green-400">$1 = 10 runs</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount to Convert ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={balance}
                    placeholder="Enter amount"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    data-testid="buy-runs-input"
                  />
                  {buyAmount && parseFloat(buyAmount) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      You will receive: <span className="font-bold text-green-400">{(parseFloat(buyAmount) * 10).toFixed(0)} runs</span>
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleBuyRuns} 
                  disabled={!buyAmount || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) > balance || buyingRuns}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="buy-runs-btn"
                >
                  {buyingRuns ? 'Processing...' : `Buy ${buyAmount ? (parseFloat(buyAmount) * 10).toFixed(0) : 0} Runs`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Premium Features */}
          {!isPremium && (
            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription>
                  Unlock advanced features and boost your productivity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span className="text-sm">Convert wallet balance to runs ($1 = 10 runs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span className="text-sm">Unlimited AI recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span className="text-sm">Access to affiliate rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-1">✓</span>
                    <span className="text-sm">Advanced analytics and insights</span>
                  </li>
                </ul>
                <Button className="w-full" variant="secondary">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WalletIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.transaction_id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-score font-bold">
                          ${tx.amount.toFixed(2)}
                        </p>
                        <p className={`text-xs uppercase ${
                          tx.status === 'completed' ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
