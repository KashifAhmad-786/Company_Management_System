import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Building,
  DollarSign,
  Briefcase
} from 'lucide-react';

const Employees = () => {
  const { user } = useAuth();
  
  // Data lists
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Employee Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeePassword, setEmployeePassword] = useState('Welcome@123');
  const [employeeRole, setEmployeeRole] = useState('employee');
  const [employeeDept, setEmployeeDept] = useState('');
  const [employeeDesg, setEmployeeDesg] = useState('');
  const [employeeSalary, setEmployeeSalary] = useState('');
  const [employeeJoining, setEmployeeJoining] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editDesg, setEditDesg] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Department Modal State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const fetchEmployeesAndDepts = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees'),
        api.get('/employees/departments')
      ]);
      setEmployees(empRes.data.employees);
      setDepartments(deptRes.data.departments);
      
      // Select first department by default for dropdown
      if (deptRes.data.departments.length > 0) {
        setEmployeeDept(deptRes.data.departments[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch employees list. Check authorization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndDepts();
  }, []);

  // Add Employee submit
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);

    try {
      await api.post('/employees', {
        name: employeeName,
        email: employeeEmail,
        password: employeePassword,
        role: employeeRole,
        department: employeeDept,
        designation: employeeDesg,
        salary: Number(employeeSalary),
        joiningDate: employeeJoining || undefined
      });
      
      // Reset form & reload
      setEmployeeName('');
      setEmployeeEmail('');
      setEmployeePassword('Welcome@123');
      setEmployeeRole('employee');
      setEmployeeDesg('');
      setEmployeeSalary('');
      setEmployeeJoining('');
      setShowAddModal(false);
      fetchEmployeesAndDepts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to onboard employee.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Department submit
  const handleAddDeptSubmit = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setActionLoading(true);

    try {
      await api.post('/employees/departments', {
        name: newDeptName,
        description: newDeptDesc
      });
      setNewDeptName('');
      setNewDeptDesc('');
      setShowDeptModal(false);
      fetchEmployeesAndDepts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Employee submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setActionLoading(true);

    try {
      await api.put(`/employees/${editingEmployee._id}`, {
        role: editRole,
        department: editDept,
        designation: editDesg,
        salary: Number(editSalary),
        status: editStatus
      });
      setEditingEmployee(null);
      fetchEmployeesAndDepts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Deactivate employee
  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    // Optimistic update — instantly remove from UI
    setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    try {
      await api.delete(`/employees/${id}`);
      // Refetch to stay in sync with server
      fetchEmployeesAndDepts();
    } catch (err) {
      alert('Failed to deactivate employee.');
      // Rollback — re-fetch to restore original list
      fetchEmployeesAndDepts();
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
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Employees Directory</h2>
          <p className="text-slate-400 text-sm mt-1">Manage employee records, onboard talent, and update departments.</p>
        </div>

        {isHrOrAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeptModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
            >
              <Building className="w-4 h-4" />
              Add Department
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/10"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Employee
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Employee Details</th>
                <th className="px-6 py-4">Role & Status</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Salary</th>
                {isHrOrAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {employees.map((emp) => (
                <tr key={emp._id} className="text-slate-300 text-sm hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-slate-100">{emp.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{emp.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {emp.role}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${emp.status === 'active' ? 'bg-emerald-500 pulse-slow' : 'bg-slate-500'}`} title={emp.status}></span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-350">
                    {emp.department ? emp.department.name : <span className="text-slate-600">-</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-350">{emp.designation || <span className="text-slate-600">-</span>}</td>
                  <td className="px-6 py-4 text-slate-100 font-medium">
                    ${(emp.salary || 0).toLocaleString()}
                  </td>
                  
                  {isHrOrAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEditRole(emp.role);
                            setEditDept(emp.department?._id || '');
                            setEditDesg(emp.designation || '');
                            setEditSalary(emp.salary || '');
                            setEditStatus(emp.status);
                          }}
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {emp.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(emp._id)}
                            className="p-2 bg-slate-900 hover:bg-rose-500/10 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --------------------- MODAL: ONBOARD EMPLOYEE --------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Onboard New Employee</h3>
              <p className="text-slate-400 text-xs mt-1">HR/Admin onboarding triggers automated pre-verification settings.</p>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Name</label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="e.g. Bruce Wayne"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Password</label>
                  <input
                    type="password"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Role</label>
                  <select
                    value={employeeRole}
                    onChange={(e) => setEmployeeRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Specialist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Department</label>
                  <select
                    value={employeeDept}
                    onChange={(e) => setEmployeeDept(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Designation</label>
                  <input
                    type="text"
                    value={employeeDesg}
                    onChange={(e) => setEmployeeDesg(e.target.value)}
                    placeholder="e.g. Technical Director"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Salary ($USD/Month)</label>
                  <input
                    type="number"
                    value={employeeSalary}
                    onChange={(e) => setEmployeeSalary(e.target.value)}
                    placeholder="e.g. 8000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Joining Date</label>
                  <input
                    type="date"
                    value={employeeJoining}
                    onChange={(e) => setEmployeeJoining(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:opacity-95"
                >
                  {actionLoading ? 'Saving...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------- MODAL: EDIT EMPLOYEE --------------------- */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Edit Profile: {editingEmployee.name}</h3>
              <p className="text-slate-400 text-xs mt-1">Adjust role, salary level, designation or department.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR Specialist</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Designation</label>
                <input
                  type="text"
                  value={editDesg}
                  onChange={(e) => setEditDesg(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Salary ($/Month)</label>
                <input
                  type="number"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Deactivated)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:opacity-95"
                >
                  {actionLoading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------- MODAL: ADD DEPARTMENT --------------------- */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Create Department</h3>
              <p className="text-slate-400 text-xs mt-1">Add a new operational department to the directory.</p>
            </div>

            <form onSubmit={handleAddDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Design Studio"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
                <textarea
                  rows={3}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Summarize the core functions of this department."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:opacity-95"
                >
                  {actionLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
