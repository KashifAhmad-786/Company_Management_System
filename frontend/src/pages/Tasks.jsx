import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();
  
  // Data list
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Task Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Task Details Modal State
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasksAndEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const promises = [api.get('/tasks')];
      
      // If manager or admin, fetch active employee list to allow assigning tasks
      if (['admin', 'hr', 'manager'].includes(user.role)) {
        promises.push(api.get('/employees'));
      }

      const results = await Promise.all(promises);
      setTasks(results[0].data.tasks);

      if (results[1]) {
        const activeEmps = results[1].data.employees.filter(e => e.status === 'active');
        setEmployees(activeEmps);
        if (activeEmps.length > 0) {
          setTaskAssignedTo(activeEmps[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndEmployees();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssignedTo || !taskDeadline) return;
    setActionLoading(true);
    setError('');

    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        assignedTo: taskAssignedTo,
        priority: taskPriority,
        deadline: taskDeadline
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('medium');
      setTaskDeadline('');
      setShowAddModal(false);
      fetchTasksAndEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setActionLoading(true);

    try {
      await api.put(`/tasks/${editingTask._id}`, {
        title: editTitle,
        description: editDesc,
        assignedTo: editAssignedTo,
        priority: editPriority,
        deadline: editDeadline,
        status: editStatus
      });
      setEditingTask(null);
      fetchTasksAndEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      fetchTasksAndEmployees();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasksAndEmployees();
    } catch (err) {
      alert('Failed to delete task.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const canCreateTask = ['admin', 'hr', 'manager'].includes(user.role);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Task Center</h2>
          <p className="text-slate-400 text-sm mt-1">Track assignments, priorities, deadlines, and completion statuses.</p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 hover:opacity-95 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/10"
          >
            <Plus className="w-4 h-4" />
            Assign Task
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Task List Grid */}
      {tasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800">
          <p className="text-slate-500 text-sm">No tasks assigned yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task._id} className="glass-card rounded-2xl border border-slate-800 p-6 flex flex-col justify-between hover-scale group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-0.5 border rounded-md text-[10px] uppercase font-bold tracking-wider ${
                    task.priority === 'high' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                    task.priority === 'medium' ? 'bg-brand-500/10 border-brand-500/25 text-brand-400' :
                    'bg-slate-500/10 border-slate-500/25 text-slate-400'
                  }`}>
                    {task.priority} Priority
                  </span>

                  <span className={`px-2.5 py-0.5 border rounded-full text-xs font-semibold capitalize ${
                    task.status === 'done' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                    task.status === 'inprogress' ? 'bg-brand-500/10 border-brand-500/25 text-brand-400' :
                    'bg-slate-500/10 border-slate-500/25 text-slate-400'
                  }`}>
                    {task.status === 'inprogress' ? 'In Progress' : task.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">{task.title}</h3>
                <p className="text-slate-400 text-xs mt-2 line-clamp-3 min-h-[48px]">{task.description}</p>
                
                {/* Meta details */}
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-905 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                    {task.isOverdue && (
                      <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold">Overdue</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned to: <strong className="text-slate-400 font-bold">{task.assignedTo?.name}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-900">
                <button
                  onClick={() => setSelectedTask(task)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  View Details & Audit Log
                </button>

                <div className="flex items-center gap-2">
                  {user.role === 'employee' ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                  ) : (
                    // Managers or Admins can edit/delete tasks they assigned
                    (user.role === 'admin' || user.role === 'hr' || (user.role === 'manager' && task.assignedBy?._id === user.id)) && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setEditTitle(task.title);
                            setEditDesc(task.description || '');
                            setEditAssignedTo(task.assignedTo?._id || '');
                            setEditPriority(task.priority);
                            setEditDeadline(new Date(task.deadline).toISOString().substr(0, 10));
                            setEditStatus(task.status);
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-300 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-850 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --------------------- MODAL: ASSIGN TASK --------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Assign Task</h3>
              <p className="text-slate-400 text-xs mt-1">Assign deliverables to active team members.</p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Redesign Settings Panel"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Summarize the core requirements, deliverables, and targets."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Assign To</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Deadline</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                  required
                />
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
                  {actionLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------- MODAL: EDIT TASK --------------------- */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white">Edit Task Parameters</h3>
              <p className="text-slate-400 text-xs mt-1">Adjust title, status, or assignment.</p>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Assign To</label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Deadline</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none"
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
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:opacity-95"
                >
                  {actionLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------- MODAL: TASK DETAIL & AUDIT LOG --------------------- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel border border-slate-800 rounded-3xl max-w-lg w-full p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Task Specifications</h3>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Title</h4>
                <p className="text-slate-200 text-sm font-semibold mt-1">{selectedTask.title}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                <p className="text-slate-400 text-xs mt-1.5 whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Employee</h4>
                  <p className="text-slate-200 text-xs mt-1">{selectedTask.assignedTo?.name} ({selectedTask.assignedTo?.designation})</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned By</h4>
                  <p className="text-slate-200 text-xs mt-1">{selectedTask.assignedBy?.name || 'System / Seed'}</p>
                </div>
              </div>

              {/* AUDIT TRAIL LOG */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audit History & status updates</h4>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-2xl max-h-40 overflow-y-auto space-y-3">
                  {selectedTask.history && selectedTask.history.length > 0 ? (
                    selectedTask.history.map((log, index) => (
                      <div key={index} className="flex items-start gap-3 text-[11px] text-slate-400 border-l border-slate-800 pl-3 relative">
                        <div className="absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full bg-brand-500"></div>
                        <div>
                          <span>Status set to <strong className="text-brand-400 uppercase">{log.status}</strong></span>
                          <span className="text-slate-500 block mt-0.5">
                            Changed on {new Date(log.changedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs italic">No history log exists.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
