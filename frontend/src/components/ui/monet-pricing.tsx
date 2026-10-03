import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Flame,
  Activity
} from 'lucide-react';
import type { MembershipPlan } from '../../types';

interface MonetPricingProps {
  plans: MembershipPlan[];
  loading: boolean;
  onSelectPlan: (plan: MembershipPlan) => void;
}

// 4 Canonical pass tiers: 1 Month, 3 Months, 6 Months, and 1 Year with explicit days
const CANONICAL_PLANS: MembershipPlan[] = [
  {
    id: 'plan-1-month',
    name: '1 Month',
    description: 'Foundational monthly pass for consistent routine & daily progression.',
    duration_in_days: 30,
    price: 1200,
    is_active: true,
  },
  {
    id: 'plan-3-months',
    name: '3 Months',
    description: 'Dedicated hypertrophy cycle for serious athletes targeting visible physique gains.',
    duration_in_days: 90,
    price: 3000,
    is_active: true,
  },
  {
    id: 'plan-6-months',
    name: '6 Months',
    description: 'Mid-term commitment for radical muscle hypertrophy and strength transformation.',
    duration_in_days: 180,
    price: 5000,
    is_active: true,
  },
  {
    id: 'plan-1-year',
    name: '1 Year',
    description: 'Ultimate year-round iron discipline with VIP executive coaching perks.',
    duration_in_days: 365,
    price: 8000,
    is_active: true,
  },
];

// Additional amount added for the "With Cardio" commercial deck upgrade
const CARDIO_ADDON_RATES: Record<number, number> = {
  30: 300,    // 1 Month: +₹300
  90: 600,    // 3 Months: +₹600
  180: 1000,  // 6 Months: +₹1,000
  365: 1500,  // 1 Year: +₹1,500
};


// Smooth numeric counter animation for price transitions
const AnimatedPrice: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const duration = 400; // smooth 400ms transition

    if (startValue === endValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <span>₹{displayValue.toLocaleString('en-IN')}</span>;
};

export const MonetPricing: React.FC<MonetPricingProps> = ({
  plans: apiPlans,
  loading,
  onSelectPlan,
}) => {
  const [withCardio, setWithCardio] = useState(false);

  // Map canonical 1 Month, 3 Months, 6 Months, and 1 Year tiers with backend IDs for checkout
  const displayPlans = CANONICAL_PLANS.map((tier) => {
    const matched = apiPlans.find(
      (p) => Math.abs(p.duration_in_days - tier.duration_in_days) <= 10
    );
    if (matched) {
      return {
        ...tier,
        id: matched.id, // Wire to backend DB plan ID so payments and checkouts succeed
        // Use backend price if specified in realistic currency, otherwise canonical display
        price: Number(matched.price) > 500 ? matched.price : tier.price,
      };
    }
    return tier;
  });

  return (
    <div className="relative w-full select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="text-center max-w-6xl mx-auto mb-8 sm:mb-12 px-2">
        {/* Category Label */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="block text-xs font-heading font-bold text-emerald-400 tracking-widest uppercase"
        >
          TRANSPARENT PASS TIERS
        </motion.span>

        {/* Main Title */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-graduate text-[clamp(1.25rem,4.2vw,3.6rem)] text-white tracking-tight mt-1 uppercase"
        >
          INVEST IN REAL IRON & RESULTS
        </motion.h2>

        {/* "With Cardio" Interactive Toggle Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="pt-6 sm:pt-8 flex justify-center"
        >
          <button
            type="button"
            onClick={() => setWithCardio(!withCardio)}
            className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer min-h-[44px] ${
              withCardio
                ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.45)] border border-emerald-400 scale-105'
                : 'bg-[#12151B] text-neutral-300 hover:text-white border border-white/10 hover:border-emerald-500/40 shadow-lg'
            }`}
          >
            {/* Animated Switch Pill */}
            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
              withCardio ? 'bg-black justify-end' : 'bg-neutral-700 justify-start'
            }`}>
              <motion.div 
                layout 
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-3.5 h-3.5 rounded-full ${withCardio ? 'bg-emerald-400' : 'bg-neutral-400'}`} 
              />
            </div>

            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>WITH CARDIO</span>
            </span>
          </button>
        </motion.div>
      </div>

      {/* Cards Grid: Exactly 4 Tiers (1 Month, 3 Months, 6 Months, 1 Year) */}
      {loading ? (
        <div className="text-center py-16 text-neutral-400 font-heading tracking-wider">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>LOADING IRON PASS TIERS...</span>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 items-stretch"
        >
          <AnimatePresence mode="popLayout">
            {displayPlans.map((plan, index) => {
              const isPopular = plan.duration_in_days === 90;
              const isVIP = plan.duration_in_days === 365;
              const isSixMonth = plan.duration_in_days === 180;

              // Base price and cardio addition
              const basePrice = Number(plan.price);
              const cardioExtra = CARDIO_ADDON_RATES[plan.duration_in_days] || 300;
              const finalPrice = withCardio ? basePrice + cardioExtra : basePrice;

              // Daily rate calculation
              const dailyRate = Math.round(finalPrice / plan.duration_in_days);

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  whileHover={{ y: -8 }}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#141B18] via-[#0E1311] to-[#0A0D0C] border-2 border-emerald-500 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(34,197,94,0.18)] z-20'
                      : isSixMonth
                      ? 'bg-[#12161E]/95 border border-emerald-500/30 hover:border-emerald-500/60 shadow-xl z-10'
                      : 'bg-[#101318]/90 border border-white/10 hover:border-emerald-500/40 shadow-xl z-10'
                  }`}
                >
                  {/* Floating Top Badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-heading font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-1.5 whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 fill-black" />
                      <span>MOST POPULAR CHOICE</span>
                    </div>
                  )}

                  {isVIP && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1F252E] text-emerald-400 border border-emerald-500/30 text-[10px] font-heading font-extrabold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      <span>BEST YEARLY VALUE</span>
                    </div>
                  )}

                  {isSixMonth && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-heading font-extrabold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                      <span>SAVE 30%</span>
                    </div>
                  )}

                  <div>
                    {/* 1. Plan Name & Duration Subtitle */}
                    <div className="mb-3">
                      <h3 className="text-2xl sm:text-3xl font-graduate text-white tracking-tight uppercase">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase mt-1">
                        {plan.duration_in_days} Days Full Access
                      </p>
                    </div>

                    {/* Benefit description */}
                    <p className="text-xs text-neutral-400 min-h-[34px] leading-relaxed mb-4">
                      {plan.description}
                    </p>

                    {/* 2. Hero Price Block with Anchored Daily Rate */}
                    <div className="pt-4 pb-5 border-t border-b border-white/10 mb-5 flex flex-col gap-2.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-graduate text-white tracking-tight">
                          <AnimatedPrice value={finalPrice} />
                        </span>
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-medium">
                          Total
                        </span>
                      </div>

                      {/* High-Impact Daily Rate - Positioned right with the price */}
                      <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#22c55e]" />
                        <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-emerald-400">
                          JUST
                        </span>
                        <span className="text-xs font-black font-heading text-white tracking-tight">
                          <AnimatedPrice value={dailyRate} />
                        </span>
                        <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-emerald-400/90">
                          / DAY
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Action CTA Button */}
                  <div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectPlan({
                        ...plan,
                        name: withCardio ? `${plan.name} (With Cardio)` : plan.name,
                        price: finalPrice,
                        description: withCardio 
                          ? `${plan.description} Includes AC3000 commercial treadmills and cardio zone.`
                          : plan.description,
                      })}
                      className={`w-full py-3.5 rounded-2xl font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        isPopular
                          ? 'bg-[#00E659] hover:bg-[#00cf50] text-black shadow-[0_0_25px_rgba(0,230,89,0.4)]'
                          : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-white border border-white/10'
                      }`}
                    >
                      <span>SELECT PASS</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
