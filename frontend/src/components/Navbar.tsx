import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  Phone, 
  Dumbbell, 
  Sparkles, 
  Award
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'equipment', label: 'Equipment', icon: Dumbbell },
  { id: 'passes', label: 'Passes', icon: Sparkles },
  { id: 'founder', label: 'Coach', icon: Award },
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      // Section spy on homepage
      if (location.pathname === '/') {
        const sections = ['equipment', 'passes', 'founder'];
        const scrollPosition = window.scrollY + 200;

        for (const sectionId of sections) {
          const el = document.getElementById(sectionId);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(sectionId);
              return;
            }
          }
        }
        if (window.scrollY < 250) {
          setActiveSection('');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }

    const targetEl = document.getElementById(id);
    if (targetEl) {
      const navOffset = 95;
      const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none transition-all duration-300 px-2.5 sm:px-6 pt-2.5 sm:pt-4">
      {/* Floating Pill Container */}
      <motion.div 
        layout
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className={`pointer-events-auto max-w-7xl mx-auto rounded-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#07080A]/95 backdrop-blur-2xl border border-emerald-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_20px_rgba(34,197,94,0.12)] py-2 px-3 sm:px-6'
            : 'bg-[#090A0C]/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_10px_rgba(255,255,255,0.02)] py-2.5 px-3 sm:px-6'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <Link 
            to="/" 
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <motion.div 
              className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
              whileHover={{ rotate: 10, scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
            >
              <img 
                src="/logo.png" 
                alt="18 Hours Fitness" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(34,197,94,0.45)]"
              />
            </motion.div>
            <span className="font-logo text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              18 HOURS <span className="text-emerald-400">FITNESS</span>
            </span>
          </Link>

          {/* Desktop Direct Navigation Links (No dropdown popovers) */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-heading font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                      : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Auth Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Direct Call Link (Desktop / Tablet) */}
            <a 
              href="tel:9004544879" 
              className="hidden lg:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all group"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>9004544879</span>
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-heading text-xs font-bold tracking-wide hover:bg-emerald-500/20 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-neutral-200 font-heading text-xs font-semibold tracking-wide hover:border-emerald-500 hover:text-white transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[70px] sm:max-w-none truncate">{user?.first_name || 'Profile'}</span>
                  {user?.activePass && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#22c55e]" title="Active Pass"></span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 sm:p-2 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:inline-block px-3 py-1.5 rounded-full text-xs font-heading font-semibold tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => openAuthModal('signup')}
                  className="px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500 text-black font-heading font-bold text-xs tracking-wider hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.35)] cursor-pointer whitespace-nowrap"
                >
                  Join Today
                </motion.button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-neutral-300 hover:text-white bg-white/[0.06] border border-white/10 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-emerald-400" /> : <MenuIcon className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto md:hidden max-w-7xl mx-auto mt-2 rounded-3xl bg-[#090A0C]/98 backdrop-blur-2xl border border-white/10 p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3 sm:space-y-4"
          >
            {/* Grid of Navigation Buttons (3-Column Mobile Bar) */}
            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl border text-center text-[11px] sm:text-xs font-heading font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                        : 'bg-white/[0.03] border-white/5 text-neutral-200 hover:text-emerald-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Footer & Auth Links */}
            <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
              <a
                href="tel:9004544879"
                className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-2xl bg-white/[0.03] text-neutral-300 border border-white/5 hover:text-white hover:border-emerald-500/40"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Gym: +91 90045 44879</span>
              </a>

              {isAuthenticated ? (
                <div className="space-y-2 pt-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 font-heading font-bold text-xs border border-emerald-500/40"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-white/[0.06] text-white font-heading font-semibold text-xs border border-white/10"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Member Profile & Pass Status</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-2 text-xs text-red-400 font-heading hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="py-2.5 rounded-2xl bg-white/[0.04] text-neutral-200 font-heading font-semibold text-xs border border-white/10 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('signup');
                    }}
                    className="py-2.5 rounded-2xl bg-emerald-500 text-black font-heading font-bold text-xs font-bold cursor-pointer"
                  >
                    Join Today
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
