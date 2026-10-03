import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import type { AdminOverview, User, WorkoutClass, Payment } from '../types';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  Search, 
  Loader2, 
  RefreshCw, 
  Lock, 
  Unlock,
  Clock
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'analytics' | 'members' | 'classes' | 'payments'>('analytics');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [classes, setClasses] = useState<WorkoutClass[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Filters & Search
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');

  // New Class Form State
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassTrainerId, setNewClassTrainerId] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState(15);
  const [newClassStartTime, setNewClassStartTime] = useState('');
  const [newClassEndTime, setNewClassEndTime] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  // Status toggle
  const [togglingMemberId, setTogglingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchAdminData = async () => {
    try {
      // 1. Overview analytics
      const overviewRes = await apiRequest<AdminOverview>('/admin/analytics/overview');
      setOverview(overviewRes);

      // 2. Member roster
      const membersRes = await apiRequest<{ members: User[] } | User[]>('/admin/members', {
        params: {
          search: memberSearch || undefined,
          status: memberStatusFilter || undefined,
        },
      });
      setMembers((membersRes as any)?.members || (Array.isArray(membersRes) ? membersRes : []));

      // 3. Classes
      const classesRes = await apiRequest<WorkoutClass[]>('/classes');
      setClasses(classesRes || []);

      // 4. Payments ledger
      const paymentsRes = await apiRequest<{ payments: Payment[] } | Payment[]>('/admin/payments');
      setPayments((paymentsRes as any)?.payments || (Array.isArray(paymentsRes) ? paymentsRes : []));
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, memberSearch, memberStatusFilter]);

  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change member status to ${newStatus}?`)) return;

    setTogglingMemberId(memberId);
    try {
      await apiRequest(`/admin/members/${memberId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update member status');
    } finally {
      setTogglingMemberId(null);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingClass(true);
    setClassError(null);

    try {
      await apiRequest('/admin/classes', {
        method: 'POST',
        body: JSON.stringify({
          title: newClassTitle,
          description: newClassDesc,
          trainerId: newClassTrainerId || classes[0]?.trainer_id,
          capacity: Number(newClassCapacity),
          startTime: new Date(newClassStartTime).toISOString(),
          endTime: new Date(newClassEndTime).toISOString(),
        }),
      });

      setShowClassModal(false);
      setNewClassTitle('');
      setNewClassDesc('');
      await fetchAdminData();
    } catch (err: any) {
      setClassError(err.message || 'Failed to create group class.');
    } finally {
      setCreatingClass(false);
    }
  };

  if (authLoading || (!isAdmin && !user)) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex items-center justify-center text-neutral-400 font-heading">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0C] text-neutral-100 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#12151B] border border-[#232933] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-green-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                  GYM HEADQUARTERS OPERATIONS
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-heading font-bold bg-emerald-500 text-black">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Authorized Personnel: <strong className="text-white">{user?.first_name} {user?.last_name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl bg-[#161B22] border border-[#232933] hover:border-emerald-500 text-neutral-300 hover:text-white transition-all"
              title="Refresh console"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowClassModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>SCHEDULE CLASS</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#232933] gap-2 overflow-x-auto">
          {[
            { id: 'analytics', label: 'Overview Analytics' },
            { id: 'members', label: `Member Roster (${members.length})` },
            { id: 'classes', label: `Class Timetable (${classes.length})` },
            { id: 'payments', label: `Revenue & Ledger (${payments.length})` },
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

        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl bg-[#12151B] border border-[#232933]">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-semibold">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-extrabold font-heading text-white mt-2">
                  ${Number(overview?.totalRevenue || 0).toFixed(2)}
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1">Verified Gateway Ledger</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-[#232933]">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-semibold">Active Members</span>
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-extrabold font-heading text-white mt-2">
                  {overview?.activeMembers || 0}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Out of {overview?.totalMembers || 0} registered athletes
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-[#232933]">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-semibold">Scheduled Classes</span>
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-extrabold font-heading text-white mt-2">
                  {overview?.upcomingClassesCount || 0}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">Group training sessions</p>
              </div>

              <div className="p-6 rounded-2xl bg-[#12151B] border border-[#232933]">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs uppercase font-semibold">Access Profile</span>
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-extrabold font-heading text-emerald-400 mt-2">
                  18h Daily
                </h3>
                <p className="text-[11px] text-neutral-400 mt-1">5:00 AM – 11:00 PM</p>
              </div>

            </div>

            {/* Quick overview of latest transactions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-heading text-white">RECENT REVENUE TRANSACTIONS</h3>
              <div className="overflow-x-auto rounded-2xl border border-[#232933] bg-[#12151B]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#232933] text-neutral-400 font-heading bg-[#161B22]">
                      <th className="p-3.5">Ref</th>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2530]">
                    {payments.slice(0, 5).map((pay) => (
                      <tr key={pay.id} className="hover:bg-[#161B22]/50">
                        <td className="p-3.5 font-mono text-neutral-300">{pay.transaction_ref}</td>
                        <td className="p-3.5 font-semibold text-white">
                          {pay.user?.first_name} {pay.user?.last_name} ({pay.user?.email})
                        </td>
                        <td className="p-3.5 font-mono text-emerald-400 font-bold">${Number(pay.amount).toFixed(2)}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                            pay.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-neutral-400">{pay.payment_method}</td>
                        <td className="p-3.5 text-neutral-400">{new Date(pay.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER ROSTER */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold font-heading text-white">REGISTERED GYM MEMBERS</h3>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name/email..."
                    className="pl-9 pr-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE Only</option>
                  <option value="SUSPENDED">SUSPENDED Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#232933] bg-[#12151B]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#232933] text-neutral-400 font-heading bg-[#161B22]">
                    <th className="p-3.5">Athlete</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2530]">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-[#161B22]/50">
                      <td className="p-3.5 font-bold text-white">
                        {m.first_name} {m.last_name}
                      </td>
                      <td className="p-3.5 text-neutral-300">{m.email}</td>
                      <td className="p-3.5 text-neutral-400">{m.phone || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-heading font-semibold bg-[#1C222C] text-neutral-300">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                          m.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleMemberStatus(m.id, m.status)}
                          disabled={togglingMemberId === m.id || m.id === user?.id}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-heading font-bold uppercase transition-all flex items-center gap-1 ${
                            m.status === 'ACTIVE'
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {m.status === 'ACTIVE' ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CLASSES TIMETABLE */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-heading text-white">GROUP WORKOUT SESSIONS</h3>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>NEW CLASS</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classes.map((c) => (
                <div key={c.id} className="p-6 rounded-2xl bg-[#12151B] border border-[#232933] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-heading font-bold">
                      {c.status}
                    </span>
                    <span className="text-xs text-neutral-400">Cap: {c.capacity}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold font-heading text-white">{c.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1">{c.description}</p>
                  </div>
                  <div className="text-xs text-neutral-300 space-y-1 pt-2 border-t border-[#1F2530]">
                    <p>Start: {new Date(c.start_time).toLocaleString()}</p>
                    <p>End: {new Date(c.end_time).toLocaleString()}</p>
                    {c.trainer?.user && (
                      <p className="text-neutral-400 text-[11px]">Trainer: {c.trainer.user.first_name} {c.trainer.user.last_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS LEDGER */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-heading text-white">ALL PAYMENT ORDERS & RECEIPTS</h3>
            <div className="overflow-x-auto rounded-2xl border border-[#232933] bg-[#12151B]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#232933] text-neutral-400 font-heading bg-[#161B22]">
                    <th className="p-3.5">Transaction ID</th>
                    <th className="p-3.5">Athlete / Member</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Currency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Processed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2530]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#161B22]/50">
                      <td className="p-3.5 font-mono text-neutral-300">{p.transaction_ref}</td>
                      <td className="p-3.5 font-bold text-white">
                        {p.user?.first_name} {p.user?.last_name} ({p.user?.email})
                      </td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">${Number(p.amount).toFixed(2)}</td>
                      <td className="p-3.5 text-neutral-400">{p.currency}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-heading font-bold ${
                          p.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400">{p.payment_method}</td>
                      <td className="p-3.5 text-neutral-400">{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Schedule Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#111418] border border-[#232933] rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold font-heading text-white mb-4">SCHEDULE NEW GROUP CLASS</h3>

            {classError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {classError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  value={newClassTitle}
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  placeholder="e.g. Heavy Squat & Leg Hypertrophy"
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Assigned Coach</label>
                <select
                  value={newClassTrainerId || (classes[0]?.trainer_id || '')}
                  onChange={(e) => setNewClassTrainerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {Array.from(new Map(classes.map(c => [c.trainer_id, c])).values()).map((c) => (
                    <option key={c.trainer_id} value={c.trainer_id}>
                      {c.trainer?.user ? `${c.trainer.user.first_name} ${c.trainer.user.last_name} (${c.trainer.specialization || 'Strength Coach'})` : 'Gym Coach'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="Target muscle groups, intensity level, and equipment used..."
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={newClassCapacity}
                    onChange={(e) => setNewClassCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newClassStartTime}
                    onChange={(e) => setNewClassStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase mb-1">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newClassEndTime}
                  onChange={(e) => setNewClassEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161B22] border border-[#232933] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#161B22] text-neutral-400 hover:text-white font-heading font-semibold text-xs tracking-wider uppercase border border-[#232933]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClass}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  {creatingClass ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
