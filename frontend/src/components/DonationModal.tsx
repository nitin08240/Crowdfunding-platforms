import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Heart, Loader2, Lock, ShieldCheck, X, Receipt } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { donationService } from '../services/campaign.service';
import toast from 'react-hot-toast';
import type { Campaign } from '../types';

interface DonationModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

const AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

const DonationModal: React.FC<DonationModalProps> = ({ campaign, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
  const [donatedAmount, setDonatedAmount] = useState(0);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  /**
   * Invalidate every query that depends on donation/campaign data so
   * React Query refetches all affected UI sections automatically.
   */
  const invalidateAll = () => {
    // User's donation history (DonationsTab, DonorDashboardPage)
    queryClient.invalidateQueries({ queryKey: ['my-donations'] });
    // Dashboard stats (OverviewTab totalDonated card)
    queryClient.invalidateQueries({ queryKey: ['my-stats'] });
    // Campaign page sidebar (raisedAmount, donorCount, % funded)
    queryClient.invalidateQueries({ queryKey: ['campaign', campaign.slug] });
    // Campaign donor list tab
    queryClient.invalidateQueries({ queryKey: ['campaign-donations', campaign._id] });
    // Creator's campaign list (OverviewTab Recent Campaigns)
    queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
    // Campaign Analytics (if the creator is viewing analytics)
    queryClient.invalidateQueries({ queryKey: ['campaign-analytics', campaign._id] });
  };

  const handleDonate = async () => {
    if (!user) { toast.error('Please login to donate'); return; }
    if (!finalAmount || finalAmount < 10) { toast.error('Minimum donation is ₹10'); return; }

    setStep('processing');
    setDonatedAmount(finalAmount);

    try {
      const response = await donationService.createOrder({
        campaignId: campaign._id,
        amount: finalAmount,
        isAnonymous,
        message,
      });
      const order = response.order;

      const razorpayKeyId = response.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const isMockOrder = razorpayKeyId === 'rzp_test_placeholder' || order.id?.startsWith('order_mock_');

      if (isMockOrder) {
        // ── Mock / Development path ──────────────────────────────────────
        try {
          await donationService.verify({
            razorpayOrderId: order.id,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'mock_signature',
          });
          console.log('Mock payment verified successfully (Donation saved)');
          
          // Immediately update UI without page refresh (optimistic update)
          queryClient.setQueryData(['campaign', campaign.slug], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              raisedAmount: oldData.raisedAmount + finalAmount,
              donorCount: oldData.donorCount + 1,
            };
          });

          // Optimistically update dashboard stats
          queryClient.setQueryData(['my-stats'], (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              stats: {
                ...oldData.stats,
                totalDonated: (oldData.stats?.totalDonated || 0) + finalAmount,
                donationCount: (oldData.stats?.donationCount || 0) + 1,
              }
            };
          });

          invalidateAll();

          setStep('success');
          onSuccess?.(finalAmount);
        } catch (verifyErr: any) {
          toast.error(verifyErr.response?.data?.message || 'Payment verification failed');
          setStep('amount');
        }
        return;
      }

      // ── Real Razorpay payment path ────────────────────────────────────
      const loaded = await new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setStep('amount');
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'CrowdFund India',
        description: `Donation to "${campaign.title}"`,
        image: campaign.images?.[0],
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Securely verify payment signature on backend
            await donationService.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            console.log('Payment verified successfully (Donation saved)');
            
            // Immediately update UI without page refresh (optimistic update)
            queryClient.setQueryData(['campaign', campaign.slug], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                raisedAmount: oldData.raisedAmount + finalAmount,
                donorCount: oldData.donorCount + 1,
              };
            });

            // Optimistically update dashboard stats
            queryClient.setQueryData(['my-stats'], (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                stats: {
                  ...oldData.stats,
                  totalDonated: (oldData.stats?.totalDonated || 0) + finalAmount,
                  donationCount: (oldData.stats?.donationCount || 0) + 1,
                }
              };
            });

            invalidateAll();
            
            toast.success("Payment verified successfully!");
            setStep('success');
            onSuccess?.(finalAmount);
          } catch (verifyErr: any) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed');
            setStep('amount');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#7C3AED' },
        modal: {
          ondismiss: () => {
            setStep('amount');
            toast('Payment cancelled. No amount was charged.', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setStep('amount');
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Donation failed. Please try again.');
      setStep('amount');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.96, y: 18 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 18 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

          <div className="p-6">
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-[#999] hover:text-[#121212] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* ── Amount selection step ── */}
            {step === 'amount' && (
              <>
                <div className="flex items-start gap-4 mb-6 pr-8">
                  <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-2xl text-[#121212]">
                      Make a secure donation
                    </h3>
                    <p className="text-sm text-[#666] line-clamp-1 mt-0.5">{campaign.title}</p>
                  </div>
                </div>

                {/* Quick-select amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => { setAmount(a); setCustomAmount(''); }}
                      className={`py-3 rounded-2xl text-sm font-black border-2 transition-all duration-150 ${
                        amount === a && !customAmount
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                          : 'bg-white text-[#121212] border-[#E5E7EB] hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      ₹{a.toLocaleString()}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] font-semibold placeholder:text-gray-400 focus:outline-none focus:border-violet-400 mb-4 transition-colors"
                  placeholder="Custom amount (₹)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min={10}
                />

                <textarea
                  className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] placeholder:text-gray-400 focus:outline-none focus:border-violet-400 resize-none mb-4 transition-colors text-sm"
                  rows={2}
                  placeholder="Leave a message of support (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />

                <label className="flex items-center gap-3 mb-5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous((v) => !v)}
                    className="w-4 h-4 accent-violet-600 rounded"
                  />
                  <span className="text-sm font-semibold text-[#555]">Donate anonymously</span>
                </label>

                {/* Summary box */}
                <div className="rounded-2xl bg-[#F8F9FC] border-2 border-[#EAEAEA] p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[#666]">Donation amount</span>
                    <span className="text-2xl font-black text-[#121212]">
                      ₹{(finalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#666]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Verified Campaign
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-green-600" /> Razorpay Secure
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> SSL Encrypted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 100% Transparent
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDonate}
                  disabled={!finalAmount || finalAmount < 10}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-base flex items-center justify-center gap-2 hover:from-violet-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Donate ₹{(finalAmount || 0).toLocaleString()} Securely
                </button>
              </>
            )}

            {/* ── Processing step ── */}
            {step === 'processing' && (
              <div className="text-center py-14">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping" />
                  <div className="relative w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                  </div>
                </div>
                <h3 className="font-display font-black text-[#121212] text-xl mb-2">
                  Processing payment…
                </h3>
                <p className="text-[#666] text-sm">
                  Please wait while we securely process your payment.
                  <br />Do not close this window.
                </p>
              </div>
            )}

            {/* ── Success step ── */}
            {step === 'success' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                  className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-green-100"
                >
                  <CheckCircle2 className="w-11 h-11 text-green-500" />
                </motion.div>
                <h3 className="font-display font-black text-[#121212] text-3xl mb-2">
                  Thank you! 🎉
                </h3>
                <p className="text-[#666] mb-2">
                  Your donation of{' '}
                  <strong className="text-[#121212] font-black">₹{donatedAmount.toLocaleString()}</strong>{' '}
                  is making a real difference.
                </p>
                <p className="text-xs text-gray-400 mb-8">
                  A confirmation email has been sent to <strong>{user?.email}</strong>
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => { onClose(); window.location.href = '/dashboard/donate'; }}
                    className="px-6 py-3 rounded-2xl border-2 border-[#E5E7EB] text-[#555] font-semibold text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Receipt className="w-4 h-4" /> View Receipt
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DonationModal;
