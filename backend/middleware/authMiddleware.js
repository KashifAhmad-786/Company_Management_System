const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route - verify JWT
const protect = async (req, res, next) => {
  let token;

  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_access_secret_key_change_me');

    // Get user from database (omit password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Pass user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error(`JWT validation error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

// Check if user is verified
const verified = (req, res, next) => {
  if (req.user && !req.user.isVerified) {
    return res.status(403).json({ success: false, code: 'EMAIL_UNVERIFIED', message: 'Account must be verified via OTP' });
  }
  next();
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = {
  protect,
  verified,
  authorize,
};
