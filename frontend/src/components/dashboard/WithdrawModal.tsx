import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Banknote, CheckCircle2, Loader2, X, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawalService } from '../../services/campaign.service';
import toast from 'react-hot-toast';

interface WithdrawModalProps {
  campaign: {
    _id: string;
    title: string;
    availableBalance: number;
  };
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ campaign, onClose }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const mutation = useMutation({
    mutationFn: () =>
      withdrawalService.create({
        campaignId: campaign._id,
        amount: Number(amount),
        bankDetails: { accountHolder, accountNumber, ifsc, bankName },
      }),
    onSuccess: () => {
      setStep('success');
      // Refresh campaign data + withdrawal history
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-withdrawals', campaign._id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Withdrawal request failed');
      setStep('form');
    },
  });

  const parsedAmount = Number(amount);
  const isValid =
    parsedAmount >= 100 &&
    parsedAmount <= campaign.availableBalance &&
    accountHolder.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    ifsc.trim().length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && step !== 'confirm' && onClose()}
      >
        <motion.div
          initial={{ scale: 0.96, y: 18 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 18 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div className="p-6">
            {step !== 'confirm' && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-[#999] hover:text-[#121212] transition-colors p-1.5 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* ── Form step ── */}
            {step === 'form' && (
              <>
                <div className="flex items-start gap-4 mb-6 pr-8">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Banknote className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-2xl text-[#121212]">
                      Withdraw Funds
                    </h3>
                    <p className="text-sm text-[#666] line-clamp-1 mt-0.5">{campaign.title}</p>
                  </div>
                </div>

                {/* Available balance */}
                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-100 p-4 mb-5">
                  <p className="text-sm text-emerald-700 font-medium mb-1">Available Balance</p>
                  <p className="text-3xl font-black text-emerald-700">
                    ₹{campaign.availableBalance.toLocaleString()}
                  </p>
                </div>

                {/* Amount */}
                <label className="block text-sm font-semibold text-[#333] mb-1.5">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] font-semibold placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 mb-4 transition-colors"
                  placeholder="Enter amount (min ₹100)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={100}
                  max={campaign.availableBalance}
                />

                {/* Bank details */}
                <p className="text-sm font-bold text-[#333] mb-3 mt-2">Bank Account Details</p>

                <input
                  type="text"
                  className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 mb-3 transition-colors text-sm"
                  placeholder="Account Holder Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
                <input
                  type="text"
                  className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 mb-3 transition-colors text-sm"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <input
                    type="text"
                    className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 transition-colors text-sm uppercase"
                    placeholder="IFSC Code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  />
                  <input
                    type="text"
                    className="w-full border-2 border-[#E5E7EB] rounded-2xl px-4 py-3 text-[#121212] placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 transition-colors text-sm"
                    placeholder="Bank Name (optional)"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => setStep('confirm')}
                  disabled={!isValid}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-base flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Banknote className="w-4 h-4" />
                  Request Withdrawal — ₹{(parsedAmount || 0).toLocaleString()}
                </button>
              </>
            )}

            {/* ── Confirm step ── */}
            {step === 'confirm' && (
              <div className="py-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#121212]">Confirm Withdrawal</h3>
                    <p className="text-sm text-[#666]">Please verify the details below</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8F9FC] border-2 border-[#EAEAEA] p-4 mb-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Amount</span>
                    <span className="font-black text-[#121212]">₹{parsedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Account Holder</span>
                    <span className="font-semibold text-[#121212]">{accountHolder}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Account Number</span>
                    <span className="font-semibold text-[#121212]">****{accountNumber.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">IFSC</span>
                    <span className="font-semibold text-[#121212]">{ifsc}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-[#E5E7EB] text-[#555] font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {mutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm & Submit'
                    )}
                  </button>
                </div>
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
                  className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100"
                >
                  <CheckCircle2 className="w-11 h-11 text-emerald-500" />
                </motion.div>
                <h3 className="font-display font-black text-[#121212] text-2xl mb-2">
                  Request Submitted! 🎉
                </h3>
                <p className="text-[#666] mb-2">
                  Your withdrawal of{' '}
                  <strong className="text-[#121212] font-black">₹{parsedAmount.toLocaleString()}</strong>{' '}
                  is now being reviewed.
                </p>
                <p className="text-xs text-gray-400 mb-8">
                  You'll be notified once the transfer is completed.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WithdrawModal;
