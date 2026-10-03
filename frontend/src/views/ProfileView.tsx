import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import type { Booking, PassPurchase, WorkoutClass, MembershipPlan } from '../types';
import { MockPaymentModal } from '../components/MockPaymentModal';
import { 
  User, 
  Calendar, 
  Clock, 
  Loader2, 
  Phone, 
  Mail, 
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'passes' | 'settings'>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [membershipHistory, setMembershipHistory] = useState<PassPurchase[]>([]);
  const [availableClasses, setAvailableClasses] = useState<WorkoutClass[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<MembershipPlan | null>(null);

  // Profile update form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancellation state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // 1. Bookings
      const bookingsRes = await apiRequest<{ bookings: Booking[] }>('/users/me/bookings');
      setBookings(bookingsRes?.bookings || (Array.isArray(bookingsRes) ? bookingsRes : []));

      // 2. Membership history
      const historyRes = await apiRequest<{ passes: PassPurchase[] }>('/users/me/membership');
      setMembershipHistory(historyRes?.passes || (Array.isArray(historyRes) ? historyRes : []));

      // 3. Available classes
      const classesRes = await apiRequest<WorkoutClass[]>('/classes');
      setAvailableClasses(classesRes || []);

      // 4. Plans
      const plansRes = await apiRequest<MembershipPlan[]>('/plans');
      setPlans(plansRes || []);
    } catch (err) {
      console.error('Failed to load user dashboard data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        }),
      });
      await refreshProfile();
      setProfileMsg({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async (classId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingBookingId(classId);

    try {
      await apiRequest(`/classes/${classId}/book`, { method: 'DELETE' });
      await loadUserData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleBookClass = async (classId: string) => {
    try {
      await apiRequest(`/classes/${classId}/book`, { method: 'POST' });
      await loadUserData();
      alert('Class reserved successfully!');
    } catch (err: any) {
      alert(err.message || 'Booking failed. Make sure you hold an active membership pass.');
    }
  };

  if (authLoading || (!user && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex items-center justify-center text-neutral-400 font-heading">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const activePass = user?.activePass;

  return (
    <div className="min-h-screen bg-[#090A0C] text-neutral-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#12151B] border border-[#232933] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-green-sm">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold bg-[#1E2530] text-emerald-400 border border-emerald-500/30">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>{user?.email}</span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{user.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUserData}
              className="p-2.5 rounded-xl bg-[#161B22] border border-[#232933] hover:border-emerald-500 text-neutral-300 hover:text-white transition-all"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-heading font-bold tracking-wider transition-all"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* ACTIVE PASS STATUS BANNER */}
        <div className={`p-6 rounded-2xl border transition-all ${
          activePass 
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#11161E] to-[#12151B] border-emerald-500/40 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
            : 'bg-[#15181F] border-[#2A313E]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-heading font-bold tracking-wider text-emerald-400">
                  Current Membership Status
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                  activePass ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {activePass ? 'ACTIVE ACCESS' : 'NO ACTIVE PASS'}
                </span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-white">
                {activePass?.plan?.name || 'No Active Membership Pass'}
              </h2>
              {activePass ? (
                <p className="text-xs text-neutral-300">
                  Valid from <strong className="text-white">{new Date(activePass.start_date).toLocaleDateString()}</strong> until <strong className="text-emerald-400">{new Date(activePass.end_date).toLocaleDateString()}</strong>.
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  You need an active pass to book group workout classes and access the gym floor.
                </p>
              )}
            </div>

            <div>
              <button
                onClick={() => {
                  if (plans.length > 0) {
                    setSelectedPlanForCheckout(plans[0]);
                  } else {
                    setActiveTab('passes');
                  }
                }}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2"
              >
                <span>{activePass ? 'EXTEND / RENEW PASS' : 'PURCHASE A PASS'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#232933] gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'bookings', label: `My Bookings (${bookings.length})` },
            { id: 'passes', label: 'Membership Plans & Passes' },
            { id: 'settings', label: 'Account Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-5 text-sm font-heading font-semibold tracking-wider uppercase border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-[#12151B] border border-[#232933]">
                <span className="text-xs text-neutral-400 uppercase font-semibold">Active Classes Booked</span>
                <h3 className="text-3xl font-bold font-heading text-white mt-1">
                  {bookings.filter(b => b.status === 'CONFIRMED').length}
                </h3>
              </div>
              <div className="p-5 rounded-xl bg-[#12151B] border border-[#232933]">
                <span className="text-xs text-neutral-400 uppercase font-semibold">Membership Tier</span>
                <h3 className="text-2xl font-bold font-heading text-emerald-400 mt-1">
                  {activePass?.plan?.name || 'None'}
                </h3>
              </div>
              <div className="p-5 rounded-xl bg-[#12151B] border border-[#232933]">
                <span className="text-xs text-neutral-400 uppercase font-semibold">Gym Access</span>
                <h3 className="text-2xl font-bold font-heading text-white mt-1">18 Hours / Day</h3>
              </div>
            </div>

            {/* Upcoming Reserved Classes preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading text-white">UPCOMING RESERVATIONS</h3>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-heading font-semibold text-emerald-400 hover:underline"
                >
                  View All
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#12151B] border border-[#232933] text-center text-xs text-neutral-400">
                  You have not booked any upcoming classes. Check available sessions below.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className="p-5 rounded-xl bg-[#12151B] border border-[#232933] flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-heading font-bold">
                          {booking.status}
                        </span>
                        <h4 className="font-heading font-bold text-base text-white">{booking.class?.title}</h4>
                        <p className="text-xs text-neutral-400">
                          {booking.class?.start_time && new Date(booking.class.start_time).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelBooking(booking.class_id)}
                        disabled={cancellingBookingId === booking.class_id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-heading font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Available Classes to Book */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-heading text-white">CLASSES AVAILABLE TO BOOK</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableClasses.slice(0, 3).map((c) => (
                  <div key={c.id} className="p-5 rounded-xl bg-[#12151B] border border-[#232933] space-y-3">
                    <h4 className="font-heading font-bold text-base text-white">{c.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2">{c.description}</p>
                    <div className="text-xs text-neutral-300">
                      <p>{new Date(c.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={() => handleBookClass(c.id)}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider rounded-lg uppercase"
                    >
                      RESERVE SPOT
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-heading text-white">MY WORKOUT CLASS RESERVATIONS</h3>
            {bookings.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#12151B] border border-[#232933] text-center space-y-3">
                <Calendar className="w-10 h-10 text-neutral-500 mx-auto" />
                <p className="font-heading text-lg font-bold text-white">No Classes Booked Yet</p>
                <p className="text-xs text-neutral-400">Browse the class schedule and reserve your spot.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const startTime = booking.class?.start_time ? new Date(booking.class.start_time) : null;
                  return (
                    <div
                      key={booking.id}
                      className="p-6 rounded-2xl bg-[#12151B] border border-[#232933] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-heading font-bold ${
                            booking.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {booking.status}
                          </span>
                          <span className="text-xs text-neutral-400">
                            Booked on {new Date(booking.booked_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold font-heading text-white">{booking.class?.title}</h4>
                        <p className="text-xs text-neutral-400">{booking.class?.description}</p>
                        {startTime && (
                          <div className="flex items-center gap-4 text-xs text-neutral-300 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              {startTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>

                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelBooking(booking.class_id)}
                          disabled={cancellingBookingId === booking.class_id}
                          className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-heading font-bold text-xs tracking-wider uppercase transition-all"
                        >
                          {cancellingBookingId === booking.class_id ? 'CANCELLING...' : 'CANCEL RESERVATION'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: MEMBERSHIP PASSES & PRICING */}
        {activeTab === 'passes' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold font-heading text-white">MEMBERSHIP PASS TIERS</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Purchase or renew your pass with zero friction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="p-6 rounded-2xl bg-[#12151B] border border-[#232933] flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-xl font-bold font-heading text-white">{plan.name}</h4>
                    <p className="text-xs text-neutral-400">{plan.description}</p>
                    <div className="text-3xl font-extrabold font-heading text-emerald-400">
                      ${Number(plan.price).toFixed(2)}
                      <span className="text-xs text-neutral-400 font-normal"> / {plan.duration_in_days} Days</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlanForCheckout(plan)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                  >
                    ACTIVATE THIS PASS
                  </button>
                </div>
              ))}
            </div>

            {/* Past Membership Purchases */}
            <div className="pt-8 border-t border-[#232933] space-y-4">
              <h4 className="text-base font-bold font-heading text-white">PASS PURCHASE LEDGER</h4>
              {membershipHistory.length === 0 ? (
                <p className="text-xs text-neutral-500">No past purchases on record.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#232933] text-neutral-400 font-heading">
                        <th className="py-2.5">Pass</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Start Date</th>
                        <th className="py-2.5">End Date</th>
                        <th className="py-2.5">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B212B]">
                      {membershipHistory.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 font-semibold text-white">{p.plan?.name || 'Gym Pass'}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                              p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 text-neutral-300">{new Date(p.start_date).toLocaleDateString()}</td>
                          <td className="py-3 text-neutral-300">{new Date(p.end_date).toLocaleDateString()}</td>
                          <td className="py-3 font-mono text-emerald-400">${Number(p.amount_paid).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold font-heading text-white">PERSONAL DETAILS</h3>
              <p className="text-xs text-neutral-400 mt-1">Keep your contact and emergency info up to date.</p>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Email Address (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-[#0F1216] border border-[#232933] rounded-lg text-sm text-neutral-500 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-heading font-bold text-xs tracking-wider rounded-xl uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                {savingProfile ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <MockPaymentModal
          plan={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={() => {
            setSelectedPlanForCheckout(null);
            loadUserData();
          }}
        />
      )}
    </div>
  );
};
