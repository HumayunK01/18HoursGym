import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Phone, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { ApiError } from '../api/client';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        const user = await login(email, password);
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/profile');
        }
      } else {
        await signup({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone: phone || undefined,
        });
        navigate('/profile');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      } else {
        setError(err?.message || 'Unable to connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@gym.com');
    setPassword('AdminPassword123!');
    setError(null);
  };

  const fillDemoTrainer = () => {
    setEmail('marcus.pt@gym.com');
    setPassword('TrainerPass123!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#111418] border border-[#232933] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400"></div>

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-[#1A1F26] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 overflow-hidden">
            <img src="/logo.png" alt="18 Hours" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-white">
            {authModalMode === 'login' ? 'WELCOME TO 18 HOURS' : 'JOIN THE IRON BROTHERHOOD'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {authModalMode === 'login'
              ? 'Access your training passes, classes, or admin portal'
              : 'Create your gym account in seconds'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-[#161B22] p-1 rounded-xl mb-6 border border-[#232933]">
          <button
            type="button"
            onClick={() => {
              openAuthModal('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-heading font-semibold rounded-lg transition-all ${
              authModalMode === 'login'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              openAuthModal('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-heading font-semibold rounded-lg transition-all ${
              authModalMode === 'signup'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Credentials */}
        {authModalMode === 'login' && (
          <div className="mb-5 p-3 rounded-xl bg-[#161B22]/80 border border-[#232933] text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-400 font-medium">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Quick Test Credentials:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="py-1.5 px-2.5 rounded-lg bg-[#1F242D] border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
              >
                <ShieldCheck className="w-3 h-3" />
                Demo Admin
              </button>
              <button
                type="button"
                onClick={fillDemoTrainer}
                className="py-1.5 px-2.5 rounded-lg bg-[#1F242D] border border-[#2D3540] hover:border-neutral-300 text-neutral-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
              >
                Demo Trainer
              </button>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@gym.com"
                className="w-full pl-9 pr-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-heading font-bold text-base tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{authModalMode === 'login' ? 'ENTER THE GYM' : 'CREATE MEMBERSHIP ACCOUNT'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
