import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  FileText,
  Eye,
  X,
  MessageSquare,
  CalendarCheck,
  Award,
  Filter,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  { value: 'casual', label: 'Casual', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { value: 'annual', label: 'Annual', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'unpaid', label: 'Unpaid', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'maternity', label: 'Maternity', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'paternity', label: 'Paternity', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
];

const getLeaveType = (value) => LEAVE_TYPES.find((t) => t.value === value) || { label: value, color: 'text-slate-400', bg: 'bg-slate-800/60 border-white/10' };

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Rejected' },
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d);
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal = ({ leave, onClose, onReviewed }) => {
  const [status, setStatus] = useState('');
  const [hrComment, setHrComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const leaveType = getLeaveType(leave.leaveType);

  const handleReview = async () => {
    if (!status) return setError('Please select Approve or Reject.');
    try {
      setLoading(true);
      await api.put(`/leaves/${leave._id}/review`, { status, hrComment });
      onReviewed();
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg glass-panel rounded-2xl shadow-2xl border border-white/10 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Eye className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-outfit">Review Leave</h3>
              <p className="text-xs text-slate-400">
                {leave.employee?.name} · {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Leave Details */}
        <div className="space-y-3 mb-5">
          <div className="glass-card rounded-xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${leaveType.bg} ${leaveType.color}`}>
                {leaveType.label} Leave
              </span>
              <span className="text-xs text-slate-400">{timeAgo(leave.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white">
              <CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium">{formatDate(leave.startDate)}</span>
              <span className="text-slate-500">→</span>
              <span className="font-medium">{formatDate(leave.endDate)}</span>
            </div>

            <div className="text-sm text-slate-300 bg-slate-800/40 rounded-lg px-3 py-2 border border-white/5">
              <span className="text-slate-500 text-xs">Reason: </span>
              {leave.reason}
            </div>
          </div>

          {/* Employee Info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {leave.employee?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{leave.employee?.name}</p>
              <p className="text-xs text-slate-400">{leave.employee?.designation || leave.employee?.email}</p>
            </div>
          </div>
        </div>

        {/* Decision Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setStatus('approved')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
              status === 'approved'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => setStatus('rejected')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
              status === 'rejected'
                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>

        {/* HR Comment */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            HR Comment (optional)
          </label>
          <textarea
            value={hrComment}
            onChange={(e) => setHrComment(e.target.value)}
            placeholder="Add a note for the employee..."
            rows={2}
            maxLength={300}
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleReview}
          disabled={!status || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'Submitting...' : 'Confirm Decision'}
        </button>
      </div>
    </div>
  );
};

// ─── Leave Request Row ────────────────────────────────────────────────────────

const LeaveRow = ({ leave, onReview }) => {
  const status = STATUS_CONFIG[leave.status];
  const StatusIcon = status.icon;
  const leaveType = getLeaveType(leave.leaveType);

  return (
    <div className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-200 group">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {leave.employee?.name?.[0]?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{leave.employee?.name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${leaveType.bg} ${leaveType.color}`}>
              {leaveType.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
            <CalendarDays className="w-3 h-3 flex-shrink-0" />
            <span>{formatDate(leave.startDate)}</span>
            <span>→</span>
            <span>{formatDate(leave.endDate)}</span>
            <span className="text-slate-500">·</span>
            <span className="font-medium text-slate-300">{leave.totalDays}d</span>
          </div>
        </div>

        {/* Status + Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>

          {leave.status === 'pending' ? (
            <button
              onClick={() => onReview(leave)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-400 text-xs font-semibold hover:bg-brand-600/40 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Review
            </button>
          ) : (
            <span className={`sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          )}
        </div>
      </div>

      {/* Reason */}
      <div className="mt-3 ml-14">
        <p className="text-xs text-slate-500 line-clamp-1">
          <span className="text-slate-600">Reason: </span>{leave.reason}
        </p>
        {leave.hrComment && (
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="text-slate-600">HR Note: </span>{leave.hrComment}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Summary Tab ─────────────────────────────────────────────────────────────

const SummaryTab = ({ summary, allLeaves }) => {
  const [search, setSearch] = useState('');

  const filtered = summary.filter((s) =>
    s.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
        />
      </div>

      {/* Employee Summary Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No data found.</div>
        ) : (
          filtered.map((item, idx) => {
            const empLeaves = allLeaves.filter((l) => l.employee?._id === item.employee?._id);
            return (
              <div key={idx} className="glass-card rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-200">
                {/* Employee Header */}
                <div className="flex items-center gap-4 p-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {item.employee?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{item.employee?.name}</p>
                    <p className="text-xs text-slate-400">{item.employee?.designation || item.employee?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{item.totalApprovedDays}</p>
                    <p className="text-xs text-slate-400">days approved</p>
                  </div>
                </div>

                {/* Leave breakdown */}
                <div className="p-4 space-y-2">
                  {/* By Type Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.byType.map((bt, i) => {
                      const lt = getLeaveType(bt.leaveType);
                      return (
                        <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${lt.bg} ${lt.color}`}>
                          {lt.label}: {bt.totalDays}d
                        </span>
                      );
                    })}
                  </div>

                  {/* Individual approved leaves */}
                  <div className="space-y-2">
                    {empLeaves.map((leave) => {
                      const lt = getLeaveType(leave.leaveType);
                      return (
                        <div key={leave._id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/40 border border-white/5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${lt.color.replace('text-', 'bg-')}`} />
                          <span className={`text-xs font-medium ${lt.color}`}>{lt.label}</span>
                          <span className="text-xs text-slate-400 flex-1">
                            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">{leave.totalDays}d</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── HR Leave Management Main Page ───────────────────────────────────────────

const HRLeavePage = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [allApprovedLeaves, setAllApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/leaves/all', { params });
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error('fetchLeaves error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/leaves/summary');
      setSummary(res.data.data?.summary || []);
      setAllApprovedLeaves(res.data.data?.allLeaves || []);
    } catch (err) {
      console.error('fetchSummary error:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    if (activeTab === 'summary') fetchSummary();
  }, [activeTab, fetchSummary]);

  const handleReviewed = () => {
    setReviewTarget(null);
    fetchLeaves();
    if (activeTab === 'summary') fetchSummary();
  };

  const filtered = leaves.filter((l) =>
    l.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats for requests tab
  const totalPending = leaves.filter((l) => l.status === 'pending').length;
  const totalAll = leaves.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Leave Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Review employee leave requests and view leave summaries</p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 pulse-slow" />
            <span className="text-sm text-amber-400 font-semibold">{totalPending} pending</span>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: leaves.length, icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
          { label: 'Pending Review', value: leaves.filter((l) => l.status === 'pending').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Approved', value: leaves.filter((l) => l.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Rejected', value: leaves.filter((l) => l.status === 'rejected').length, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
        ].map((s) => {
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-white/5 w-fit">
        {[
          { id: 'requests', label: 'Leave Requests', icon: FileText },
          { id: 'summary', label: 'Employee Summary', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by employee name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-white appearance-none focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Leave List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-full bg-slate-800/60 border border-white/5">
                <CalendarDays className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No leave requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((leave) => (
                <LeaveRow key={leave._id} leave={leave} onReview={setReviewTarget} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <SummaryTab summary={summary} allLeaves={allApprovedLeaves} />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          leave={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};

export default HRLeavePage;
