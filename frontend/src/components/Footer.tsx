import React from 'react';
import { 
  Clock, 
  Award, 
  Dumbbell, 
  ShieldCheck, 
  MapPin, 
  ArrowUpRight, 
  Sparkles, 
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Clean Monet-style SVG Social Icons
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
  </svg>
);

export const Footer: React.FC = () => {
  const { openAuthModal } = useAuth();

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 90;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <footer className="relative w-full bg-[#060709] border-t border-white/10 text-neutral-400 overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12">
        
        {/* 1. TOP BRAND STRIP */}
        <div className="pb-10 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <img 
              src="/logo.png" 
              alt="18 Hours Fitness" 
              className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
            />
            <div>
              <span className="font-graduate text-2xl sm:text-3xl text-white tracking-tight uppercase block leading-none">
                18 HOURS <span className="text-emerald-400">FITNESS</span>
              </span>
              <span className="text-[11px] font-heading font-bold text-neutral-400 tracking-widest uppercase mt-1 block">
                AUTHENTIC STRENGTH ARSENAL · MUMBRA
              </span>
            </div>
          </div>
        </div>

        {/* 2. FOUR CURATED NAVIGATION COLUMNS */}
        <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pt-10 pb-6">
          
          {/* Column 1: Facilities & Equipment */}
          <div>
            <h4 className="font-graduate text-sm sm:text-base text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
              <span>FACILITIES</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a 
                  href="/#equipment" 
                  onClick={(e) => scrollToSection(e, 'equipment')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                >
                  <span>Plate-Loaded Hack Squat</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="/#equipment" 
                  onClick={(e) => scrollToSection(e, 'equipment')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                >
                  <span>400KG+ Linear Leg Press</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="/#equipment" 
                  onClick={(e) => scrollToSection(e, 'equipment')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                >
                  <span>Dual Cable Crossover Rig</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="/#equipment" 
                  onClick={(e) => scrollToSection(e, 'equipment')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                >
                  <span>Commercial AC3000 Treadmills</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="/#equipment" 
                  onClick={(e) => scrollToSection(e, 'equipment')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                >
                  <span>Cast-Iron Free Weights (up to 50kg)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Membership Passes */}
          <div>
            <h4 className="font-graduate text-sm sm:text-base text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>PASS TIERS</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a 
                  href="/#passes" 
                  onClick={(e) => scrollToSection(e, 'passes')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  1 Month Starter (30 Days)
                </a>
              </li>
              <li>
                <a 
                  href="/#passes" 
                  onClick={(e) => scrollToSection(e, 'passes')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>3 Months Pro (90 Days)</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-heading font-black uppercase">POPULAR</span>
                </a>
              </li>
              <li>
                <a 
                  href="/#passes" 
                  onClick={(e) => scrollToSection(e, 'passes')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  6 Months Semi-Annual (180 Days)
                </a>
              </li>
              <li>
                <a 
                  href="/#passes" 
                  onClick={(e) => scrollToSection(e, 'passes')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  1 Year Elite VIP (365 Days)
                </a>
              </li>
              <li>
                <a 
                  href="/#passes" 
                  onClick={(e) => scrollToSection(e, 'passes')}
                  className="hover:text-emerald-400 transition-colors text-emerald-400 font-semibold"
                >
                  + With Cardio Deck Upgrade
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Head Coach & Ethos */}
          <div>
            <h4 className="font-graduate text-sm sm:text-base text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>COACH & ETHOS</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a 
                  href="/#founder" 
                  onClick={(e) => scrollToSection(e, 'founder')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Head Coach Imran Shaikh
                </a>
              </li>
              <li>
                <a 
                  href="/#founder" 
                  onClick={(e) => scrollToSection(e, 'founder')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Progressive Overload Mentorship
                </a>
              </li>
              <li>
                <a 
                  href="/#founder" 
                  onClick={(e) => scrollToSection(e, 'founder')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Free Biomechanics & Form Checks
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/919004544879" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400 font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Direct Inquiry</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Facility Info & Portal */}
          <div>
            <h4 className="font-graduate text-sm sm:text-base text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>VISIT US</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="leading-relaxed text-neutral-300">
                18 Hours Fitness Floor, Station Road, Mumbra, Maharashtra 400612
              </li>
              <li className="pt-1 flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open 5:00 AM – 11:00 PM</span>
              </li>
              <li className="pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-heading font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Member / Admin Portal</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* 4. BOTTOM BAR & LEGAL ROW (Monet Signature) */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 text-center md:text-left">
          
          {/* Copyright */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
            <span>© {new Date().getFullYear()} 18 Hours Fitness. All Rights Reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span>Mumbra Premier Strength Facility</span>
          </div>

          {/* System Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] sm:text-[11px] text-neutral-400">ZERO HIDDEN FEES · VERIFIED PASS SYSTEM</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <YoutubeIcon className="w-4 h-4" />
            </a>
            <a 
              href="https://wa.me/919004544879" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
};
