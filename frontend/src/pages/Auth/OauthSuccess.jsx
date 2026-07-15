import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OauthSuccess = () => {
  const { loginWithGoogleToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      loginWithGoogleToken(token);
      // Wait a moment for context to populate
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      return () => clearTimeout(timer);
    } else {
      navigate('/login?error=OAuth failed, no token returned');
    }
  }, [searchParams, navigate, loginWithGoogleToken]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">Establishing secure session...</p>
    </div>
  );
};

export default OauthSuccess;
