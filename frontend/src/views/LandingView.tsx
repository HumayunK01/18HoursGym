import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import type { MembershipPlan } from '../types';
import { MockPaymentModal } from '../components/MockPaymentModal';
import { ScrollReveal } from '../components/ScrollReveal';
import { InfiniteRibbon } from '@/components/ui/infinite-ribbon';
import { GymCarousel } from '@/components/ui/gym-carousel';
import { MonetPricing } from '@/components/ui/monet-pricing';
import { 
  Dumbbell, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Award
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const plansData = await apiRequest<MembershipPlan[]>('/plans');
        setPlans(plansData);
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchLandingData();
  }, []);

  const handleBuyPass = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setSelectedPlanForCheckout(plan);
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-neutral-100 overflow-hidden">
      
      {/* 1. CINEMATIC HERO SECTION (Matching User Reference) */}
      <section className="relative min-h-[92vh] sm:min-h-screen flex items-end pb-16 sm:pb-24 pt-32 sm:pt-40 overflow-hidden">
        {/* Full-bleed background athlete image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-athlete.jpg"
            alt="18 Hours Fitness Bodybuilder Training Cable Crossover"
            className="w-full h-full object-cover object-[center_20%] md:object-center filter brightness-105 contrast-105"
          />
          {/* Subtle cinematic gradient so athlete is clearly visible while text remains 100% legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/35 to-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#090A0C]/75 via-[#090A0C]/25 to-transparent"></div>
        </div>

        {/* Content Container (Lower-Third Left Aligned) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-3xl space-y-4 sm:space-y-5">
            
            {/* Meta Badge: ● EST. 2018 // MUMBRA */}
            <ScrollReveal direction="down" delayMs={50}>
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-heading font-black tracking-widest text-[#00E659] uppercase">
                <span className="w-2 h-2 rounded-full bg-[#00E659] shadow-[0_0_10px_#00E659] animate-pulse"></span>
                <span>EST. 2018 // MUMBRA</span>
              </div>
            </ScrollReveal>

            {/* Bold Headline: BUILT FOR PEOPLE WHO TRAIN. (Graduate Font) */}
            <ScrollReveal direction="up" delayMs={100}>
              <h1 className="font-graduate text-[clamp(2.1rem,7.5vw,5.2rem)] tracking-tight leading-[0.96] text-white uppercase">
                BUILT FOR PEOPLE WHO TRAIN.
              </h1>
            </ScrollReveal>

            {/* Sub-headline: Look in the mirror, thats your competition */}
            <ScrollReveal direction="up" delayMs={160}>
              <p className="text-base sm:text-lg md:text-xl text-neutral-300 font-normal leading-relaxed max-w-xl">
                LOOK IN THE MIRROR. THAT'S YOUR COMPETITION.
              </p>
            </ScrollReveal>

            {/* CTA Buttons: [JOIN NOW →] [VIEW PLANS] */}
            <ScrollReveal direction="up" delayMs={220}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-md bg-[#00E659] hover:bg-[#00cf50] text-black font-heading font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,230,89,0.4)] hover:shadow-[0_0_35px_rgba(0,230,89,0.65)] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>JOIN NOW</span>
                  <span className="text-base sm:text-lg font-bold leading-none">→</span>
                </button>

                <a
                  href="#passes"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('passes');
                    if (el) {
                      const navOffset = 90;
                      window.scrollTo({
                        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
                        behavior: 'smooth',
                      });
                    }
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-md bg-[#1B1F26] hover:bg-[#252B35] text-neutral-200 hover:text-white border border-[#2B3340] font-heading font-bold text-xs sm:text-sm tracking-wider uppercase hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>VIEW PLANS</span>
                </a>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* INFINITE ATHLETIC RIBBON (Crossed 'X' Tape Effect with Feathered Top & Bottom Masks) */}
      <div 
        className="relative overflow-hidden py-20 sm:py-28 bg-[#090A0C] flex items-center justify-center min-h-[200px] sm:min-h-[260px] mask-fade-y"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        {/* Subtle radial emerald illumination with smooth edge dissipation */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12)_0%,rgba(34,197,94,0.03)_50%,transparent_75%)] pointer-events-none"></div>

        {/* Top & bottom soft feathered edge blends */}
        <div className="absolute top-0 inset-x-0 h-14 sm:h-20 bg-gradient-to-b from-[#090A0C] via-[#090A0C]/80 to-transparent z-30 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-14 sm:h-20 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/80 to-transparent z-30 pointer-events-none" />

        {/* Primary Vibrant Neon Emerald Ribbon (Tilted -3.5deg) */}
        <div className="absolute w-[115%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <InfiniteRibbon 
            duration={50} 
            repeat={6}
            rotation={-3.5}
            className="bg-[#00E659] text-black font-heading font-black tracking-widest text-sm sm:text-base py-3 shadow-[0_0_35px_rgba(0,230,89,0.35)] dark:bg-[#00E659] dark:text-black border-y-2 border-black/30 select-none pointer-events-auto"
          >
            <span className="inline-flex items-center gap-6">
              <span>OPEN 18 HOURS DAILY (5:00 AM – 11:00 PM)</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>UNFORGIVING DISCIPLINE</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>OLD-SCHOOL HEAVY STEEL</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>MUMBRA'S PREMIER IRON ARSENAL</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>ZERO COMMERCIAL GIMMICKS</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>FOUNDED BY COACH IMRAN SHAIKH</span>
              <span className="text-black/60 text-xs">✦</span>
              <span>NO LOCK-IN CONTRACTS</span>
              <span className="text-black/60 text-xs">✦</span>
            </span>
          </InfiniteRibbon>
        </div>

        {/* Secondary Stealth Iron Counter-Ribbon (Tilted +3.5deg, Crossing in Center) */}
        <div className="absolute w-[115%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <InfiniteRibbon 
            duration={56} 
            repeat={6}
            reverse={true} 
            rotation={3.5}
            className="bg-[#11141A] text-emerald-400 font-heading font-extrabold tracking-widest text-xs sm:text-sm py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.85)] dark:bg-[#11141A] dark:text-emerald-400 border-y border-emerald-500/40 select-none pointer-events-auto backdrop-blur-sm"
          >
            <span className="inline-flex items-center gap-6">
              <span>PLATE-LOADED HACK SQUAT & LINEAR LEG PRESS</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
              <span>COMMERCIAL DUAL CABLE CROSSOVER</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
              <span>ISO-LATERAL ROWS & CHEST PRESS</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
              <span>1-ON-1 TRANSFORMATION COACHING</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
              <span>CALL DIRECT: +91 90045 44879</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
              <span>DAY PASSES & MONTHLY PLANS</span>
              <span className="text-emerald-500/50 text-xs">⚡</span>
            </span>
          </InfiniteRibbon>
        </div>
      </div>

      {/* 2. REAL EQUIPMENT & GYM FLOOR SHOWCASE (Interactive Visual Carousel) */}
      <section id="equipment" className="py-20 sm:py-28 bg-[#090A0C] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <ScrollReveal direction="up" delayMs={50}>
            <div className="text-center max-w-6xl mx-auto mb-8 sm:mb-12 px-2">
              <span className="text-xs font-heading font-bold text-emerald-400 tracking-widest uppercase">
                AUTHENTIC TRAINING ARSENAL
              </span>
              <h2 className="font-graduate text-[clamp(1.25rem,4.2vw,3.6rem)] text-white tracking-tight mt-1 uppercase">
                EQUIPPED FOR SERIOUS LIFTERS
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delayMs={100}>
            <GymCarousel />
          </ScrollReveal>

        </div>
      </section>

      {/* 3. MEMBERSHIP PASSES & PRICING (Monet Architecture) */}
      <section id="passes" className="py-20 sm:py-28 bg-[#090A0C] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MonetPricing
            plans={plans}
            loading={loadingPlans}
            onSelectPlan={handleBuyPass}
          />
        </div>
      </section>

      {/* 4. HEAD COACH & GYM ETHOS */}
      <section id="founder" className="py-20 sm:py-28 bg-[#090A0C] scroll-mt-20 relative">
        {/* Subtle ambient glow */}
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            
            {/* Left Column: Head Coach Card */}
            <div className="lg:col-span-5 flex">
              <ScrollReveal direction="left" delayMs={50} className="w-full flex">
                <div className="w-full rounded-3xl bg-gradient-to-b from-[#141B18] via-[#0E1311] to-[#0A0D0C] border-2 border-emerald-500/40 hover:border-emerald-500/70 p-6 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(34,197,94,0.12)] relative overflow-hidden flex flex-col justify-between transition-all duration-300 group">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                  <div>
                    {/* Coach Badge & Icon */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.2)] group-hover:scale-105 transition-transform duration-300">
                        <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-heading font-black text-emerald-400 tracking-widest uppercase shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                        PRO TRAINER
                      </span>
                    </div>

                    <span className="text-xs font-heading font-bold text-emerald-400 tracking-widest uppercase block">
                      HEAD COACH & FOUNDER
                    </span>
                    <h3 className="font-graduate text-2xl sm:text-4xl text-white tracking-tight mt-1 uppercase">
                      IMRAN SHAIKH
                    </h3>

                    {/* Quotation */}
                    <div className="mt-5 relative">
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-3.5 sm:pl-4 py-1">
                        "At 18 Hours Fitness, we don't sell shortcuts or magic pills. We teach the fundamentals: progressive overload, relentless form, and pure mental toughness. Whether you are stepping onto a bodybuilding stage or reclaiming your health, we are with you every set of the way."
                      </p>
                    </div>
                  </div>

                  {/* Consultation Action Footer */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider">
                        Direct Consultation
                      </p>
                      <a 
                        href="tel:9004544879" 
                        className="text-base sm:text-lg font-graduate text-emerald-400 hover:text-emerald-300 transition-colors tracking-wide flex items-center gap-2 mt-0.5"
                      >
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>+91 9004544879</span>
                      </a>
                    </div>

                    <a
                      href="tel:9004544879"
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0"
                    >
                      <span>CALL</span>
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: The 18 Hours Standard */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <ScrollReveal direction="right" delayMs={100}>
                <div>
                  <span className="text-xs font-heading font-bold text-emerald-400 tracking-widest uppercase">
                    THE 18 HOURS STANDARD
                  </span>
                  <h2 className="font-graduate text-2xl sm:text-4xl lg:text-[2.6rem] text-white tracking-tight mt-1 uppercase leading-tight">
                    WHY 18 HOURS <span className="text-emerald-400">MAKES THE DIFFERENCE</span>
                  </h2>
                </div>
              </ScrollReveal>

              <div className="space-y-4">
                <ScrollReveal direction="right" delayMs={160}>
                  <div className="flex items-start gap-3.5 sm:gap-5 p-4 sm:p-6 rounded-2xl bg-[#101318]/90 border border-white/10 hover:border-emerald-500/40 shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h4 className="font-graduate text-base sm:text-xl text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                        UNMATCHED 18-HOUR OPERATING WINDOW
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
                        From 5:00 AM dawn workouts to 11:00 PM late-night iron therapy. Your schedule never dictates when you can chase gains.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="right" delayMs={240}>
                  <div className="flex items-start gap-3.5 sm:gap-5 p-4 sm:p-6 rounded-2xl bg-[#101318]/90 border border-white/10 hover:border-emerald-500/40 shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                      <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h4 className="font-graduate text-base sm:text-xl text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                        OLD-SCHOOL CULTURE WITH MODERN MAINTENANCE
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
                        Clean equipment, calibrated weights, proper chalk availability, and an electric community that hypes you up rather than recording TikToks in your way.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal direction="right" delayMs={320}>
                  <div className="flex items-start gap-3.5 sm:gap-5 p-4 sm:p-6 rounded-2xl bg-[#101318]/90 border border-white/10 hover:border-emerald-500/40 shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h4 className="font-graduate text-base sm:text-xl text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                        DIRECT ACCESS TO EXPERIENCED MENTORS
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
                        No corporate receptionists dodging questions. Get direct advice on workout splits, nutrition macros, and machine biomechanics.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="py-20 sm:py-28 bg-[#090A0C] relative overflow-hidden">
        {/* Ambient emerald backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

        <ScrollReveal direction="up" delayMs={100}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src="/logo.png" 
                alt="18 Hours Fitness" 
                className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.35)]" 
              />
            </div>

            {/* Category Subtitle */}
            <span className="text-xs font-heading font-bold text-emerald-400 tracking-widest uppercase block">
              READY TO TRANSFORM?
            </span>

            {/* Headline with Graduate Font Matching EQUIPPED FOR SERIOUS LIFTERS */}
            <h2 className="font-graduate text-[clamp(1.25rem,4.2vw,3.6rem)] text-white tracking-tight mt-1 uppercase">
              STOP WAITING FOR <span className="text-emerald-400">MONDAY.</span>
            </h2>

            <p className="text-xs sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
              Step through the doors of 18 Hours Fitness. Grab a day pass or sign up for a full season of growth.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 max-w-md sm:max-w-none mx-auto">
              <button
                onClick={() => openAuthModal('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs sm:text-base uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:scale-105 active:scale-95 cursor-pointer text-center"
              >
                BECOME A MEMBER TODAY
              </button>

              <a
                href="tel:9004544879"
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#101318] border border-white/10 hover:border-emerald-500/50 hover:bg-[#141820] text-white font-heading font-bold text-xs sm:text-base uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-xl text-center"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>DIRECT LINE: 9004544879</span>
              </a>
            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <MockPaymentModal
          plan={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={() => setSelectedPlanForCheckout(null)}
        />
      )}

    </div>
  );
};
