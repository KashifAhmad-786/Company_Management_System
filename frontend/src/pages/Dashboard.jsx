import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Users, 
  CheckSquare, 
  DollarSign, 
  FileSpreadsheet, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  ArrowRightLeft
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Data States
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [payments, setPayments] = useState([]);
  const [departments, setDepartments] = useState([]);

  // UI / Action States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Report submission state
  const [reportType, setReportType] = useState('daily');
  const [reportContent, setReportContent] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Report review state
  const [reviewingReport, setReviewingReport] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Roles determine what is fetched to prevent 403s
      const promises = [];
      
      // All logged-in users have access to tasks and reports list (but filtered by backend automatically)
      promises.push(api.get('/tasks').then(r => setTasks(r.data.tasks)));
      promises.push(api.get('/reports').then(r => setReports(r.data.reports)));

      if (['admin', 'hr', 'manager'].includes(user.role)) {
        promises.push(api.get('/employees').then(r => setEmployees(r.data.employees)));
        promises.push(api.get('/employees/departments').then(r => setDepartments(r.data.departments)));
      }

      if (['admin', 'hr', 'employee', 'manager'].includes(user.role)) {
        promises.push(api.get('/payments/history').then(r => setPayments(r.data.payments)));
      }

      await Promise.all(promises);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle task status update
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      fetchData(); // reload
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  // Submit report handler (Employee only)
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess('');
    if (!reportContent.trim()) return;

    setSubmitLoading(true);
    try {
      await api.post('/reports', {
        type: reportType,
        content: reportContent,
        task: selectedTaskId || undefined
      });
      setReportContent('');
      setSelectedTaskId('');
      setSubmitSuccess('Report filed successfully.');
      fetchData(); // reload reports list
    } catch (err) {
      setError(err.response?.data?.message || 'Report submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit report review handler
  const handleReportReview = async (e) => {
    e.preventDefault();
    if (!reviewingReport) return;
    setReviewLoading(true);

    try {
      await api.put(`/reports/${reviewingReport._id}/review`, {
        status: reviewStatus,
        feedback: reviewFeedback
      });
      setReviewingReport(null);
      setReviewFeedback('');
      fetchData(); // reload
    } catch (err) {
      alert(err.response?.data?.message || 'Review submission failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Metric calculation
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  
  // Payroll totals
  const totalPayrollBudget = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  const totalPayoutsProcessed = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  // Overdue tasks
  const overdueTasksCount = tasks.filter(t => t.isOverdue).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Aggregating workspace data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Workspace Overview</h2>
        <p className="text-slate-400 text-sm mt-1">Hello {user.name}, review key performance metrics below.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* --------------------- STATS GRID --------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Headcount Card (Admin / HR / Manager) */}
        {['admin', 'hr', 'manager'].includes(user.role) && (
          <div className="glass-card rounded-2xl p-6 hover-scale relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full group-hover:bg-brand-500/10 transition-colors"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Headcount</span>
              <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white">{totalEmployeesCount}</h3>
            <p className="text-[11px] text-emerald-400 mt-2 font-medium">
              {activeEmployeesCount} Active Staff Members
            </p>
          </div>
        )}

        {/* Task Completion Rate Card (All Roles) */}
        <div className="glass-card rounded-2xl p-6 hover-scale relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full group-hover:bg-brand-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Task Completion</span>
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-white">{taskCompletionRate}%</h3>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {completedTasksCount} of {totalTasksCount} tasks completed
          </p>
        </div>

        {/* Overdue Task Flag Card (All Roles) */}
        <div className="glass-card rounded-2xl p-6 hover-scale relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full group-hover:bg-rose-500/10 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Overdue Tasks</span>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className={`text-3xl font-bold ${overdueTasksCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {overdueTasksCount}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Requires immediate attention
          </p>
        </div>

        {/* Payroll Card (Admin / HR / Employee / Manager) */}
        {['admin', 'hr', 'employee', 'manager'].includes(user.role) && (
          <div className="glass-card rounded-2xl p-6 hover-scale relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                {['employee', 'manager'].includes(user.role) ? 'Total Salary Earnings' : 'Monthly Payroll Budget'}
              </span>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white">
              ${['employee', 'manager'].includes(user.role) ? totalPayoutsProcessed.toLocaleString() : totalPayrollBudget.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              {['employee', 'manager'].includes(user.role)
                ? 'Processed payouts count: ' + payments.filter(p => p.status === 'completed').length
                : 'All active departments'}
            </p>
          </div>
        )}
      </div>

      {/* --------------------- ACTIONS & LISTS CONTAINER --------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Lists based on roles */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Tasks Panel */}
          <div className="glass-card rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Assigned Workspace Tasks</h3>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-850 rounded-full text-xs text-slate-400">
                {tasks.length} Total
              </span>
            </div>

            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">No tasks are currently listed.</p>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-200 text-sm">{task.title}</h4>
                        {task.isOverdue && (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold">
                            Overdue
                          </span>
                        )}
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-semibold uppercase ${
                          task.priority === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          task.priority === 'medium' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
                          'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 max-w-lg">{task.description}</p>
                      
                      {/* Meta information */}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                        {user.role !== 'employee' && (
                          <span>Assigned to: <strong className="text-slate-400 font-bold">{task.assignedTo?.name}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Task Actions (Only Employee handles own status change) */}
                    <div>
                      {user.role === 'employee' ? (
                        <select
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-500"
                        >
                          <option value="todo">To Do</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Completed</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1.5 border rounded-full text-xs font-semibold capitalize ${
                          task.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          task.status === 'inprogress' ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' :
                          'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                          {task.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Report Reviews (Managers and HR/Admin review) */}
          {['admin', 'hr', 'manager'].includes(user.role) && (
            <div className="glass-card rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Work Report Feed</h3>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-850 rounded-full text-xs text-slate-400">
                  {reports.filter(r => r.status === 'pending').length} Pending Review
                </span>
              </div>

              {reports.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No reports submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-850 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-sm font-semibold text-slate-200">{report.reporter?.name}</strong>
                          <span className="text-slate-500 text-[10px] ml-2">({report.reporter?.designation})</span>
                        </div>
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase ${
                          report.type === 'weekly' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                        }`}>
                          {report.type}
                        </span>
                      </div>
                      
                      <p className="text-slate-400 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-900 whitespace-pre-wrap">{report.content}</p>

                      {report.task && (
                        <div className="text-[10px] text-slate-500">
                          Tied to Task: <strong className="text-slate-400">{report.task.title}</strong>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-500">Submitted: {new Date(report.createdAt).toLocaleDateString()}</span>
                        
                        {report.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setReviewingReport(report); setReviewStatus('approved'); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => { setReviewingReport(report); setReviewStatus('rejected'); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 border rounded-full text-xs font-semibold capitalize ${
                              report.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {report.status}
                            </span>
                            {report.feedback && (
                              <span className="text-[10px] text-slate-500 italic max-w-xs truncate">
                                "{report.feedback}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Actions / Contextual widgets */}
        <div className="space-y-8">
          
          {/* Employee Action: Submit Daily/Weekly Report */}
          {user.role === 'employee' && (
            <div className="glass-card rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">File Work Report</h3>
              {submitSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {submitSuccess}
                </div>
              )}
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Report Interval</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReportType('daily')}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        reportType === 'daily' 
                          ? 'bg-brand-600/25 border-brand-500 text-brand-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportType('weekly')}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        reportType === 'weekly' 
                          ? 'bg-brand-600/25 border-brand-500 text-brand-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Related Task (Optional)</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="">Select a task</option>
                    {tasks.filter(t => t.status !== 'done').map(task => (
                      <option key={task._id} value={task._id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Report Summary</label>
                  <textarea
                    rows={4}
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Describe tasks accomplished, difficulties faced, or progress details."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-350 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-600 to-cyan-500 hover:opacity-95 text-white font-semibold rounded-xl text-xs transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitLoading ? 'Filing report...' : 'Submit Report'}
                </button>
              </form>
            </div>
          )}

          {/* Payment Logs Widget (Employee view own; Admin / HR / Manager view payroll ledger) */}
          {['admin', 'hr', 'employee', 'manager'].includes(user.role) && (
            <div className="glass-card rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  {['employee', 'manager'].includes(user.role) ? 'Salary & Payroll' : 'Payment Activity'}
                </h3>
                <span className="text-slate-500 text-xs">{payments.slice(0, 4).length} Latest</span>
              </div>

              {payments.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">No payment history found.</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 4).map((pay) => (
                    <div key={pay._id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        {['admin', 'hr'].includes(user.role) ? (
                          <strong className="text-slate-300 font-semibold">{pay.employee?.name}</strong>
                        ) : (
                          <strong className="text-slate-300">Monthly Salary</strong>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">Paid: {new Date(pay.paidAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <strong className="text-emerald-400 font-bold">+${pay.amount}</strong>
                        <span className="block text-[8px] text-slate-500 uppercase font-semibold mt-0.5">{pay.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* --------------------- MODAL: REPORT REVIEW DIALOG --------------------- */}
      {reviewingReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-white">Review Work Report</h3>
            
            <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1">
              <div className="text-xs text-slate-400">Reporter: <strong className="text-slate-200">{reviewingReport.reporter?.name}</strong></div>
              <div className="text-[11px] text-slate-500 max-h-24 overflow-y-auto italic">"{reviewingReport.content}"</div>
            </div>

            <form onSubmit={handleReportReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    className={`py-2 rounded-lg text-xs font-semibold border ${
                      reviewStatus === 'approved' 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`py-2 rounded-lg text-xs font-semibold border ${
                      reviewStatus === 'rejected' 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Review Feedback</label>
                <input
                  type="text"
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="e.g. Great progress, please merge code."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReport(null)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-4 py-2 bg-gradient-to-r from-brand-600 to-cyan-500 text-white font-semibold rounded-lg text-xs"
                >
                  {reviewLoading ? 'Submitting...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
