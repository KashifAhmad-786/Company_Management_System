import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  
  // Data list
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected report for feedback modal
  const [viewingReport, setViewingReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports');
      setReports(response.data.reports);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    
    // Header columns
    const headers = ['Reporter Name', 'Reporter Email', 'Designation', 'Report Type', 'Content', 'Status', 'Feedback', 'Submitted Date'];
    
    // Process rows
    const rows = reports.map(r => [
      r.reporter?.name || '',
      r.reporter?.email || '',
      r.reporter?.designation || '',
      r.type || '',
      r.content ? r.content.replace(/"/g, '""') : '', // Escape double quotes
      r.status || '',
      r.feedback ? r.feedback.replace(/"/g, '""') : '',
      new Date(r.createdAt).toLocaleDateString()
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `work_reports_${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isManagerOrAdmin = ['admin', 'hr', 'manager'].includes(user.role);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Reports Ledger</h2>
          <p className="text-slate-400 text-sm mt-1">
            {isManagerOrAdmin ? 'Track, review, and export work report summaries for auditing.' : 'Review your filed daily/weekly work progress reports.'}
          </p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Listing */}
      {reports.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <p className="text-slate-500 text-sm">No work reports exist yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Interval</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted Date</th>
                  <th className="px-6 py-4 text-right">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {reports.map((rep) => (
                  <tr key={rep._id} className="text-slate-350 text-sm hover:bg-slate-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-200">{rep.reporter?.name || 'Onboarded User'}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{rep.reporter?.designation || 'Staff'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase font-bold text-[10px]">
                      <span className={`px-2 py-0.5 border rounded-md ${
                        rep.type === 'weekly' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                      }`}>
                        {rep.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-sm truncate text-slate-400">{rep.content}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 border rounded-full text-xs font-semibold capitalize ${
                        rep.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                        rep.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
                        'bg-slate-500/10 border-slate-500/25 text-slate-400'
                      }`}>
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(rep.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {rep.feedback ? (
                        <button
                          onClick={() => setViewingReport(rep)}
                          className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          View feedback
                        </button>
                      ) : (
                        <span className="text-slate-650 text-xs italic">No comments</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------- MODAL: VIEW FEEDBACK --------------------- */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Manager Comments</h3>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-slate-450 hover:text-slate-200 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
            
            <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
              <p className="text-xs text-slate-400 font-medium">Review Status: <strong className="text-emerald-400 capitalize">{viewingReport.status}</strong></p>
              <p className="text-xs text-slate-350 italic">"{viewingReport.feedback}"</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
