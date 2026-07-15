import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Loader2,
  X,
  Trash2,
  FileText,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { value: 'casual', label: 'Casual Leave', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { value: 'annual', label: 'Annual Leave', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'unpaid', label: 'Unpaid Leave', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'maternity', label: 'Maternity Leave', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'paternity', label: 'Paternity Leave', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
];

const getLeaveType = (value) => LEAVE_TYPES.find((t) => t.value === value) || LEAVE_TYPES[0];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Rejected' },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
};

// ─── Apply Leave Modal ────────────────────────────────────────────────────────

const ApplyLeaveModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ leaveType: 'sick', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewDays = calcDays(form.startDate, form.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      return setError('All fields are required.');
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setError('End date cannot be before start date.');
    }
    try {
      setLoading(true);
      await api.post('/leaves/apply', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-white/10 p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <CalendarDays className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">Apply for Leave</h3>
              <p className="text-xs text-slate-400">Submit your leave request to HR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Leave Type</label>
            <div className="relative">
              <select
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all cursor-pointer"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          {/* Preview Days */}
          {form.startDate && form.endDate && previewDays > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <CalendarCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-sm text-brand-300 font-medium">
                {previewDays} day{previewDays > 1 ? 's' : ''} of leave requested
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Briefly describe the reason for your leave..."
              rows={3}
              maxLength={500}
              className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all resize-none"
            />
            <p className="text-right text-xs text-slate-500 mt-1">{form.reason.length}/500</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Leave Card ───────────────────────────────────────────────────────────────

const LeaveCard = ({ leave, onCancel }) => {
  const status = STATUS_CONFIG[leave.status];
  const StatusIcon = status.icon;
  const leaveType = getLeaveType(leave.leaveType);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      setCancelling(true);
      await api.delete(`/leaves/${leave._id}/cancel`);
      onCancel();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-200 hover-scale">
      <div className="flex items-start justify-between gap-3">
        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* Leave Type Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${leaveType.bg} ${leaveType.color} mb-3`}>
            {leaveType.label}
          </span>

          {/* Date Range */}
          <div className="flex items-center gap-2 text-sm font-medium text-white mb-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>{formatDate(leave.startDate)}</span>
            <span className="text-slate-500">→</span>
            <span>{formatDate(leave.endDate)}</span>
          </div>

          {/* Days Count */}
          <p className="text-xs text-slate-400 mb-2 ml-6">
            {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
          </p>

          {/* Reason */}
          <p className="text-xs text-slate-400 line-clamp-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-white/5">
            <span className="text-slate-500 mr-1">Reason:</span> {leave.reason}
          </p>

          {/* HR Comment */}
          {leave.hrComment && (
            <p className="text-xs text-slate-400 mt-2 bg-slate-800/40 rounded-lg px-3 py-2 border border-white/5">
              <span className="text-slate-500 mr-1">HR Note:</span> {leave.hrComment}
            </p>
          )}

          {/* Reviewed by */}
          {leave.reviewedBy && (
            <p className="text-xs text-slate-500 mt-2 ml-1">
              Reviewed by <span className="text-slate-300 font-medium">{leave.reviewedBy.name}</span>{' '}
              on {formatDate(leave.reviewedAt)}
            </p>
          )}
        </div>

        {/* Right – Status + Actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>

          {leave.status === 'pending' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ leaves }) => {
  const total = leaves.length;
  const approved = leaves.filter((l) => l.status === 'approved').length;
  const pending = leaves.filter((l) => l.status === 'pending').length;
  const rejected = leaves.filter((l) => l.status === 'rejected').length;
  const totalDaysApproved = leaves
    .filter((l) => l.status === 'approved')
    .reduce((sum, l) => sum + (l.totalDays || 0), 0);

  const stats = [
    { label: 'Total Requests', value: total, icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Days Taken', value: totalDaysApproved, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className={`glass-card rounded-2xl p-4 border ${s.bg} hover-scale transition-all duration-200`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const LeavePage = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves/my');
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error('fetchLeaves error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const filtered = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  const handleSuccess = () => {
    setShowModal(false);
    fetchLeaves();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">My Leaves</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome, <span className="text-slate-200 font-medium">{user?.name}</span> — manage your leave requests here
          </p>
        </div>
        <button
          id="apply-leave-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <StatsBar leaves={leaves} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/5 w-fit">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              filter === f
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Leave List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="p-4 rounded-full bg-slate-800/60 border border-white/5">
            <CalendarDays className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">
            {filter === 'all' ? 'No leave requests yet.' : `No ${filter} leaves found.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-600/30 transition-colors"
            >
              Apply for your first leave
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => (
            <LeaveCard key={leave._id} leave={leave} onCancel={fetchLeaves} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && <ApplyLeaveModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
    </div>
  );
};

export default LeavePage;
