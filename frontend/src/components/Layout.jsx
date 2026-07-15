import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Briefcase, 
  FileText, 
  CreditCard, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X,
  User as UserIcon,
  Shield,
  Clock,
  CalendarDays,
  CalendarCheck
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation based on role
  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      roles: ['admin', 'hr', 'manager', 'employee'] 
    },
    { 
      name: 'Employees', 
      path: '/employees', 
      icon: Users,
      roles: ['admin', 'hr', 'manager'] 
    },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: Briefcase,
      roles: ['admin', 'manager', 'employee'] 
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: FileText,
      roles: ['admin', 'hr', 'manager', 'employee'] 
    },
    { 
      name: 'Payroll & Salary', 
      path: '/payroll', 
      icon: CreditCard,
      roles: ['hr', 'employee'] 
    },
    { 
      name: 'My Leaves', 
      path: '/leave', 
      icon: CalendarDays,
      roles: ['hr', 'manager', 'employee'] 
    },
    { 
      name: 'Leave Management', 
      path: '/hr/leaves', 
      icon: CalendarCheck,
      roles: ['hr'] 
    }
  ];

  // Filter items matching user role
  const menuItems = navigationItems.filter(item => item.roles.includes(user.role));

  const roleColors = {
    admin: 'from-pink-500/20 to-rose-500/20 border-rose-500/30 text-rose-400',
    hr: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
    manager: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-400',
    employee: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800 p-6 z-10">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-cyan-400 rounded-xl shadow-lg shadow-brand-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              CoManage
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Enterprise</p>
          </div>
        </div>

        {/* User Card */}
        <div className={`p-4 rounded-xl border bg-gradient-to-br ${roleColors[user.role] || 'from-slate-800 to-slate-900 border-slate-700'} mb-8`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900/60 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h4 className="font-semibold text-sm text-slate-100 truncate">{user.name}</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/5 text-brand-400 border border-brand-500/20 shadow-md shadow-brand-500/5' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-400 rounded-xl text-sm font-medium transition-colors border border-transparent hover:bg-rose-500/5"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-brand-600 to-cyan-400 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-white">CoManage</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-900 text-slate-300 rounded-lg border border-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[69px] z-50 bg-slate-950/95 flex flex-col p-6 space-y-4 animate-fadeIn">
          {/* User Card Mobile */}
          <div className={`p-4 rounded-xl border bg-gradient-to-br ${roleColors[user.role]} mb-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900/50 rounded-lg">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-100">{user.name}</h4>
                <p className="text-xs uppercase font-bold tracking-wider opacity-80">{user.role}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-4 text-rose-400 rounded-xl text-base font-medium hover:bg-rose-500/5 border border-transparent"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
};

export default Layout;
