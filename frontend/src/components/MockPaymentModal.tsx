import React, { useState } from 'react';
import type { MembershipPlan } from '../types';
import { apiRequest, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, CreditCard, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

interface MockPaymentModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ plan, onClose, onSuccess }) => {
  const { refreshProfile } = useAuth();
  const [outcome, setOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);

  if (!plan) return null;

  const handlePay = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create checkout intent
      const intentRes = await apiRequest<{ paymentId: string; amount: number; transactionRef: string }>('/checkout/create-intent', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id }),
      });

      // 2. Mock payment execution
      const payRes = await apiRequest<{ payment: any; passPurchase: any }>('/checkout/mock-pay', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: intentRes.paymentId,
          simulateOutcome: outcome,
        }),
      });

      if (outcome === 'SUCCESS') {
        setReceiptData(payRes);
        setIsDone(true);
        await refreshProfile();
        onSuccess();
      } else {
        setError('Payment was simulated as FAILED. Your card was not charged.');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Transaction failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#111418] border border-[#232933] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-[#1A1F26] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDone ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto glow-green">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-heading text-white">PAYMENT CONFIRMED</h3>
              <p className="text-sm text-neutral-400 mt-1">Your membership pass is now ACTIVE!</p>
            </div>

            <div className="bg-[#161B22] p-4 rounded-xl border border-[#232933] text-left text-xs space-y-2">
              <div className="flex justify-between text-neutral-300">
                <span>Plan:</span>
                <span className="font-semibold text-white">{plan.name}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Duration:</span>
                <span className="font-semibold text-white">{plan.duration_in_days} Days</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-400">${Number(plan.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400 pt-2 border-t border-[#232933]">
                <span>Transaction Ref:</span>
                <span className="font-mono text-[10px] text-neutral-300">{receiptData?.payment?.transaction_ref || 'CONFIRMED'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              RETURN TO MEMBER PROFILE
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading text-white">ACTIVATE PASS</h3>
                <p className="text-xs text-neutral-400">Sandbox Payment Checkout</p>
              </div>
            </div>

            {/* Plan Info Card */}
            <div className="bg-[#161B22] p-4 rounded-xl border border-[#232933] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-heading font-bold">Selected Tier</span>
                <h4 className="text-lg font-bold text-white font-heading">{plan.name}</h4>
                <p className="text-xs text-neutral-400">{plan.duration_in_days} Days Full Gym Access</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emerald-400 font-heading">${Number(plan.price).toFixed(2)}</span>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest">One-time payment</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Simulation controls */}
            <div className="bg-[#161B22]/60 p-3.5 rounded-xl border border-[#232933] text-xs space-y-2">
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                Simulate Payment Result:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOutcome('SUCCESS')}
                  className={`py-2 px-3 rounded-lg border font-heading font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    outcome === 'SUCCESS'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-[#1F242D] border-[#2D3540] text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Approve (Success)
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome('FAILED')}
                  className={`py-2 px-3 rounded-lg border font-heading font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    outcome === 'FAILED'
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-[#1F242D] border-[#2D3540] text-neutral-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Decline (Fail)
                </button>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-heading font-bold text-base tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Payment Intent...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM PAYMENT (${Number(plan.price).toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
