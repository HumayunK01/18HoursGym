import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { ScrollProgress } from './components/ScrollProgress';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { LandingView } from './views/LandingView';
import { ProfileView } from './views/ProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export const App: React.FC = () => {
  useEffect(() => {
    // Initialize Lenis buttery-smooth inertial scroll
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.3,
    });

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollProgress />
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-[#090A0C] text-neutral-100 selection:bg-emerald-500 selection:text-black">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/admin" element={<AdminDashboardView />} />
              {/* Catch-all fallback */}
              <Route path="*" element={<LandingView />} />
            </Routes>
          </main>

          <Footer />
          <AuthModal />
          <ScrollToTopButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
