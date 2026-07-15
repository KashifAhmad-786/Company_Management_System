import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VerifyOtp from './pages/Auth/VerifyOtp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import OauthSuccess from './pages/Auth/OauthSuccess';

// Workspace Pages
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Payroll from './pages/Payroll';
import Leave from './pages/Leave';
import HRLeave from './pages/HRLeave';

// Shield Alert Icon for Access Denied page
import { ShieldAlert } from 'lucide-react';

// Route Guard for authenticated users
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full mb-4 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Your account role (<strong className="uppercase">{user.role}</strong>) does not possess authorization to view this panel.
        </p>
      </div>
    );
  }

  return children;
};

// Route Guard for guests only (redirects to dashboard if logged in)
const GuestRoute = ({ children }) => {
  const { user, token } = useAuth();

  if (user && token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Redirect Root to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Guest Routes */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/verify-otp" element={<GuestRoute><VerifyOtp /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/oauth-success" element={<OauthSuccess />} />

      {/* Workspace Protected Routes (Wrapped in Layout) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/employees" element={
        <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
          <Layout>
            <Employees />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/tasks" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
          <Layout>
            <Tasks />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/payroll" element={
        <ProtectedRoute allowedRoles={['hr', 'employee']}>
          <Layout>
            <Payroll />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/leave" element={
        <ProtectedRoute allowedRoles={['hr', 'manager', 'employee']}>
          <Layout>
            <Leave />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/hr/leaves" element={
        <ProtectedRoute allowedRoles={['hr']}>
          <Layout>
            <HRLeave />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Fallback 404 Route */}
      <Route path="*" element={
        <div className="flex flex-col items-center justify-center min-h-screen text-center bg-slate-950 p-6">
          <h1 className="text-6xl font-extrabold text-brand-500">404</h1>
          <h3 className="text-xl font-bold text-white mt-4">Page Not Found</h3>
          <p className="text-slate-400 text-sm mt-2">The requested URL is not available.</p>
          <a href="/dashboard" className="mt-6 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-xl text-xs font-semibold">
            Return to Dashboard
          </a>
        </div>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
