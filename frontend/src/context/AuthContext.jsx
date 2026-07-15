import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Clear auth error when path changes or on demand
  const clearError = () => setAuthError(null);

  // Handle session expiration event
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      setAuthError('Your session has expired. Please log in again.');
    };

    window.addEventListener('auth-session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth-session-expired', handleSessionExpired);
  }, []);

  // Signup
  const signup = async (name, email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      setLoading(false);
      return response.data; // { success: true, message: '...', email }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Signup failed. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Verify OTP
  const verifyOtp = async (email, otp) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(accessToken);
      setUser(userData);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'OTP verification failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Resend OTP
  const resendOtp = async (email) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-otp', { email });
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to resend OTP.';
      throw new Error(msg);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      const resData = error.response?.data;
      
      // Handle the case where user is verified: false (returns 403 and EMAIL_UNVERIFIED)
      if (error.response?.status === 403 && resData?.code === 'EMAIL_UNVERIFIED') {
        return { isUnverified: true, email: resData.email, message: resData.message };
      }

      const msg = resData?.message || 'Login failed. Invalid credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Login with Google OAuth token (used on the callback screen)
  const loginWithGoogleToken = (accessToken) => {
    setLoading(true);
    try {
      // Decode JWT token payload to get basic user details
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      
      const userData = {
        id: payload.id,
        role: payload.role,
        // Name/Email will load on dashboard call or via subsequent checks, but we save basic payload
        name: payload.name || 'User', 
        email: payload.email || ''
      };

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setAuthError('Google login parsing failed.');
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to send password reset request.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setLoading(false);
      return response.data;
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Failed to reset password.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        clearError,
        signup,
        verifyOtp,
        resendOtp,
        login,
        loginWithGoogleToken,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
