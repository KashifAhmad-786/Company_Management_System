const express = require('express');
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  createDepartment,
  getDepartments
} = require('../controllers/employeeController');
const { protect, verified, authorize } = require('../middleware/authMiddleware');
const { validateEmployeeCreate } = require('../utils/validation');

const router = express.Router();

// Apply auth protection and OTP check to all employee routes
router.use(protect);
router.use(verified);

// Departments (Available to all verified logged in users to list; create only for Admin/HR)
router.get('/departments', getDepartments);
router.post('/departments', authorize('admin', 'hr'), createDepartment);

// Employees CRUD
router.post('/', authorize('admin', 'hr'), validateEmployeeCreate, createEmployee);
router.get('/', authorize('admin', 'hr', 'manager'), getEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.delete('/:id', authorize('admin', 'hr'), deleteEmployee);

module.exports = router;
