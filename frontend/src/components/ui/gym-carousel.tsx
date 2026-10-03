import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface GymCard {
  id: string;
  title: string;
  badge: string;
  src: string;
}

export const gymCards: GymCard[] = [
  {
    id: 'legpress',
    title: 'Hack Squat & Linear Leg Press',
    badge: '400KG+ RATED',
    src: '/images/gym-legpress.jpg',
  },
  {
    id: 'crossover',
    title: 'Dual Cable Crossover & Pull-Up Rig',
    badge: 'FULL RANGE TENSION',
    src: '/images/gym-crossover.jpg',
  },
  {
    id: 'cardio',
    title: 'Commercial Treadmills & Cardio',
    badge: 'AC3000 ENDURANCE',
    src: '/images/gym-cardio.jpg',
  },
  {
    id: 'storefront',
    title: '18 Hours Fitness Mumbra Facility',
    badge: 'EST. 2018',
    src: '/images/gym-storefront.jpg',
  },
  {
    id: 'training',
    title: 'Cable Flyes & Chest Hypertrophy',
    badge: 'HEAVY IRON',
    src: '/images/hero-athlete.jpg',
  },
  {
    id: 'dumbbells',
    title: 'Cast-Iron Dumbbells & Free Weights',
    badge: 'OLYMPIC STEEL',
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&h=1200&q=85&auto=format&fit=crop',
  },
  {
    id: 'racks',
    title: 'Power Racks & Heavy Benches',
    badge: 'PROGRESSIVE OVERLOAD',
    src: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900&h=1200&q=85&auto=format&fit=crop',
  },
];

export const GymCarousel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [cardWidth, setCardWidth] = useState(320);
  const gap = 20;

  // Dynamically update card step width and visible count based on screen size
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setVisibleCount(1);
        setCardWidth(Math.max(260, width - 48));
      } else if (width < 640) {
        setVisibleCount(1.2);
        setCardWidth(Math.min(width - 64, 340));
      } else if (width < 1024) {
        setVisibleCount(2.2);
        setCardWidth(300);
      } else {
        setVisibleCount(3.5);
        setCardWidth(320);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const maxIndex = Math.max(0, gymCards.length - Math.floor(visibleCount));

  // Ensure currentIndex stays within bounds when screen size or visibleCount changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Periodic auto-advance timer: moves forward every 3.8s, pauses on hover or interaction
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const stepSize = cardWidth + gap;
  const currentTranslateX = -(currentIndex * stepSize);

  return (
    <div 
      className="relative w-full max-w-7xl mx-auto select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Navigation Controls */}
      <div className="flex items-center justify-end mb-5 px-2">
        {/* Smooth Arrow Navigation Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handlePrev}
            className="p-2.5 sm:p-3 rounded-full bg-[#12151B] border border-white/10 hover:border-emerald-500 text-white hover:bg-emerald-500/10 transition-colors shadow-lg cursor-pointer"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5 text-emerald-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleNext}
            className="p-2.5 sm:p-3 rounded-full bg-[#12151B] border border-white/10 hover:border-emerald-500 text-white hover:bg-emerald-500/10 transition-colors shadow-lg cursor-pointer"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 text-emerald-400" />
          </motion.button>
        </div>
      </div>

      {/* Overflow Mask for the Track with Left & Right Feathered Masking */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-3xl py-2 px-1 mask-fade-x"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        }}
      >
        {/* Left & Right Soft Fade Overlays */}
        <div className="absolute left-0 inset-y-0 w-8 sm:w-16 bg-gradient-to-r from-[#090A0C] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-8 sm:w-16 bg-gradient-to-l from-[#090A0C] to-transparent z-20 pointer-events-none" />

        {/* Spring-Animated Sliding Track */}
        <motion.div
          animate={{ x: currentTranslateX }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 24,
            mass: 0.75,
          }}
          className="flex gap-5 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{
            left: -(maxIndex * stepSize),
            right: 0,
          }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            const swipeThreshold = 50;
            if (info.offset.x < -swipeThreshold) {
              handleNext();
            } else if (info.offset.x > swipeThreshold) {
              handlePrev();
            }
          }}
        >
          {gymCards.map((card, idx) => {
            const isCurrent = idx === currentIndex;
            return (
              <motion.div
                key={card.id}
                style={{ width: cardWidth }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`shrink-0 h-[380px] sm:h-[440px] rounded-3xl overflow-hidden relative border bg-[#12151B] shadow-[0_20px_45px_rgba(0,0,0,0.85)] group transition-colors duration-300 ${
                  isCurrent 
                    ? 'border-emerald-500/50 shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_20px_rgba(34,197,94,0.15)]' 
                    : 'border-white/10 hover:border-emerald-500/40'
                }`}
              >
                {/* Background Machine Image */}
                <img
                  src={card.src}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out pointer-events-none"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090A0C] via-[#090A0C]/25 to-black/20 pointer-events-none" />

                {/* Top Corner Badge */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-heading font-extrabold text-[10px] sm:text-xs tracking-wider uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{card.badge}</span>
                  </span>
                </div>

                {/* Bottom Card Title Only */}
                <div className="absolute bottom-0 inset-x-0 p-5 z-10 pointer-events-none">
                  <h3 className="text-lg sm:text-xl font-black font-heading text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {card.title}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Progress Dots Navigation (Matched 1:1 with actual valid slide positions) */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === currentIndex
                ? 'w-7 bg-emerald-400 shadow-[0_0_8px_#22c55e]'
                : 'w-1.5 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
