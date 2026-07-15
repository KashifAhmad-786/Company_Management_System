const express = require('express');
const passport = require('passport');
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  refreshSessionToken,
  logout,
  googleAuthSuccess,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword
} = require('../utils/validation');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://company-management-system-mu.vercel.app';

const router = express.Router();

// Local auth routes
router.post('/signup', validateSignup, signup);
router.post('/verify-otp', validateVerifyOtp, verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshSessionToken);
router.post('/logout', logout);

// Forgot & Reset password routes
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`, 
    session: false 
  }),
  googleAuthSuccess
);

module.exports = router;
