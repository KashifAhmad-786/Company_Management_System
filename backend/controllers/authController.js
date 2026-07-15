const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail, sendResetPasswordEmail } = require('../services/emailService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://company-management-system-mu.vercel.app';

// Helper to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me',
    { expiresIn: '15m' }
  );
};

// Helper to generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me',
    { expiresIn: '7d' }
  );
};

// Helper to set refresh token in cookie
const sendRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Signup controller
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (password will be hashed in pre-save hook)
    const user = new User({
      name,
      email,
      password,
      provider: 'local',
      isVerified: false,
      otpCode,
      otpExpiresAt,
      role: 'employee' // Default role for local self-signups
    });

    await user.save();

    // Send OTP email
    await sendOtpEmail(email, otpCode);

    res.status(201).json({
      success: true,
      message: 'Signup successful. Please check your email for the 6-digit OTP code to verify your account.',
      email
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP controller
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // Check if OTP matches
    if (user.otpCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    // Check if OTP is expired
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired' });
    }

    // Clear OTP fields and set verified status
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token as HTTP-only cookie
    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP controller
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP email
    await sendOtpEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// Login controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('department');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // For Google OAuth signed up users trying to log in locally without password
    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({ 
        success: false, 
        message: 'This account was registered using Google. Please log in using Google sign-in.' 
      });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is verified
    if (!user.isVerified) {
      // Re-trigger OTP code creation and sending
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.otpCode = otpCode;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      await sendOtpEmail(email, otpCode);

      return res.status(403).json({
        success: false,
        code: 'EMAIL_UNVERIFIED',
        message: 'Your email is not verified. A 6-digit OTP code has been sent to your email.',
        email
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Send refresh token cookie
    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        designation: user.designation
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token controller (JWT rotation)
const refreshSessionToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key_change_me');

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Session invalid or expired' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    // Send cookie
    sendRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error(`Refresh token error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
  }
};

// Logout controller
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Google OAuth Success Callback controller
// This handles generating tokens for users logging in via Google
const googleAuthSuccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect(`${FRONTEND_URL}/login?error=Google auth failed`);
    }

    const user = req.user;

    // Check verification status
    if (!user.isVerified) {
      // Redirect to OTP verification page on the frontend
      return res.redirect(
        `${FRONTEND_URL}/verify-otp?email=${encodeURIComponent(user.email)}&status=unverified`
      );
    }

    if (user.status !== 'active') {
      return res.redirect(`${FRONTEND_URL}/login?error=Account deactivated`);
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in cookie (must use redirect here, but cookies work across domains if configured)
    sendRefreshTokenCookie(res, refreshToken);

    // Redirect to frontend callback page with the access token
    return res.redirect(
      `${FRONTEND_URL}/oauth-success?token=${accessToken}`
    );
  } catch (error) {
    console.error(`Google auth success error: ${error.message}`);
    return res.redirect(`${FRONTEND_URL}/login?error=Server error`);
  }
};

// Forgot Password Request
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak details but return true to prevent user enumeration
      return res.status(200).json({ 
        success: true, 
        message: 'If the email matches an account, a reset link has been sent.' 
      });
    }

    // Generate password reset token (10 minute expiry)
    const resetToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me',
      { expiresIn: '10m' }
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If the email matches an account, a reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password Action
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me');
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    // Clear any active OTP to prevent verification issues
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  refreshSessionToken,
  logout,
  googleAuthSuccess,
  forgotPassword,
  resetPassword
};
