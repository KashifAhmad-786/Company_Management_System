const { body, validationResult } = require('express-validator');

// Helper to check validation results and return error response
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const validateSignup = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateRequest
];

const validateLogin = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const validateVerifyOtp = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits'),
  validateRequest
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  validateRequest
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateRequest
];

const validateEmployeeCreate = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Provide a valid email address').normalizeEmail(),
  body('role').isIn(['admin', 'hr', 'manager', 'employee']).withMessage('Invalid role'),
  body('department').notEmpty().withMessage('Department ID is required'),
  body('designation').notEmpty().withMessage('Designation is required').trim(),
  body('salary').isNumeric().withMessage('Salary must be a number'),
  validateRequest
];

const validateTaskCreate = [
  body('title').notEmpty().withMessage('Task title is required').trim(),
  body('assignedTo').notEmpty().withMessage('Assigned employee ID is required'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('deadline').notEmpty().withMessage('Deadline is required').isISO8601().withMessage('Deadline must be a valid date'),
  validateRequest
];

const validateReportCreate = [
  body('type').isIn(['daily', 'weekly']).withMessage('Report type must be daily or weekly'),
  body('content').notEmpty().withMessage('Report content is required').trim(),
  validateRequest
];

module.exports = {
  validateSignup,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
  validateEmployeeCreate,
  validateTaskCreate,
  validateReportCreate,
};
