import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  CreditCard, 
  AlertCircle, 
  DollarSign, 
  User, 
  Activity, 
  CheckCircle,
  Calendar
} from 'lucide-react';

const Payroll = () => {
  const { user } = useAuth();
  
  // Data lists
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Disburse modal state
  const [disbursingEmployee, setDisbursingEmployee] = useState(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchPayrollData = async () => {
    setLoading(true);
    setError('');
    setActionSuccess('');
    try {
      const promises = [api.get('/payments/history')];
      
      // Admin/HR fetch employee directory to trigger disbursements
      if (['admin', 'hr'].includes(user.role)) {
        promises.push(api.get('/employees'));
      }

      const results = await Promise.all(promises);
      setPayments(results[0].data.payments);
      
      if (results[1]) {
        // Filter active employees only
        setEmployees(results[1].data.employees.filter(e => e.status === 'active'));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch payroll records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const handleDisburseSubmit = async (e) => {
    e.preventDefault();
    if (!disbursingEmployee || !disburseAmount) return;
    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const response = await api.post('/payments/payout', {
        employeeId: disbursingEmployee._id,
        amount: Number(disburseAmount)
      });
      setActionSuccess(response.data.message || 'Salary payout processed successfully.');
      setDisbursingEmployee(null);
      fetchPayrollData(); // reload
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process salary payment.');
      setDisbursingEmployee(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isHrOrAdmin = ['admin', 'hr'].includes(user.role);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Payroll & Salary</h2>
        <p className="text-slate-400 text-sm mt-1">
          {isHrOrAdmin ? 'Manage employee salary disbursements and track transaction histories.' : 'Review your historical salary disbursement statements.'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Admin / HR Dashboard - Employee Salary Disburser */}
      {isHrOrAdmin && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Run Salary Payouts</h3>
            
            {employees.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No active employees found in directory.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {employees.map((emp) => (
                  <div key={emp._id} className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl hover:border-slate-750 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <strong className="text-slate-200 text-sm font-semibold">{emp.name}</strong>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          {emp.role}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">{emp.email}</p>
                      
                      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span>Base Salary: <strong>${(emp.salary || 0).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setDisbursingEmployee(emp);
                        setDisburseAmount(emp.salary || '');
                      }}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 hover:bg-brand-600 border border-slate-800 hover:border-brand-500 hover:text-white text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Disburse Payout
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History Ledger */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Transaction History Ledger</h3>

        {payments.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">No payment transactions have occurred.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {isHrOrAdmin && <th className="px-6 py-4">Employee</th>}
                  <th className="px-6 py-4">Stripe Reference</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Disbursement Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {payments.map((pay) => (
                  <tr key={pay._id} className="text-slate-350 text-sm hover:bg-slate-900/10 transition-colors">
                    {isHrOrAdmin && (
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-200">{pay.employee?.name || 'Onboarded User'}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{pay.employee?.email}</div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono text-xs text-brand-400">{pay.stripePaymentIntentId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-100">${pay.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 border rounded-full text-xs font-semibold capitalize ${
                        pay.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                        pay.status === 'failed' ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' :
                        'bg-slate-500/10 border-slate-500/25 text-slate-400'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {pay.paidAt ? new Date(pay.paidAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------- MODAL: DISBURSE CONFIRMATION --------------------- */}
      {disbursingEmployee && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-sm w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Disburse Salary Payout</h3>
              <p className="text-slate-400 text-xs mt-1">This will trigger a transaction payout simulation.</p>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl space-y-2 text-xs">
                <div className="text-slate-400">Recipient: <strong className="text-slate-200">{disbursingEmployee.name}</strong></div>
                <div className="text-slate-400">Designation: <strong className="text-slate-200">{disbursingEmployee.designation}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Salary Amount ($USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={disburseAmount}
                    onChange={(e) => setDisburseAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDisbursingEmployee(null)}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:opacity-95"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payroll;
